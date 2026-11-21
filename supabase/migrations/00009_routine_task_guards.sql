-- Prevent daily-task APIs from bypassing activation or explicit session locks.
CREATE FUNCTION public.handle_routine_task_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE locked boolean;
BEGIN
 -- Validated activation/reset/account-deletion functions run as their owner.
 IF current_user NOT IN('authenticated','anon') THEN
  IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;
 END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.routine_id IS NOT NULL OR NEW.routine_session_id IS NOT NULL THEN RAISE EXCEPTION 'Create routine tasks through Approve and activate'; END IF;
  RETURN NEW;
 END IF;
 IF OLD.routine_id IS NOT NULL THEN
  -- A lock can be cleared only through the existing explicit unlock RPC. An
  -- approved snapshot stays historical while the user's current lock is honored.
  SELECT coalesce((s->>'locked')::boolean,false) INTO locked FROM weekly_routines r CROSS JOIN LATERAL jsonb_array_elements(r.draft->'sessions') s WHERE r.id=OLD.routine_id AND r.user_id=auth.uid() AND s->>'id'=OLD.routine_session_id::text;
  IF TG_OP='DELETE' THEN
   IF coalesce(locked,false) THEN RAISE EXCEPTION 'Locked routine task: explicitly unlock it in the routine editor first'; END IF;
   RETURN OLD;
  END IF;
  IF (NEW.routine_id,NEW.routine_session_id) IS DISTINCT FROM (OLD.routine_id,OLD.routine_session_id) THEN RAISE EXCEPTION 'Routine task links can change only through approved activation'; END IF;
  IF (NEW.scheduled_date,NEW.scheduled_start,NEW.estimated_minutes,NEW.subject,NEW.title,NEW.learning_track_id) IS DISTINCT FROM (OLD.scheduled_date,OLD.scheduled_start,OLD.estimated_minutes,OLD.subject,OLD.title,OLD.learning_track_id) THEN
   IF coalesce(locked,false) THEN RAISE EXCEPTION 'Locked routine task: explicitly unlock it in the routine editor first'; END IF;
   -- Single-task overrides are explicit user actions. Unlocked overdue work can
   -- move beyond its original week without erasing its historical routine link.
   NEW.scheduled_start:=NULL;
  END IF;
 ELSIF TG_OP='UPDATE' AND (NEW.routine_id IS NOT NULL OR NEW.routine_session_id IS NOT NULL) THEN RAISE EXCEPTION 'Attach routine tasks through Approve and activate';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;
END $$;
CREATE TRIGGER routine_task_guard BEFORE INSERT OR UPDATE OR DELETE ON public.daily_tasks FOR EACH ROW EXECUTE FUNCTION public.handle_routine_task_guard();
REVOKE ALL ON FUNCTION public.handle_routine_task_guard() FROM PUBLIC,anon,authenticated;
