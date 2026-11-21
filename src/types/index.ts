// ============================================
// STATUS & ENUM TYPES
// ============================================

export type RoadmapStatus = "active" | "paused" | "completed" | "archived";
export type RoadmapSource = "ai" | "upload" | "manual";
export type PhaseStatus = "pending" | "in_progress" | "completed";
export type MilestoneStatus = "pending" | "in_progress" | "completed";
export type TopicStatus = "pending" | "in_progress" | "completed";

export type LearningTrackStatus =
  "active" | "paused" | "completed" | "archived";
export type VideoStatus = "not_started" | "in_progress" | "completed";

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus =
  "pending" | "in_progress" | "completed" | "skipped" | "rescheduled";
export type TaskSource = "manual" | "roadmap" | "revision" | "ai";

export type AssessmentStatus =
  "draft" | "in_progress" | "submitted" | "evaluated";
export type QuestionSection =
  "concept_recall" | "conceptual_understanding" | "practical_application";
export type QuestionType = "mcq" | "short_answer" | "coding";
export type Difficulty = "easy" | "medium" | "hard";

export type MasteryLevel =
  | "not_started"
  | "beginner"
  | "developing"
  | "proficient"
  | "strong"
  | "mastered";

export type RevisionItemType =
  "concept" | "flashcard" | "question" | "code_snippet";
export type RevisionStatus = "active" | "suspended" | "completed";

export type DSAPlatform =
  "leetcode" | "geeksforgeeks" | "codeforces" | "hackerrank" | "other";
export type DSAProblemStatus =
  "pending" | "attempted" | "solved" | "revision_needed";

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "online_assessment"
  | "interview_scheduled"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";

export type AIAgentType =
  | "learning_coach"
  | "assessment_examiner"
  | "roadmap_planner"
  | "performance_analyst"
  | "general";

export type NotificationType = "info" | "reminder" | "achievement" | "warning";

export type PreparationLevel = "beginner" | "intermediate" | "advanced";
export type StudyPreference = "structured" | "flexible";

// ============================================
// PROFILES & USER PREFERENCES
// ============================================

export interface Profile {
  planning_preferences?: {
    windows?: import("@/lib/routine/schema").Routine["windows"];
    rules?: import("@/lib/routine/schema").Routine["rules"];
    maxSubjects?: number;
  };
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  target_role: string;
  education_level: string | null;
  target_date: string | null;
  target_companies: string[];
  preparation_level: PreparationLevel;
  daily_study_hours: number;
  available_days: string[];
  strong_subjects: string[];
  weak_subjects: string[];
  completed_topics: string[];
  study_preference: StudyPreference;
  preparation_subjects: string[];
  onboarding_completed: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CareerGoal {
  target_role: string;
  target_date: string | null;
  target_companies: string[];
  preparation_level: PreparationLevel;
}

export interface UserPreferences {
  daily_study_hours: number;
  available_days: string[];
  study_preference: StudyPreference;
  timezone: string;
  preparation_subjects: string[];
}

// ============================================
// ROADMAPS
// ============================================

export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_role: string | null;
  duration_days: number | null;
  start_date: string | null;
  end_date: string | null;
  daily_hours: number;
  status: RoadmapStatus;
  source: RoadmapSource;
  total_tasks: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
}

export interface RoadmapPhase {
  id: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  order_index: number;
  start_date: string | null;
  end_date: string | null;
  status: PhaseStatus;
  created_at: string;
}

export interface RoadmapMilestone {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  order_index: number;
  target_date: string | null;
  status: MilestoneStatus;
  created_at: string;
}

export interface RoadmapTopic {
  id: string;
  milestone_id: string;
  title: string;
  description: string | null;
  order_index: number;
  estimated_hours: number | null;
  status: TopicStatus;
  created_at: string;
}

// ============================================
// LEARNING TRACKS
// ============================================

export interface LearningTrack {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  target_outcome: string | null;
  start_date: string | null;
  deadline: string | null;
  priority: TaskPriority;
  daily_goal: string | null;
  weekly_goal: string | null;
  resource_links: string[];
  status: LearningTrackStatus;
  notes: string | null;
  total_items: number;
  completed_items: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// YOUTUBE PLAYLISTS
// ============================================

export interface YoutubePlaylist {
  id: string;
  user_id: string;
  learning_track_id: string | null;
  playlist_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  total_videos: number;
  completed_videos: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistVideo {
  id: string;
  playlist_id: string;
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  status: VideoStatus;
  difficulty_rating: number | null;
  topics_learned: string[];
  notes: string | null;
  last_studied_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// DAILY TASKS
// ============================================

export interface DailyTask {
  scheduled_start?: number | null;
  routine_id?: string | null;
  routine_session_id?: string | null;
  id: string;
  user_id: string;
  roadmap_id: string | null;
  learning_track_id: string | null;
  title: string;
  description: string | null;
  subject: string | null;
  estimated_minutes: number;
  actual_minutes: number | null;
  priority: TaskPriority;
  status: TaskStatus;
  scheduled_date: string;
  source: TaskSource;
  source_url: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// STUDY SESSIONS
// ============================================

export interface StudySession {
  id: string;
  user_id: string;
  task_id: string | null;
  learning_track_id: string | null;
  subject: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  duration_seconds?: number | null;
  notes: string | null;
  created_at: string;
}

// ============================================
// LEARNING JOURNAL
// ============================================

export interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  learning_track_id: string | null;
  date: string;
  summary: string | null;
  concepts: string[];
  code_snippets: CodeSnippet[];
  confusing_topics: string[];
  questions: string[];
  resource_links: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// ASSESSMENTS
// ============================================

export interface Assessment {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subjects: string[];
  topics: string[];
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  status: AssessmentStatus;
  started_at: string | null;
  submitted_at: string | null;
  time_spent_seconds: number | null;
  score: number | null;
  percentage: number | null;
  ai_feedback: string | null;
  strengths: string[];
  weaknesses: string[];
  created_at: string;
  updated_at: string;
}

export interface MCQOption {
  label: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  section: QuestionSection;
  question_type: QuestionType;
  question_text: string;
  options: MCQOption[] | null;
  correct_answer: string | null;
  explanation: string | null;
  marks: number;
  difficulty: Difficulty;
  topic: string | null;
  order_index: number;
  created_at: string;
}

export interface AssessmentAnswer {
  id: string;
  assessment_id: string;
  question_id: string;
  user_answer: string | null;
  is_correct: boolean | null;
  marks_awarded: number;
  ai_feedback: string | null;
  flagged_for_review: boolean;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// TOPIC MASTERY
// ============================================

export interface TopicMastery {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  mastery_level: MasteryLevel;
  score: number;
  questions_attempted: number;
  questions_correct: number;
  last_assessed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// REVISION & SPACED REPETITION
// ============================================

export interface RevisionItem {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  content: string | null;
  item_type: RevisionItemType;
  next_review_date: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_quality: number | null;
  status: RevisionStatus;
  created_at: string;
  updated_at: string;
}

// ============================================
// DSA PROBLEMS
// ============================================

export interface DSAProblem {
  id: string;
  user_id: string;
  name: string;
  url: string | null;
  platform: DSAPlatform | null;
  topic: string | null;
  difficulty: Difficulty;
  status: DSAProblemStatus;
  attempts: number;
  time_taken_minutes: number | null;
  date_solved: string | null;
  solution_notes: string | null;
  mistakes: string | null;
  needs_revision: boolean;
  last_attempted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// JOB APPLICATIONS
// ============================================

export interface InterviewRound {
  round_number: number;
  type: string;
  date?: string;
  notes?: string;
  result?: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string | null;
  job_url: string | null;
  application_date: string | null;
  deadline: string | null;
  status: ApplicationStatus;
  referral_status: string | null;
  resume_version: string | null;
  interview_rounds: InterviewRound[];
  notes: string | null;
  follow_up_date: string | null;
  salary_range: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// AI CONVERSATIONS
// ============================================

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  agent_type: AIAgentType;
  title: string | null;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

// ============================================
// STREAKS & ACTIVITY
// ============================================

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_date: string;
  count: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

// ============================================
// COMPOSITE / HELPER TYPES
// ============================================

export interface RoadmapWithPhases extends Roadmap {
  phases: (RoadmapPhase & {
    milestones: (RoadmapMilestone & {
      topics: RoadmapTopic[];
    })[];
  })[];
}

export interface AssessmentWithQuestions extends Assessment {
  questions: (AssessmentQuestion & {
    answer?: AssessmentAnswer;
  })[];
}

export interface LearningTrackWithPlaylists extends LearningTrack {
  playlists: (YoutubePlaylist & {
    videos: PlaylistVideo[];
  })[];
}

export interface DailyPlannerData {
  date: string;
  tasks: DailyTask[];
  sessions: StudySession[];
  journal: JournalEntry | null;
}
