-- Invoker functions preserve RLS and commit the entire operation atomically.
CREATE OR REPLACE FUNCTION public.create_learning_track(track_data jsonb, playlist_data jsonb, video_data jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE track_id uuid := (track_data->>'id')::uuid;
DECLARE playlist_uuid uuid;
BEGIN
  IF auth.uid() IS NULL OR (track_data->>'user_id')::uuid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO learning_tracks SELECT * FROM jsonb_populate_record(null::learning_tracks, track_data);
  IF playlist_data IS NOT NULL THEN
    playlist_uuid := (playlist_data->>'id')::uuid;
    IF (playlist_data->>'learning_track_id')::uuid IS DISTINCT FROM track_id
       OR (playlist_data->>'user_id')::uuid IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Invalid playlist owner'; END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(video_data) v WHERE (v->>'playlist_id')::uuid IS DISTINCT FROM playlist_uuid) THEN
      RAISE EXCEPTION 'Invalid video playlist';
    END IF;
    INSERT INTO youtube_playlists SELECT * FROM jsonb_populate_record(null::youtube_playlists, playlist_data);
    INSERT INTO playlist_videos SELECT * FROM jsonb_populate_recordset(null::playlist_videos, video_data);
  END IF;
  RETURN track_id;
END $$;

CREATE OR REPLACE FUNCTION public.save_video_progress(target_video uuid, changes jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE parent_id uuid; track_id uuid;
BEGIN
  SELECT p.id, p.learning_track_id INTO parent_id, track_id
    FROM playlist_videos v JOIN youtube_playlists p ON p.id = v.playlist_id
    WHERE v.id = target_video AND p.user_id = auth.uid();
  IF parent_id IS NULL THEN RETURN false; END IF;
  -- Serialize aggregate updates for all videos belonging to the same track.
  PERFORM 1 FROM learning_tracks WHERE id = track_id FOR UPDATE;
  PERFORM 1 FROM youtube_playlists WHERE id = parent_id FOR UPDATE;
  UPDATE playlist_videos SET
    status = changes->>'status',
    notes = COALESCE(changes->>'notes', notes),
    difficulty_rating = CASE WHEN changes ? 'difficultyRating' THEN (changes->>'difficultyRating')::int ELSE difficulty_rating END,
    topics_learned = CASE WHEN changes ? 'topicsLearned' THEN ARRAY(SELECT jsonb_array_elements_text(changes->'topicsLearned')) ELSE topics_learned END,
    completed_at = CASE WHEN changes->>'status' = 'completed' THEN COALESCE(completed_at, now()) ELSE NULL END,
    last_studied_at = now(), updated_at = now()
    WHERE id = target_video;
  UPDATE youtube_playlists SET
    total_videos = (SELECT count(*) FROM playlist_videos WHERE playlist_id = parent_id),
    completed_videos = (SELECT count(*) FROM playlist_videos WHERE playlist_id = parent_id AND status = 'completed'),
    updated_at = now() WHERE id = parent_id;
  UPDATE learning_tracks SET
    total_items = (SELECT count(*) FROM playlist_videos v JOIN youtube_playlists p ON p.id = v.playlist_id WHERE p.learning_track_id = track_id),
    completed_items = (SELECT count(*) FROM playlist_videos v JOIN youtube_playlists p ON p.id = v.playlist_id WHERE p.learning_track_id = track_id AND v.status = 'completed'),
    updated_at = now() WHERE id = track_id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.create_learning_track(jsonb,jsonb,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_video_progress(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_learning_track(jsonb,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_video_progress(uuid,jsonb) TO authenticated;

-- Ownership must also hold for links written through the public Data API.
DROP POLICY "Users can CRUD own playlists" ON public.youtube_playlists;
CREATE POLICY "Users can CRUD own playlists" ON public.youtube_playlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (learning_track_id IS NULL OR EXISTS (
    SELECT 1 FROM public.learning_tracks t WHERE t.id = learning_track_id AND t.user_id = auth.uid()
  )));
DROP POLICY "Users can CRUD own entries" ON public.journal_entries;
CREATE POLICY "Users can CRUD own entries" ON public.journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (learning_track_id IS NULL OR EXISTS (
    SELECT 1 FROM public.learning_tracks t WHERE t.id = learning_track_id AND t.user_id = auth.uid()
  )));
CREATE INDEX IF NOT EXISTS idx_playlist_videos_parent ON public.playlist_videos(playlist_id, order_index);
CREATE INDEX IF NOT EXISTS idx_playlists_track ON public.youtube_playlists(learning_track_id);

-- Explicit outer-table qualification avoids resolving playlist_id to the
-- external YouTube text ID on youtube_playlists instead of the video UUID FK.
DROP POLICY IF EXISTS "Users can CRUD own videos" ON public.playlist_videos;
CREATE POLICY "Users can CRUD own videos" ON public.playlist_videos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.youtube_playlists p
    WHERE p.id = playlist_videos.playlist_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.youtube_playlists p
    WHERE p.id = playlist_videos.playlist_id AND p.user_id = auth.uid()));
