-- Supabase may explicitly grant anon EXECUTE through default privileges.
-- Revoking PUBLIC alone does not remove those separate role grants.
-- Keep the application RPCs available only to authenticated callers.
REVOKE ALL ON FUNCTION public.create_learning_track(jsonb,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_learning_track(jsonb,jsonb,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.save_video_progress(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_video_progress(uuid,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.import_learning_playlist(jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_learning_playlist(jsonb,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.save_video_progress_with_version(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_video_progress_with_version(uuid,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.check_study_capacity(date,integer,uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_study_capacity(date,integer,uuid,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.save_daily_task(uuid,timestamptz,jsonb,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_daily_task(uuid,timestamptz,jsonb,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.transition_study_task(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_study_task(uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.move_study_task(uuid,date,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.move_study_task(uuid,date,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.delete_study_task(uuid,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_study_task(uuid,timestamptz) TO authenticated;
REVOKE ALL ON FUNCTION public.export_preparation_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.export_preparation_data() TO authenticated;
REVOKE ALL ON FUNCTION public.clear_preparation_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_preparation_data() TO authenticated;
REVOKE ALL ON FUNCTION public.delete_forge_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_forge_account() TO authenticated;
