ALTER TABLE public.assessments ADD COLUMN sources jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.assessments ADD COLUMN deadline_at timestamptz;
ALTER TABLE public.assessments ADD COLUMN generation_metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.assessment_questions ADD COLUMN source_ids text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.assessment_questions ADD COLUMN subject text;
ALTER TABLE public.assessment_questions ADD COLUMN rubric jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.assessment_questions ADD COLUMN estimated_minutes integer;
ALTER TABLE public.assessment_answers ADD COLUMN grading_details jsonb;
CREATE UNIQUE INDEX assessment_answer_unique ON public.assessment_answers(assessment_id,question_id);
ALTER TABLE public.revision_items ADD COLUMN assessment_id uuid REFERENCES public.assessments ON DELETE CASCADE;
ALTER TABLE public.revision_items ADD COLUMN question_id uuid REFERENCES public.assessment_questions ON DELETE CASCADE;
CREATE UNIQUE INDEX assessment_revision_unique ON public.revision_items(assessment_id,question_id);
DROP POLICY "Users can CRUD own assessments" ON public.assessments;
CREATE POLICY assessment_owner_read ON public.assessments FOR SELECT USING(user_id=auth.uid());
DROP POLICY "Users can view own questions" ON public.assessment_questions;
CREATE POLICY question_owner_read ON public.assessment_questions FOR SELECT USING(EXISTS(SELECT 1 FROM public.assessments a WHERE a.id=assessment_id AND a.user_id=auth.uid()));
DROP POLICY "Users can CRUD own answers" ON public.assessment_answers;
CREATE POLICY answer_owner_read ON public.assessment_answers FOR SELECT USING(EXISTS(SELECT 1 FROM public.assessments a WHERE a.id=assessment_id AND a.user_id=auth.uid()));
-- Answer keys, rubrics and explanations are unavailable through the authenticated Data API.
REVOKE ALL ON public.assessment_questions FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,assessment_id,section,question_type,question_text,options,marks,difficulty,topic,order_index,created_at,source_ids,subject,estimated_minutes) ON public.assessment_questions TO authenticated;

CREATE FUNCTION public.start_assessment(target uuid) RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a assessments;
BEGIN
 SELECT * INTO a FROM assessments WHERE id=target AND user_id=auth.uid() FOR UPDATE;
 IF a.id IS NULL THEN RAISE EXCEPTION 'Assessment not found'; END IF;
 IF a.status='draft' THEN UPDATE assessments SET status='in_progress',started_at=now(),deadline_at=now()+interval '60 minutes' WHERE id=target RETURNING * INTO a; END IF;
 RETURN a.deadline_at;
END $$;
CREATE FUNCTION public.save_assessment_answers(target uuid,payload jsonb,submit boolean DEFAULT false) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a assessments; entry record;
BEGIN
 SELECT * INTO a FROM assessments WHERE id=target AND user_id=auth.uid() FOR UPDATE;
 IF a.id IS NULL THEN RAISE EXCEPTION 'Assessment not found'; END IF;
 IF a.status IN('submitted','evaluated') THEN RETURN a.status; END IF;
 IF a.status<>'in_progress' THEN RAISE EXCEPTION 'Start assessment first'; END IF;
 IF jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>250000 THEN RAISE EXCEPTION 'Invalid answers'; END IF;
 IF now()<=a.deadline_at THEN
  FOR entry IN SELECT * FROM jsonb_each_text(payload) LOOP
   IF length(entry.value)>15000 OR NOT EXISTS(SELECT 1 FROM assessment_questions WHERE id=entry.key::uuid AND assessment_id=target) THEN RAISE EXCEPTION 'Invalid question or answer'; END IF;
   INSERT INTO assessment_answers(assessment_id,question_id,user_answer,answered_at) VALUES(target,entry.key::uuid,entry.value,now()) ON CONFLICT(assessment_id,question_id) DO UPDATE SET user_answer=excluded.user_answer,answered_at=excluded.answered_at;
  END LOOP;
 END IF;
 IF submit OR now()>a.deadline_at THEN UPDATE assessments SET status='submitted',submitted_at=now(),time_spent_seconds=least(3600,greatest(0,extract(epoch FROM now()-a.started_at)::int)) WHERE id=target;RETURN 'submitted'; END IF;
 RETURN 'in_progress';
END $$;
-- Only the server's service role may create complete exams or finalize AI marks.
CREATE FUNCTION public.persist_generated_assessment(owner_id uuid,payload jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE aid uuid; q jsonb; n integer:=0; total numeric;
BEGIN
 SELECT sum((value->>'marks')::numeric) INTO total FROM jsonb_array_elements(payload->'questions');
 INSERT INTO assessments(user_id,title,duration_minutes,total_questions,total_marks,status,sources,generation_metadata,subjects,topics)
 VALUES(owner_id,payload->>'title',60,jsonb_array_length(payload->'questions'),total,'draft',payload->'sources',payload->'metadata',ARRAY(SELECT DISTINCT value->>'subject' FROM jsonb_array_elements(payload->'questions')),ARRAY(SELECT DISTINCT value->>'topic' FROM jsonb_array_elements(payload->'questions'))) RETURNING id INTO aid;
 FOR q IN SELECT value FROM jsonb_array_elements(payload->'questions') LOOP
  INSERT INTO assessment_questions(id,assessment_id,section,question_type,question_text,options,correct_answer,explanation,marks,topic,subject,rubric,source_ids,estimated_minutes,order_index)
  VALUES((q->>'id')::uuid,aid,CASE q->>'type' WHEN 'mcq' THEN 'concept_recall' WHEN 'coding' THEN 'practical_application' ELSE 'conceptual_understanding' END,q->>'type',q->>'question',q->'options',q->>'correctAnswer',q->>'explanation',(q->>'marks')::numeric,q->>'topic',q->>'subject',q->'rubric',ARRAY(SELECT jsonb_array_elements_text(q->'sourceIds')),(q->>'minutes')::int,n);n:=n+1;
 END LOOP;RETURN aid;
END $$;
CREATE FUNCTION public.finalize_assessment(target uuid,owner_id uuid,payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a assessments; g jsonb; q assessment_questions; score_total numeric:=0; strong_topics text[]:='{}'; weak_topics text[]:='{}'; pct numeric; today date;
BEGIN
 SELECT * INTO a FROM assessments WHERE id=target AND user_id=owner_id FOR UPDATE;
 IF a.id IS NULL THEN RAISE EXCEPTION 'Assessment not found'; END IF;
 IF a.status='evaluated' THEN RETURN; END IF;
 IF a.status<>'submitted' THEN RAISE EXCEPTION 'Submit answers first'; END IF;
 IF jsonb_array_length(payload)<>a.total_questions OR (SELECT count(DISTINCT value->>'questionId') FROM jsonb_array_elements(payload))<>a.total_questions THEN RAISE EXCEPTION 'Incomplete grading'; END IF;
 SELECT (now() AT TIME ZONE timezone)::date INTO today FROM profiles WHERE id=owner_id;
 FOR g IN SELECT value FROM jsonb_array_elements(payload) LOOP
  SELECT * INTO q FROM assessment_questions WHERE id=(g->>'questionId')::uuid AND assessment_id=target;
  IF q.id IS NULL OR (g->>'marksAwarded')::numeric NOT BETWEEN 0 AND q.marks THEN RAISE EXCEPTION 'Invalid score'; END IF;
  score_total:=score_total+(g->>'marksAwarded')::numeric;
  INSERT INTO assessment_answers(assessment_id,question_id,user_answer,marks_awarded,is_correct,ai_feedback,grading_details) VALUES(target,q.id,'',(g->>'marksAwarded')::numeric,(g->>'isCorrect')::boolean,g->>'feedback',g)
  ON CONFLICT(assessment_id,question_id) DO UPDATE SET marks_awarded=excluded.marks_awarded,is_correct=excluded.is_correct,ai_feedback=excluded.ai_feedback,grading_details=excluded.grading_details;
  IF (g->>'marksAwarded')::numeric<q.marks*0.6 THEN
   weak_topics:=array_append(weak_topics,q.topic);
   INSERT INTO revision_items(user_id,subject,topic,content,item_type,next_review_date,assessment_id,question_id) VALUES(owner_id,q.subject,q.topic,concat(g->>'feedback',E'\nMissing concepts: ',(g->'missingConcepts')::text,E'\nSource IDs: ',q.source_ids::text),'concept',today+1,target,q.id) ON CONFLICT(assessment_id,question_id) DO NOTHING;
  ELSIF (g->>'marksAwarded')::numeric>=q.marks*0.8 THEN strong_topics:=array_append(strong_topics,q.topic);END IF;
  pct:=round(100*(g->>'marksAwarded')::numeric/q.marks,2);
  INSERT INTO topic_mastery(user_id,subject,topic,score,questions_attempted,questions_correct,last_assessed_at,mastery_level) VALUES(owner_id,q.subject,q.topic,pct,1,CASE WHEN (g->>'isCorrect')::boolean THEN 1 ELSE 0 END,now(),'developing')
   ON CONFLICT(user_id,subject,topic) DO UPDATE SET score=round((topic_mastery.score*topic_mastery.questions_attempted+excluded.score)/(topic_mastery.questions_attempted+1),2),questions_attempted=topic_mastery.questions_attempted+1,questions_correct=topic_mastery.questions_correct+excluded.questions_correct,last_assessed_at=now(),mastery_level='developing';
 END LOOP;
 UPDATE assessments SET status='evaluated',score=score_total,percentage=round(100*score_total/greatest(total_marks,1),2),strengths=ARRAY(SELECT DISTINCT unnest(strong_topics)),weaknesses=ARRAY(SELECT DISTINCT unnest(weak_topics)),ai_feedback='Review the per-question evidence and rubric. Coding scores are AI review, not executed-code verification.',updated_at=now() WHERE id=target;
END $$;
REVOKE ALL ON FUNCTION public.start_assessment(uuid),public.save_assessment_answers(uuid,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.start_assessment(uuid),public.save_assessment_answers(uuid,jsonb,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.persist_generated_assessment(uuid,jsonb),public.finalize_assessment(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.persist_generated_assessment(uuid,jsonb),public.finalize_assessment(uuid,uuid,jsonb) TO service_role;
GRANT ALL ON public.assessments,public.assessment_questions,public.assessment_answers,public.topic_mastery,public.revision_items TO service_role;
CREATE FUNCTION public.rate_revision(target uuid,quality integer) RETURNS date LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r revision_items; ef numeric; days integer; today date;
BEGIN
 IF quality IS NULL OR quality NOT BETWEEN 0 AND 5 THEN RAISE EXCEPTION 'Invalid recall quality'; END IF;
 SELECT * INTO r FROM revision_items WHERE id=target AND user_id=auth.uid() FOR UPDATE;
 SELECT (now() AT TIME ZONE timezone)::date INTO today FROM profiles WHERE id=auth.uid();
 IF r.id IS NULL OR r.status<>'active' OR r.next_review_date>today THEN RAISE EXCEPTION 'Review is not due'; END IF;
 ef:=greatest(1.3,r.ease_factor+0.1-(5-quality)*(0.08+(5-quality)*0.02));
 days:=CASE WHEN quality<3 THEN 1 WHEN r.repetitions=0 THEN 1 WHEN r.repetitions=1 THEN 6 ELSE greatest(1,round(r.interval_days*ef)::int) END;
 UPDATE revision_items SET interval_days=days,ease_factor=ef,repetitions=CASE WHEN quality<3 THEN 0 ELSE repetitions+1 END,last_quality=quality,next_review_date=today+days,updated_at=now() WHERE id=target;
 RETURN today+days;
END $$;
REVOKE ALL ON FUNCTION public.rate_revision(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rate_revision(uuid,integer) TO authenticated;
-- Export/reset must include new routine data and work with protected assessment writes.
CREATE OR REPLACE FUNCTION public.export_preparation_data() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid:=auth.uid(); name text; records jsonb; result jsonb:='{}'; clause text;
BEGIN
 IF caller IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 FOREACH name IN ARRAY ARRAY['profiles','roadmaps','roadmap_phases','roadmap_milestones','roadmap_topics','learning_tracks','youtube_playlists','playlist_videos','daily_tasks','study_sessions','journal_entries','assessments','assessment_questions','assessment_answers','topic_mastery','revision_items','dsa_problems','job_applications','ai_conversations','activity_log','notifications','weekly_routines','routine_versions'] LOOP
  clause:=CASE name WHEN 'profiles' THEN 't.id=$1'
   WHEN 'roadmap_phases' THEN 'EXISTS(SELECT 1 FROM roadmaps p WHERE p.id=t.roadmap_id AND p.user_id=$1)'
   WHEN 'roadmap_milestones' THEN 'EXISTS(SELECT 1 FROM roadmap_phases p JOIN roadmaps r ON r.id=p.roadmap_id WHERE p.id=t.phase_id AND r.user_id=$1)'
   WHEN 'roadmap_topics' THEN 'EXISTS(SELECT 1 FROM roadmap_milestones m JOIN roadmap_phases p ON p.id=m.phase_id JOIN roadmaps r ON r.id=p.roadmap_id WHERE m.id=t.milestone_id AND r.user_id=$1)'
   WHEN 'playlist_videos' THEN 'EXISTS(SELECT 1 FROM youtube_playlists p WHERE p.id=t.playlist_id AND p.user_id=$1)'
   WHEN 'assessment_questions' THEN 'EXISTS(SELECT 1 FROM assessments p WHERE p.id=t.assessment_id AND p.user_id=$1)'
   WHEN 'assessment_answers' THEN 'EXISTS(SELECT 1 FROM assessments p WHERE p.id=t.assessment_id AND p.user_id=$1)'
   ELSE 't.user_id=$1' END;
  IF name='assessment_questions' THEN
   EXECUTE 'SELECT coalesce(jsonb_agg(CASE WHEN EXISTS(SELECT 1 FROM assessments a WHERE a.id=t.assessment_id AND a.status=''evaluated'') THEN to_jsonb(t) ELSE to_jsonb(t)-''correct_answer''-''explanation''-''rubric'' END),''[]'') FROM assessment_questions t WHERE '||clause INTO records USING caller;
  ELSE EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(t)),''[]'') FROM public.%I t WHERE ',name)||clause INTO records USING caller; END IF;
  result:=result||jsonb_build_object(name,records);
 END LOOP;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.clear_preparation_data() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid:=auth.uid(); name text;
BEGIN
 IF caller IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 PERFORM 1 FROM profiles WHERE id=caller FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized';END IF;
 FOREACH name IN ARRAY ARRAY['notifications','activity_log','ai_conversations','job_applications','dsa_problems','revision_items','topic_mastery','assessments','study_sessions','daily_tasks','weekly_routines','journal_entries','youtube_playlists','learning_tracks','roadmaps'] LOOP
  EXECUTE format('DELETE FROM public.%I WHERE user_id=$1',name) USING caller;
 END LOOP;
 UPDATE profiles SET full_name=NULL,avatar_url=NULL,target_role='SDE-1',education_level=NULL,target_date=NULL,target_companies='{}',preparation_level='beginner',daily_study_hours=3,available_days=ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],strong_subjects='{}',weak_subjects='{}',completed_topics='{}',study_preference='structured',preparation_subjects='{}',onboarding_completed=false,timezone='Asia/Kolkata',planning_preferences='{}' WHERE id=caller;
END $$;
REVOKE ALL ON FUNCTION public.export_preparation_data(),public.clear_preparation_data() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.export_preparation_data(),public.clear_preparation_data() TO authenticated;
