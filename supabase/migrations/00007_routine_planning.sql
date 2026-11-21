-- Additive planning workflow. Existing learning/task records are preserved.
ALTER TABLE public.roadmap_topics ADD COLUMN subject text;
ALTER TABLE public.roadmap_topics ADD COLUMN prerequisites uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.roadmap_topics ADD COLUMN resource_url text;
ALTER TABLE public.profiles ADD COLUMN planning_preferences jsonb NOT NULL DEFAULT '{}';
CREATE TABLE public.weekly_routines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
 week date NOT NULL, version integer NOT NULL DEFAULT 1, state text NOT NULL DEFAULT 'DRAFT' CHECK(state IN('DRAFT','AWAITING_APPROVAL','ACTIVE','ARCHIVED')),
 draft jsonb NOT NULL, approved jsonb, approved_version integer, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,week)
);
ALTER TABLE public.weekly_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY routine_owner_read ON public.weekly_routines FOR SELECT USING(user_id=auth.uid());
CREATE TABLE public.routine_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), routine_id uuid NOT NULL REFERENCES public.weekly_routines ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE, version integer NOT NULL, snapshot jsonb NOT NULL, summary text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(routine_id,version)
);
ALTER TABLE public.routine_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY routine_version_owner_read ON public.routine_versions FOR SELECT USING(user_id=auth.uid());
ALTER TABLE public.daily_tasks ADD COLUMN routine_id uuid REFERENCES public.weekly_routines ON DELETE SET NULL;
ALTER TABLE public.daily_tasks ADD COLUMN routine_session_id uuid;
ALTER TABLE public.daily_tasks ADD COLUMN scheduled_start integer;
CREATE UNIQUE INDEX daily_routine_session ON public.daily_tasks(routine_id,routine_session_id);

CREATE FUNCTION public.save_reviewed_roadmap(payload jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rid uuid; pid uuid; mid uuid; t jsonb; n integer:=0;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF payload->>'title' IS NULL OR jsonb_typeof(payload->'topics') IS DISTINCT FROM 'array' OR length(payload->>'title') NOT BETWEEN 1 AND 160 OR jsonb_array_length(payload->'topics') NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Invalid roadmap'; END IF;
 INSERT INTO roadmaps(user_id,title,source,status) VALUES(auth.uid(),payload->>'title','manual','active') RETURNING id INTO rid;
 INSERT INTO roadmap_phases(roadmap_id,title) VALUES(rid,'Reviewed learning plan') RETURNING id INTO pid;
 INSERT INTO roadmap_milestones(phase_id,title) VALUES(pid,'Subject learning objectives') RETURNING id INTO mid;
 FOR t IN SELECT value FROM jsonb_array_elements(payload->'topics') LOOP
  IF t->>'id' IS NULL OR t->>'title' IS NULL OR t->>'subject' IS NULL OR t->>'minutes' IS NULL OR length(t->>'subject') NOT BETWEEN 1 AND 120 OR length(t->>'title') NOT BETWEEN 1 AND 240 OR (t->>'minutes')::int NOT BETWEEN 15 AND 2400 THEN RAISE EXCEPTION 'Invalid topic'; END IF;
  INSERT INTO roadmap_topics(id,milestone_id,title,subject,estimated_hours,prerequisites,resource_url,description,order_index,status)
   VALUES((t->>'id')::uuid,mid,t->>'title',t->>'subject',(t->>'minutes')::numeric/60,ARRAY(SELECT jsonb_array_elements_text(t->'prerequisites')::uuid),nullif(t->>'resource',''),t->>'sourceReference',n,CASE WHEN (t->>'completed')::boolean THEN 'completed' ELSE 'pending' END);
  n:=n+1;
 END LOOP;
 UPDATE roadmaps SET total_tasks=n WHERE id=rid;
 RETURN rid;
END $$;

-- Server-side constraints remain authoritative even if a caller bypasses the editor.
CREATE FUNCTION public.validate_routine_payload(p jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s jsonb; rule jsonb; win jsonb; d date; total integer; topic jsonb; prereq text; pt jsonb;
BEGIN
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR jsonb_typeof(p->'sessions') IS DISTINCT FROM 'array' OR jsonb_typeof(p->'windows') IS DISTINCT FROM 'array' OR jsonb_typeof(p->'rules') IS DISTINCT FROM 'array' OR jsonb_typeof(p->'topics') IS DISTINCT FROM 'array' OR p->>'week' IS NULL OR p->>'maxSubjects' IS NULL OR jsonb_array_length(p->'sessions')>140 OR jsonb_array_length(p->'windows')<>7 OR jsonb_array_length(p->'rules') NOT BETWEEN 1 AND 40 OR (p->>'maxSubjects')::int NOT BETWEEN 1 AND 12 THEN RAISE EXCEPTION 'Invalid routine'; END IF;
 IF (SELECT count(DISTINCT value->>'day') FROM jsonb_array_elements(p->'windows'))<>7 OR (SELECT count(DISTINCT value->>'subject') FROM jsonb_array_elements(p->'rules'))<>jsonb_array_length(p->'rules') OR (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(p->'sessions'))<>jsonb_array_length(p->'sessions') THEN RAISE EXCEPTION 'Duplicate routine entries'; END IF;
 FOR win IN SELECT value FROM jsonb_array_elements(p->'windows') LOOP
  IF (win->>'day')::int NOT BETWEEN 0 AND 6 OR (win->>'start')::int<0 OR (win->>'end')::int>1440 OR (win->>'capacity')::int<0 OR (win->>'capacity')::int>(win->>'end')::int-(win->>'start')::int THEN RAISE EXCEPTION 'Invalid availability'; END IF;
 END LOOP;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'sessions') LOOP
  IF s->>'id' IS NULL OR s->>'date' IS NULL OR s->>'start' IS NULL OR s->>'minutes' IS NULL OR s->>'subject' IS NULL OR s->>'title' IS NULL OR s->>'locked' IS NULL OR s->>'kind' IS NULL OR s->>'kind' NOT IN('learning','practice','revision','assessment','break','commitment') THEN RAISE EXCEPTION 'Invalid session fields'; END IF;
  d:=(s->>'date')::date;
  IF d<(p->>'week')::date OR d>(p->>'week')::date+6 OR (s->>'minutes')::int NOT BETWEEN 15 AND 240 OR (s->>'start')::int<0 OR (s->>'start')::int+(s->>'minutes')::int>1440 THEN RAISE EXCEPTION 'Invalid session time'; END IF;
  SELECT value INTO win FROM jsonb_array_elements(p->'windows') WHERE (value->>'day')::int=extract(dow FROM d)::int;
  IF s->>'kind'<>'commitment' AND ((s->>'start')::int<(win->>'start')::int OR (s->>'start')::int+(s->>'minutes')::int>(win->>'end')::int OR (win->>'capacity')::int=0) THEN RAISE EXCEPTION 'Outside availability'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p->'sessions') x WHERE x->>'id'<>s->>'id' AND x->>'date'=s->>'date' AND (x->>'start')::int<(s->>'start')::int+(s->>'minutes')::int AND (s->>'start')::int<(x->>'start')::int+(x->>'minutes')::int) THEN RAISE EXCEPTION 'Sessions overlap'; END IF;
  IF s->>'kind' NOT IN('break','commitment') AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p->'rules') x WHERE x->>'subject'=s->>'subject') THEN RAISE EXCEPTION 'Unknown subject'; END IF;
  SELECT coalesce(sum((value->>'minutes')::int),0) INTO total FROM jsonb_array_elements(p->'sessions') WHERE value->>'date'=s->>'date' AND value->>'kind' NOT IN('break','commitment');
  IF total>(win->>'capacity')::int THEN RAISE EXCEPTION 'Daily capacity exceeded'; END IF;
  IF (SELECT count(DISTINCT value->>'subject') FROM jsonb_array_elements(p->'sessions') WHERE value->>'date'=s->>'date' AND value->>'kind' NOT IN('break','commitment'))>(p->>'maxSubjects')::int THEN RAISE EXCEPTION 'Daily subject limit exceeded'; END IF;
  IF s->>'topicId' IS NOT NULL THEN
   SELECT value INTO topic FROM jsonb_array_elements(p->'topics') WHERE value->>'id'=s->>'topicId' AND value->>'subject'=s->>'subject';
   IF topic IS NULL THEN RAISE EXCEPTION 'Unknown topic'; END IF;
   FOR prereq IN SELECT jsonb_array_elements_text(topic->'prerequisites') LOOP
    SELECT value INTO pt FROM jsonb_array_elements(p->'topics') WHERE value->>'id'=prereq;
    IF pt IS NULL THEN RAISE EXCEPTION 'Unknown prerequisite'; END IF;
    IF NOT (pt->>'completed')::boolean AND (SELECT coalesce(sum((value->>'minutes')::int),0) FROM jsonb_array_elements(p->'sessions') WHERE value->>'topicId'=prereq AND ((value->>'date')::date<d OR (value->>'date'=s->>'date' AND (value->>'start')::int+(value->>'minutes')::int<=(s->>'start')::int)))<(pt->>'minutes')::int THEN RAISE EXCEPTION 'Prerequisite ordering violated'; END IF;
   END LOOP;
  END IF;
 END LOOP;
 FOR rule IN SELECT value FROM jsonb_array_elements(p->'rules') LOOP
  IF rule->>'subject' IS NULL OR rule->>'sessions' IS NULL OR rule->>'mandatory' IS NULL OR (rule->>'sessions')::int NOT BETWEEN 0 AND 14 THEN RAISE EXCEPTION 'Invalid subject coverage'; END IF;
  IF (rule->>'mandatory')::boolean AND (SELECT count(*) FROM jsonb_array_elements(p->'sessions') WHERE value->>'subject'=rule->>'subject' AND value->>'kind' NOT IN('break','commitment'))<(rule->>'sessions')::int THEN RAISE EXCEPTION 'Mandatory subject coverage missing'; END IF;
 END LOOP;
END $$;

CREATE FUNCTION public.save_routine(target uuid, expected integer, payload jsonb, summary text DEFAULT 'Edited draft', availability_edit boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r weekly_routines; old jsonb; nxt jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text));
 IF target IS NULL THEN
  INSERT INTO weekly_routines(user_id,week,draft) VALUES(auth.uid(),(payload->>'week')::date,payload) RETURNING * INTO r;
 ELSE
  SELECT * INTO r FROM weekly_routines WHERE id=target AND user_id=auth.uid() FOR UPDATE;
  IF r.id IS NULL OR r.version IS DISTINCT FROM expected OR r.week<>(payload->>'week')::date THEN RAISE EXCEPTION 'Stale draft: reload'; END IF;
  FOR old IN SELECT value FROM jsonb_array_elements(r.draft->'sessions') WHERE (value->>'locked')::boolean LOOP
   SELECT value INTO nxt FROM jsonb_array_elements(payload->'sessions') WHERE value->>'id'=old->>'id';
   IF nxt IS DISTINCT FROM old AND NOT (availability_edit AND old->>'kind'='commitment') THEN RAISE EXCEPTION 'Unlock session before changing it'; END IF;
  END LOOP;
  UPDATE weekly_routines SET draft=payload,version=version+1,state='DRAFT',updated_at=now() WHERE id=target RETURNING * INTO r;
 END IF;
 INSERT INTO routine_versions(routine_id,user_id,version,snapshot,summary) VALUES(r.id,auth.uid(),r.version,r.draft,left(summary,240));
 RETURN to_jsonb(r);
END $$;
CREATE FUNCTION public.unlock_routine_session(target uuid, expected integer, session_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r weekly_routines; p jsonb;
BEGIN
 SELECT * INTO r FROM weekly_routines WHERE id=target AND user_id=auth.uid() FOR UPDATE;
 IF r.id IS NULL OR r.version IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Stale draft'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(r.draft->'sessions') WHERE value->>'id'=session_id::text AND value->>'kind'='commitment') THEN RAISE EXCEPTION 'Edit fixed commitments through availability settings'; END IF;
 SELECT jsonb_agg(CASE WHEN value->>'id'=session_id::text THEN jsonb_set(value,'{locked}','false') ELSE value END) INTO p FROM jsonb_array_elements(r.draft->'sessions');
 UPDATE weekly_routines SET draft=jsonb_set(draft,'{sessions}',coalesce(p,'[]')),version=version+1,state='DRAFT',updated_at=now() WHERE id=target RETURNING * INTO r;
 INSERT INTO routine_versions(routine_id,user_id,version,snapshot,summary) VALUES(r.id,auth.uid(),r.version,r.draft,'Explicit session unlock');
 RETURN to_jsonb(r);
END $$;
CREATE FUNCTION public.activate_routine(target uuid, expected integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r weekly_routines; s jsonb; tid uuid; today date; n integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text));
 PERFORM 1 FROM profiles WHERE id=auth.uid() FOR UPDATE;
 SELECT * INTO r FROM weekly_routines WHERE id=target AND user_id=auth.uid() FOR UPDATE;
 IF r.id IS NULL OR r.version IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Stale draft: reload before approval'; END IF;
 IF r.approved_version=r.version THEN RETURN; END IF;
 PERFORM validate_routine_payload(r.draft);
 SELECT (now() AT TIME ZONE timezone)::date INTO today FROM profiles WHERE id=auth.uid();
 IF r.week+6<today THEN RAISE EXCEPTION 'Cannot activate a past week'; END IF;
 -- Preserve all existing tasks; replacing a conflicting schedule requires explicit task edits.
 FOR s IN SELECT value FROM jsonb_array_elements(r.draft->'sessions') WHERE value->>'kind' NOT IN('commitment','break') LOOP
  IF (s->>'date')::date<today THEN CONTINUE; END IF;
  SELECT id INTO tid FROM daily_tasks WHERE routine_id=r.id AND routine_session_id=(s->>'id')::uuid;
  IF tid IS NOT NULL THEN
   IF EXISTS(SELECT 1 FROM daily_tasks WHERE id=tid AND status IN('completed','in_progress') AND (scheduled_date<>(s->>'date')::date OR scheduled_start IS DISTINCT FROM (s->>'start')::int OR estimated_minutes<>(s->>'minutes')::int OR subject<>s->>'subject')) THEN RAISE EXCEPTION 'Completed or running sessions must be preserved'; END IF;
   IF EXISTS(SELECT 1 FROM study_sessions WHERE task_id=tid AND ended_at IS NULL) THEN RAISE EXCEPTION 'Pause running tasks before reactivation'; END IF;
   UPDATE daily_tasks SET scheduled_date=(s->>'date')::date,scheduled_start=(s->>'start')::int,estimated_minutes=(s->>'minutes')::int,title=s->>'title',subject=s->>'subject',source_url=nullif(s->>'resource','') WHERE id=tid AND status NOT IN('completed','in_progress');
   CONTINUE;
  END IF;
  SELECT coalesce(sum(estimated_minutes),0) INTO n FROM daily_tasks WHERE user_id=auth.uid() AND scheduled_date=(s->>'date')::date AND status<>'skipped' AND routine_id IS DISTINCT FROM r.id;
  n:=n+(SELECT coalesce(sum((value->>'minutes')::int),0) FROM jsonb_array_elements(r.draft->'sessions') WHERE value->>'date'=s->>'date' AND value->>'kind' NOT IN('break','commitment'));
  IF n>(SELECT (value->>'capacity')::int FROM jsonb_array_elements(r.draft->'windows') WHERE (value->>'day')::int=extract(dow FROM (s->>'date')::date)::int) THEN RAISE EXCEPTION 'Existing daily tasks exceed capacity; resolve them before activation'; END IF;
  INSERT INTO daily_tasks(user_id,title,description,subject,scheduled_date,estimated_minutes,source,source_url,routine_id,routine_session_id,scheduled_start)
   VALUES(auth.uid(),s->>'title',s->>'notes',s->>'subject',(s->>'date')::date,(s->>'minutes')::int,'roadmap',nullif(s->>'resource',''),r.id,(s->>'id')::uuid,(s->>'start')::int);
 END LOOP;
 IF EXISTS(SELECT 1 FROM daily_tasks t WHERE t.routine_id=r.id AND t.scheduled_date>=today AND t.status NOT IN('completed','skipped') AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.draft->'sessions') candidate WHERE candidate->>'id'=t.routine_session_id::text)) THEN RAISE EXCEPTION 'Unfinished activated tasks must be retained; no work is silently removed'; END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(r.draft->'windows') LOOP
  IF EXISTS(SELECT 1 FROM daily_tasks WHERE user_id=auth.uid() AND scheduled_date BETWEEN r.week AND r.week+6 AND scheduled_date>=today AND extract(dow FROM scheduled_date)::int=(s->>'day')::int AND status<>'skipped' GROUP BY scheduled_date HAVING sum(estimated_minutes)>(s->>'capacity')::int) THEN RAISE EXCEPTION 'Planner capacity exceeded after merging existing work'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM daily_tasks t JOIN daily_tasks other ON other.user_id=t.user_id AND other.id<>t.id AND other.scheduled_date=t.scheduled_date AND other.status<>'skipped' AND other.scheduled_start IS NOT NULL AND other.scheduled_start<t.scheduled_start+t.estimated_minutes AND t.scheduled_start<other.scheduled_start+other.estimated_minutes WHERE t.routine_id=r.id AND t.scheduled_date>=today AND t.status<>'skipped') THEN RAISE EXCEPTION 'Existing daily tasks overlap proposed sessions'; END IF;
 UPDATE profiles SET planning_preferences=jsonb_build_object('windows',r.draft->'windows','rules',r.draft->'rules','maxSubjects',r.draft->'maxSubjects') WHERE id=auth.uid();
 UPDATE weekly_routines SET approved=draft,approved_version=version,state='ACTIVE',updated_at=now() WHERE id=r.id;
END $$;
REVOKE ALL ON FUNCTION public.validate_routine_payload(jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.save_reviewed_roadmap(jsonb),public.save_routine(uuid,integer,jsonb,text,boolean),public.unlock_routine_session(uuid,integer,uuid),public.activate_routine(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_reviewed_roadmap(jsonb),public.save_routine(uuid,integer,jsonb,text,boolean),public.unlock_routine_session(uuid,integer,uuid),public.activate_routine(uuid,integer) TO authenticated;
GRANT SELECT ON public.weekly_routines,public.routine_versions TO authenticated;

-- Daily edits use approved per-day capacity instead of the old uniform default.
CREATE OR REPLACE FUNCTION public.check_study_capacity(day date, minutes integer, excluded_task uuid, allow_over_capacity boolean)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE capacity integer; planned integer; p profiles;
BEGIN
 SELECT * INTO p FROM profiles WHERE id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Complete your preparation profile first'; END IF;
 SELECT (value->>'capacity')::int INTO capacity FROM jsonb_array_elements(coalesce(p.planning_preferences->'windows','[]')) WHERE (value->>'day')::int=extract(dow FROM day)::int;
 capacity:=coalesce(capacity,CASE WHEN lower(trim(to_char(day,'Day')))=ANY(p.available_days) THEN round(p.daily_study_hours*60) ELSE 0 END);
 SELECT coalesce(sum(estimated_minutes),0) INTO planned FROM daily_tasks WHERE user_id=auth.uid() AND scheduled_date=day AND status<>'skipped' AND (excluded_task IS NULL OR id<>excluded_task);
 IF NOT allow_over_capacity AND planned+minutes>capacity THEN RAISE EXCEPTION 'Daily study capacity exceeded'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.check_study_capacity(date,integer,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.check_study_capacity(date,integer,uuid,boolean) TO authenticated;

CREATE FUNCTION public.handle_roadmap_progress() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE target_milestone uuid; target_roadmap uuid;
BEGIN
 target_milestone:=CASE WHEN TG_OP='DELETE' THEN OLD.milestone_id ELSE NEW.milestone_id END;
 SELECT p.roadmap_id INTO target_roadmap FROM roadmap_milestones m JOIN roadmap_phases p ON p.id=m.phase_id WHERE m.id=target_milestone;
 UPDATE roadmaps SET total_tasks=(SELECT count(*) FROM roadmap_topics t JOIN roadmap_milestones m ON m.id=t.milestone_id JOIN roadmap_phases p ON p.id=m.phase_id WHERE p.roadmap_id=target_roadmap),completed_tasks=(SELECT count(*) FROM roadmap_topics t JOIN roadmap_milestones m ON m.id=t.milestone_id JOIN roadmap_phases p ON p.id=m.phase_id WHERE p.roadmap_id=target_roadmap AND t.status='completed') WHERE id=target_roadmap;
 RETURN NULL;
END $$;
CREATE TRIGGER roadmap_progress AFTER INSERT OR UPDATE OF status OR DELETE ON public.roadmap_topics FOR EACH ROW EXECUTE FUNCTION public.handle_roadmap_progress();
REVOKE ALL ON FUNCTION public.handle_roadmap_progress() FROM PUBLIC,anon,authenticated;
