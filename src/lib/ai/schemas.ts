import { z } from "zod";

// ============================================
// ROADMAP GENERATION
// ============================================

export const RoadmapTopicSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  estimatedHours: z.number(),
  prerequisites: z.array(z.string()).optional(),
});

export const RoadmapMilestoneSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  topics: z.array(RoadmapTopicSchema),
  targetWeek: z.number().optional(),
});

export const RoadmapPhaseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  durationWeeks: z.number(),
  milestones: z.array(RoadmapMilestoneSchema),
});

export const RoadmapGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  phases: z.array(RoadmapPhaseSchema),
  totalEstimatedHours: z.number(),
  recommendations: z.array(z.string()).optional(),
});

export type RoadmapGenerationOutput = z.infer<typeof RoadmapGenerationSchema>;

// ============================================
// ASSESSMENT GENERATION
// ============================================

export const MCQOptionSchema = z.object({
  label: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export const AssessmentQuestionSchema = z.object({
  section: z.enum(["concept_recall", "conceptual_understanding", "practical_application"]),
  type: z.enum(["mcq", "short_answer", "coding"]),
  questionText: z.string(),
  options: z.array(MCQOptionSchema).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  marks: z.number(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic: z.string(),
});

export const AssessmentGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  subjects: z.array(z.string()),
  topics: z.array(z.string()),
  durationMinutes: z.number(),
  questions: z.array(AssessmentQuestionSchema),
  totalMarks: z.number(),
});

export type AssessmentGenerationOutput = z.infer<typeof AssessmentGenerationSchema>;

// ============================================
// ASSESSMENT EVALUATION
// ============================================

export const QuestionEvaluationSchema = z.object({
  questionId: z.string().optional(),
  questionIndex: z.number(),
  isCorrect: z.boolean(),
  marksAwarded: z.number(),
  feedback: z.string(),
  missingConcepts: z.array(z.string()).optional(),
});

export const AssessmentEvaluationSchema = z.object({
  totalScore: z.number(),
  totalMarks: z.number(),
  percentage: z.number(),
  questionEvaluations: z.array(QuestionEvaluationSchema),
  overallFeedback: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendedTopics: z.array(z.string()),
  improvementSuggestions: z.array(z.string()),
});

export type AssessmentEvaluationOutput = z.infer<typeof AssessmentEvaluationSchema>;

// ============================================
// WEAKNESS ANALYSIS
// ============================================

export const WeaknessDetailSchema = z.object({
  topic: z.string(),
  subject: z.string(),
  currentLevel: z.string(),
  specificGaps: z.array(z.string()),
  recommendedResources: z.array(z.string()),
  estimatedTimeToImprove: z.string(),
});

export const WeaknessAnalysisSchema = z.object({
  overallAssessment: z.string(),
  weakTopics: z.array(WeaknessDetailSchema),
  studyPlan: z.array(z.object({
    day: z.number(),
    focus: z.string(),
    tasks: z.array(z.string()),
    duration: z.string(),
  })),
  priorityOrder: z.array(z.string()),
});

export type WeaknessAnalysisOutput = z.infer<typeof WeaknessAnalysisSchema>;

// ============================================
// MENTOR RESPONSE
// ============================================

export const MentorResponseSchema = z.object({
  answer: z.string(),
  codeExamples: z.array(z.object({
    language: z.string(),
    code: z.string(),
    explanation: z.string(),
  })).optional(),
  keyTakeaways: z.array(z.string()),
  followUpQuestions: z.array(z.string()).optional(),
  relatedTopics: z.array(z.string()).optional(),
});

export type MentorResponseOutput = z.infer<typeof MentorResponseSchema>;

// ============================================
// DAILY SCHEDULE
// ============================================

export const DailyTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  subject: z.string(),
  estimatedMinutes: z.number(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  type: z.enum(["learning", "practice", "revision", "assessment"]),
  resourceUrl: z.string().optional(),
});

export const DailyScheduleSchema = z.object({
  date: z.string(),
  tasks: z.array(DailyTaskSchema),
  totalMinutes: z.number(),
  focusAreas: z.array(z.string()),
  dailyGoal: z.string(),
});

export type DailyScheduleOutput = z.infer<typeof DailyScheduleSchema>;

// ============================================
// WEEKLY REVIEW
// ============================================

export const WeeklyReviewSchema = z.object({
  summary: z.string(),
  accomplishments: z.array(z.string()),
  missedGoals: z.array(z.string()),
  topicsImproved: z.array(z.object({
    topic: z.string(),
    improvement: z.string(),
  })),
  persistentWeaknesses: z.array(z.string()),
  nextWeekRecommendations: z.array(z.string()),
  overallScore: z.number().min(1).max(10),
  motivationalMessage: z.string(),
});

export type WeeklyReviewOutput = z.infer<typeof WeeklyReviewSchema>;

// ============================================
// PARSED ROADMAP (from uploads)
// ============================================

export const ParsedRoadmapSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  phases: z.array(z.object({
    title: z.string(),
    topics: z.array(z.object({
      title: z.string(),
      subtopics: z.array(z.string()).optional(),
      estimatedHours: z.number().optional(),
    })),
  })),
});

export type ParsedRoadmapOutput = z.infer<typeof ParsedRoadmapSchema>;
