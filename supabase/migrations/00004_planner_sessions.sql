ALTER TABLE public.study_sessions ADD COLUMN duration_seconds integer CHECK (duration_seconds >= 0);
UPDATE public.study_sessions SET duration_seconds = duration_minutes * 60 WHERE ended_at IS NOT NULL AND duration_minutes IS NOT NULL;
CREATE UNIQUE INDEX one_running_session_per_user ON public.study_sessions(user_id) WHERE ended_at IS NULL;
CREATE INDEX study_sessions_owner_time ON public.study_sessions(user_id, started_at);
ALTER TABLE public.daily_tasks ADD CONSTRAINT valid_task_estimate CHECK (estimated_minutes BETWEEN 1 AND 960);

CREATE OR REPLACE FUNCTION public.check_study_capacity(day date, minutes integer, excluded_task uuid, allow_over_capacity boolean)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE capacity integer; planned integer; p profiles;
BEGIN
  SELECT * INTO p FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Complete your preparation profile first'; END IF;
  capacity := CASE WHEN lower(trim(to_char(day, 'Day'))) = ANY(p.available_days) THEN round(p.daily_study_hours * 60) ELSE 0 END;
  SELECT coalesce(sum(estimated_minutes), 0) INTO planned FROM daily_tasks
    WHERE user_id = auth.uid() AND scheduled_date = day AND status <> 'skipped' AND (excluded_task IS NULL OR id <> excluded_task);
  IF NOT allow_over_capacity AND planned + minutes > capacity THEN RAISE EXCEPTION 'Daily study capacity exceeded'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.save_daily_task(target_task uuid, expected_version timestamptz, task_data jsonb, allow_over_capacity boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_task daily_tasks; result_id uuid; target_track uuid := (task_data->>'learning_track_id')::uuid;
BEGIN
  PERFORM 1 FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF target_track IS NOT NULL AND NOT EXISTS (SELECT 1 FROM learning_tracks WHERE id = target_track AND user_id = auth.uid()) THEN RAISE EXCEPTION 'Track not found'; END IF;
  IF target_task IS NOT NULL THEN
    SELECT * INTO current_task FROM daily_tasks WHERE id = target_task AND user_id = auth.uid() FOR UPDATE;
    IF NOT FOUND OR current_task.updated_at IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Task changed elsewhere'; END IF;
    IF current_task.scheduled_date <> (task_data->>'scheduled_date')::date AND EXISTS (SELECT 1 FROM study_sessions WHERE task_id = target_task AND ended_at IS NULL) THEN RAISE EXCEPTION 'Pause before moving task'; END IF;
  END IF;
  PERFORM check_study_capacity((task_data->>'scheduled_date')::date, (task_data->>'estimated_minutes')::int, target_task, allow_over_capacity);
  IF target_task IS NULL THEN
    INSERT INTO daily_tasks(user_id, title, description, subject, scheduled_date, estimated_minutes, priority, source_url, learning_track_id)
      VALUES(auth.uid(), task_data->>'title', task_data->>'description', task_data->>'subject', (task_data->>'scheduled_date')::date,
        (task_data->>'estimated_minutes')::int, task_data->>'priority', task_data->>'source_url', target_track) RETURNING id INTO result_id;
  ELSE
    UPDATE daily_tasks SET title = task_data->>'title', description = task_data->>'description', subject = task_data->>'subject',
      scheduled_date = (task_data->>'scheduled_date')::date, estimated_minutes = (task_data->>'estimated_minutes')::int,
      priority = task_data->>'priority', source_url = task_data->>'source_url', learning_track_id = target_track
      WHERE id = target_task RETURNING id INTO result_id;
  END IF;
  RETURN result_id;
END $$;

CREATE OR REPLACE FUNCTION public.transition_study_task(target_task uuid, next_status text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_task daily_tasks; active study_sessions; stamp timestamptz := clock_timestamp();
BEGIN
  IF next_status NOT IN ('pending','in_progress','completed','skipped','rescheduled') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  PERFORM 1 FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO current_task FROM daily_tasks WHERE id = target_task AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF;
  SELECT * INTO active FROM study_sessions WHERE user_id = auth.uid() AND ended_at IS NULL FOR UPDATE;
  IF next_status = 'in_progress' THEN
    IF current_task.status IN ('completed','skipped') THEN RAISE EXCEPTION 'Reopen this task first'; END IF;
    IF active.id IS NOT NULL AND active.task_id IS DISTINCT FROM target_task THEN RAISE EXCEPTION 'Pause the other running session first'; END IF;
    IF active.id IS NULL THEN
      INSERT INTO study_sessions(user_id, task_id, learning_track_id, subject, started_at) VALUES(auth.uid(), target_task, current_task.learning_track_id, current_task.subject, stamp);
    END IF;
  ELSIF active.task_id = target_task THEN
    UPDATE study_sessions SET ended_at = stamp,
      duration_seconds = greatest(0, floor(extract(epoch FROM stamp - started_at)))::int,
      duration_minutes = greatest(0, floor(extract(epoch FROM stamp - started_at) / 60))::int WHERE id = active.id;
  END IF;
  UPDATE daily_tasks SET status = next_status,
    completed_at = CASE WHEN next_status = 'completed' THEN coalesce(completed_at, stamp) ELSE NULL END,
    actual_minutes = (SELECT coalesce(sum(duration_seconds), 0) / 60 FROM study_sessions WHERE task_id = target_task AND user_id = auth.uid())
    WHERE id = target_task;
END $$;

CREATE OR REPLACE FUNCTION public.move_study_task(target_task uuid, target_date date, allow_over_capacity boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_task daily_tasks;
BEGIN
  PERFORM 1 FROM profiles WHERE id = auth.uid() FOR UPDATE;
  SELECT * INTO current_task FROM daily_tasks WHERE id = target_task AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR current_task.status = 'completed' THEN RAISE EXCEPTION 'Task not found or already completed'; END IF;
  PERFORM check_study_capacity(target_date, current_task.estimated_minutes, target_task, allow_over_capacity);
  PERFORM transition_study_task(target_task, 'rescheduled');
  UPDATE daily_tasks SET scheduled_date = target_date WHERE id = target_task;
END $$;

CREATE OR REPLACE FUNCTION public.delete_study_task(target_task uuid, expected_version timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_task daily_tasks;
BEGIN
  PERFORM 1 FROM profiles WHERE id = auth.uid() FOR UPDATE;
  SELECT * INTO current_task FROM daily_tasks WHERE id = target_task AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR current_task.updated_at IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Task changed elsewhere'; END IF;
  IF EXISTS (SELECT 1 FROM study_sessions WHERE task_id = target_task AND ended_at IS NULL) THEN RAISE EXCEPTION 'Pause before deleting'; END IF;
  DELETE FROM daily_tasks WHERE id = target_task;
END $$;

REVOKE ALL ON FUNCTION public.check_study_capacity(date,integer,uuid,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_daily_task(uuid,timestamptz,jsonb,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transition_study_task(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.move_study_task(uuid,date,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_study_task(uuid,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_study_capacity(date,integer,uuid,boolean), public.save_daily_task(uuid,timestamptz,jsonb,boolean), public.transition_study_task(uuid,text), public.move_study_task(uuid,date,boolean), public.delete_study_task(uuid,timestamptz) TO authenticated;

DROP POLICY "Users can CRUD own tasks" ON public.daily_tasks;
CREATE POLICY "Users can CRUD own tasks" ON public.daily_tasks FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()
    AND (learning_track_id IS NULL OR EXISTS (SELECT 1 FROM learning_tracks t WHERE t.id = daily_tasks.learning_track_id AND t.user_id = auth.uid()))
    AND (roadmap_id IS NULL OR EXISTS (SELECT 1 FROM roadmaps r WHERE r.id = daily_tasks.roadmap_id AND r.user_id = auth.uid())));
DROP POLICY "Users can CRUD own sessions" ON public.study_sessions;
CREATE POLICY "Users can CRUD own sessions" ON public.study_sessions FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()
    AND (task_id IS NULL OR EXISTS (SELECT 1 FROM daily_tasks t WHERE t.id = study_sessions.task_id AND t.user_id = auth.uid()))
    AND (learning_track_id IS NULL OR EXISTS (SELECT 1 FROM learning_tracks t WHERE t.id = study_sessions.learning_track_id AND t.user_id = auth.uid())));
