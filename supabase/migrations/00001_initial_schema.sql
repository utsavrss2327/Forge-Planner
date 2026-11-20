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
