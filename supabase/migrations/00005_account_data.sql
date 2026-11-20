-- RLS remains active for all export and preparation reset operations.
CREATE OR REPLACE FUNCTION public.export_preparation_data()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE table_name text; records jsonb; result jsonb := '{}'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  FOREACH table_name IN ARRAY ARRAY['profiles','roadmaps','roadmap_phases','roadmap_milestones','roadmap_topics','learning_tracks','youtube_playlists','playlist_videos','daily_tasks','study_sessions','journal_entries','assessments','assessment_questions','assessment_answers','topic_mastery','revision_items','dsa_problems','job_applications','ai_conversations','activity_log','notifications'] LOOP
    EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) FROM public.%I t', table_name) INTO records;
    result := result || jsonb_build_object(table_name, records);
  END LOOP;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.clear_preparation_data()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE table_name text;
BEGIN
  PERFORM 1 FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  FOREACH table_name IN ARRAY ARRAY['notifications','activity_log','ai_conversations','job_applications','dsa_problems','revision_items','topic_mastery','assessment_answers','assessment_questions','assessments','study_sessions','daily_tasks','journal_entries','playlist_videos','youtube_playlists','learning_tracks','roadmap_topics','roadmap_milestones','roadmap_phases','roadmaps'] LOOP
    EXECUTE format('DELETE FROM public.%I', table_name);
  END LOOP;
  UPDATE profiles SET full_name = NULL, avatar_url = NULL, target_role = 'SDE-1', education_level = NULL, target_date = NULL,
    target_companies = '{}', preparation_level = 'beginner', daily_study_hours = 3,
    available_days = ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], strong_subjects = '{}', weak_subjects = '{}',
    completed_topics = '{}', study_preference = 'structured', preparation_subjects = '{}', onboarding_completed = false, timezone = 'Asia/Kolkata'
    WHERE id = auth.uid();
END $$;

-- This narrowly scoped definer function can delete only the caller's auth record.
-- auth.users deletion cascades through FORGE's owned records. No service-role key is needed.
CREATE OR REPLACE FUNCTION public.delete_forge_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  DELETE FROM auth.users WHERE id = caller;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.export_preparation_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_preparation_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_forge_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.export_preparation_data(), public.clear_preparation_data(), public.delete_forge_account() TO authenticated;
