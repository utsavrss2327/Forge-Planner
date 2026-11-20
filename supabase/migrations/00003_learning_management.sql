-- Import into an existing track atomically; the row lock prevents duplicate concurrent imports.
CREATE OR REPLACE FUNCTION public.import_learning_playlist(playlist_data jsonb, video_data jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE parent_track uuid := (playlist_data->>'learning_track_id')::uuid;
DECLARE playlist_uuid uuid := (playlist_data->>'id')::uuid;
BEGIN
  PERFORM 1 FROM learning_tracks WHERE id = parent_track AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR (playlist_data->>'user_id')::uuid IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Track not found'; END IF;
  IF EXISTS (SELECT 1 FROM youtube_playlists WHERE learning_track_id = parent_track AND playlist_id = playlist_data->>'playlist_id') THEN
    RAISE EXCEPTION 'Playlist already imported';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(video_data) v WHERE (v->>'playlist_id')::uuid IS DISTINCT FROM playlist_uuid) THEN RAISE EXCEPTION 'Invalid video playlist'; END IF;
  INSERT INTO youtube_playlists SELECT * FROM jsonb_populate_record(null::youtube_playlists, playlist_data);
  INSERT INTO playlist_videos SELECT * FROM jsonb_populate_recordset(null::playlist_videos, video_data);
  UPDATE learning_tracks SET total_items = (SELECT count(*) FROM playlist_videos v JOIN youtube_playlists p ON p.id = v.playlist_id WHERE p.learning_track_id = parent_track) WHERE id = parent_track;
  RETURN playlist_uuid;
END $$;
REVOKE ALL ON FUNCTION public.import_learning_playlist(jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_learning_playlist(jsonb,jsonb) TO authenticated;

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
  IF changes ? 'expectedUpdatedAt' AND NOT EXISTS (SELECT 1 FROM playlist_videos WHERE id = target_video AND updated_at = (changes->>'expectedUpdatedAt')::timestamptz) THEN
    RAISE EXCEPTION 'Video changed elsewhere';
  END IF;
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

-- Return the exact committed version in the same transaction as the update.
CREATE OR REPLACE FUNCTION public.save_video_progress_with_version(target_video uuid, changes jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE saved boolean; version timestamptz;
BEGIN
  saved := save_video_progress(target_video, changes);
  IF NOT saved THEN RETURN jsonb_build_object('saved', false); END IF;
  SELECT updated_at INTO version FROM playlist_videos WHERE id = target_video;
  RETURN jsonb_build_object('saved', true, 'updated_at', version);
END $$;
REVOKE ALL ON FUNCTION public.save_video_progress_with_version(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_video_progress_with_version(uuid,jsonb) TO authenticated;
