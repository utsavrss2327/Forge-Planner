-- FORGE: reviewable bootstrap for project zcgsdaboiqrrzxdfturq.
-- Prepared after a read-only check found 0 public tables and 0 app users.
-- Applies the five existing migrations as one transaction; no sample data.
-- Includes per-user RLS, signup profile trigger, planner RPCs, export/reset,
-- and an authenticated caller-only account-deletion function.
-- No data-deletion functions are invoked by this script.
-- Run ONCE only on this uninitialized project. Do not rerun after success.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') THEN
    RAISE EXCEPTION 'Database is not empty. Review migration state before applying FORGE bootstrap.';
  END IF;
END $$;

-- SOURCE: 00001_initial_schema.sql
-- FORGE Database Schema
-- Supabase PostgreSQL Migration

-- Native UUID generation requires PostgreSQL 13 or newer.

-- ============================================
-- PROFILES & USER PREFERENCES
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  target_role TEXT DEFAULT 'SDE-1',
  education_level TEXT,
  target_date DATE,
  target_companies TEXT[] DEFAULT '{}',
  preparation_level TEXT DEFAULT 'beginner',
  daily_study_hours NUMERIC(3,1) DEFAULT 3.0,
  available_days TEXT[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
  strong_subjects TEXT[] DEFAULT '{}',
  weak_subjects TEXT[] DEFAULT '{}',
  completed_topics TEXT[] DEFAULT '{}',
  study_preference TEXT DEFAULT 'structured',
  preparation_subjects TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- ROADMAPS
-- ============================================

CREATE TABLE public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_role TEXT,
  duration_days INTEGER,
  start_date DATE,
  end_date DATE,
  daily_hours NUMERIC(3,1) DEFAULT 3.0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  source TEXT DEFAULT 'ai' CHECK (source IN ('ai', 'upload', 'manual')),
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own roadmaps" ON public.roadmaps FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.roadmap_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own phases" ON public.roadmap_phases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid()));

CREATE TABLE public.roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES public.roadmap_phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  target_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roadmap_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own milestones" ON public.roadmap_milestones FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.roadmap_phases rp
    JOIN public.roadmaps r ON r.id = rp.roadmap_id
    WHERE rp.id = phase_id AND r.user_id = auth.uid()
  ));

CREATE TABLE public.roadmap_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.roadmap_milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  estimated_hours NUMERIC(4,1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roadmap_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own topics" ON public.roadmap_topics FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.roadmap_milestones rm
    JOIN public.roadmap_phases rp ON rp.id = rm.phase_id
    JOIN public.roadmaps r ON r.id = rp.roadmap_id
    WHERE rm.id = milestone_id AND r.user_id = auth.uid()
  ));

-- ============================================
-- LEARNING TRACKS
-- ============================================

CREATE TABLE public.learning_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  target_outcome TEXT,
  start_date DATE,
  deadline DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  daily_goal TEXT,
  weekly_goal TEXT,
  resource_links TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  notes TEXT,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own tracks" ON public.learning_tracks FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- YOUTUBE PLAYLISTS
-- ============================================

CREATE TABLE public.youtube_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_track_id UUID REFERENCES public.learning_tracks(id) ON DELETE SET NULL,
  playlist_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  total_videos INTEGER DEFAULT 0,
  completed_videos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.youtube_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own playlists" ON public.youtube_playlists FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.playlist_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.youtube_playlists(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  topics_learned TEXT[] DEFAULT '{}',
  notes TEXT,
  last_studied_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own videos" ON public.playlist_videos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.youtube_playlists p WHERE p.id = playlist_videos.playlist_id AND p.user_id = auth.uid()));

-- ============================================
-- DAILY TASKS
-- ============================================

CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE SET NULL,
  learning_track_id UUID REFERENCES public.learning_tracks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  estimated_minutes INTEGER DEFAULT 30,
  actual_minutes INTEGER,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'rescheduled')),
  scheduled_date DATE NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'roadmap', 'revision', 'ai')),
  source_url TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own tasks" ON public.daily_tasks FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_daily_tasks_date ON public.daily_tasks(user_id, scheduled_date);
CREATE INDEX idx_daily_tasks_status ON public.daily_tasks(user_id, status);

-- ============================================
-- STUDY SESSIONS
-- ============================================

CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.daily_tasks(id) ON DELETE SET NULL,
  learning_track_id UUID REFERENCES public.learning_tracks(id) ON DELETE SET NULL,
  subject TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- LEARNING JOURNAL
-- ============================================

CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_track_id UUID REFERENCES public.learning_tracks(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,
  concepts TEXT[] DEFAULT '{}',
  code_snippets JSONB DEFAULT '[]',
  confusing_topics TEXT[] DEFAULT '{}',
  questions TEXT[] DEFAULT '{}',
  resource_links TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own entries" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_journal_date ON public.journal_entries(user_id, date);

-- ============================================
-- ASSESSMENTS
-- ============================================

CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subjects TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  duration_minutes INTEGER DEFAULT 60,
  total_questions INTEGER DEFAULT 0,
  total_marks NUMERIC(5,1) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'evaluated')),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  score NUMERIC(5,1),
  percentage NUMERIC(5,2),
  ai_feedback TEXT,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own assessments" ON public.assessments FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('concept_recall', 'conceptual_understanding', 'practical_application')),
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'short_answer', 'coding')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  marks NUMERIC(3,1) DEFAULT 1,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own questions" ON public.assessment_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid()));

CREATE TABLE public.assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  marks_awarded NUMERIC(3,1) DEFAULT 0,
  ai_feedback TEXT,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own answers" ON public.assessment_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid()));

-- ============================================
-- TOPIC MASTERY
-- ============================================

CREATE TABLE public.topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  mastery_level TEXT DEFAULT 'not_started' CHECK (mastery_level IN ('not_started', 'beginner', 'developing', 'proficient', 'strong', 'mastered')),
  score NUMERIC(5,2) DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_assessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject, topic)
);

ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own mastery" ON public.topic_mastery FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- REVISION & SPACED REPETITION
-- ============================================

CREATE TABLE public.revision_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT,
  item_type TEXT DEFAULT 'concept' CHECK (item_type IN ('concept', 'flashcard', 'question', 'code_snippet')),
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  interval_days INTEGER DEFAULT 1,
  ease_factor NUMERIC(3,2) DEFAULT 2.5,
  repetitions INTEGER DEFAULT 0,
  last_quality INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.revision_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own revisions" ON public.revision_items FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_revision_date ON public.revision_items(user_id, next_review_date);

-- ============================================
-- DSA PROBLEMS
-- ============================================

CREATE TABLE public.dsa_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  platform TEXT CHECK (platform IN ('leetcode', 'geeksforgeeks', 'codeforces', 'hackerrank', 'other')),
  topic TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'attempted', 'solved', 'revision_needed')),
  attempts INTEGER DEFAULT 0,
  time_taken_minutes INTEGER,
  date_solved DATE,
  solution_notes TEXT,
  mistakes TEXT,
  needs_revision BOOLEAN DEFAULT FALSE,
  last_attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dsa_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own problems" ON public.dsa_problems FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_dsa_topic ON public.dsa_problems(user_id, topic);

-- ============================================
-- JOB APPLICATIONS
-- ============================================

CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT,
  job_url TEXT,
  application_date DATE,
  deadline DATE,
  status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'online_assessment', 'interview_scheduled', 'interviewing', 'offer', 'rejected', 'withdrawn')),
  referral_status TEXT,
  resume_version TEXT,
  interview_rounds JSONB DEFAULT '[]',
  notes TEXT,
  follow_up_date DATE,
  salary_range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own applications" ON public.job_applications FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- AI CONVERSATIONS
-- ============================================

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('learning_coach', 'assessment_examiner', 'roadmap_planner', 'performance_analyst', 'general')),
  title TEXT,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- STREAKS & ACTIVITY
-- ============================================

CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own activity" ON public.activity_log FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_activity_date ON public.activity_log(user_id, activity_date);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'reminder', 'achievement', 'warning')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
      t
    );
  END LOOP;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- SOURCE: 00002_learning_transactions.sql
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


-- SOURCE: 00003_learning_management.sql
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


-- SOURCE: 00004_planner_sessions.sql
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


-- SOURCE: 00005_account_data.sql
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

-- Verify table creation and RLS before committing.
DO $$ BEGIN
  IF (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') <> 21 THEN
    RAISE EXCEPTION 'Unexpected FORGE table count; transaction rolled back.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity) THEN
    RAISE EXCEPTION 'A public table is missing row-level security; transaction rolled back.';
  END IF;
END $$;
COMMIT;
SELECT count(*) AS forge_tables, bool_and(rowsecurity) AS all_tables_have_rls FROM pg_tables WHERE schemaname = 'public';
