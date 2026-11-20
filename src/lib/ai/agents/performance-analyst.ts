import { callAI, isAIConfigured } from "../client";
import {
  PERFORMANCE_ANALYST_SYSTEM,
  weeklyReviewPrompt,
  weaknessAnalysisPrompt,
  dailyInsightPrompt,
} from "../prompts";
import {
  WeeklyReviewSchema,
  WeaknessAnalysisSchema,
  type WeeklyReviewOutput,
  type WeaknessAnalysisOutput,
} from "../schemas";

export class PerformanceAnalyst {
  async generateWeeklyReview(params: {
    studyHoursPlanned: number;
    studyHoursActual: number;
    tasksCompleted: number;
    tasksTotal: number;
    assessmentsTaken: number;
    averageScore: number;
    topicsStudied: string[];
    weakTopics: string[];
    streakDays: number;
  }): Promise<WeeklyReviewOutput> {
    if (!isAIConfigured()) {
      throw new Error("AI is not configured. Please set your OpenAI API key for weekly reviews.");
    }

    const response = await callAI(
      PERFORMANCE_ANALYST_SYSTEM,
      weeklyReviewPrompt(params),
      {
        model: "gpt-4o-mini",
        temperature: 0.6,
        maxTokens: 2048,
        responseFormat: { type: "json_object" },
      }
    );

    const parsed = JSON.parse(response);
    return WeeklyReviewSchema.parse(parsed);
  }

  async analyzeWeaknesses(params: {
    masteryData: Array<{
      topic: string;
      subject: string;
      score: number;
      questionsCorrect: number;
      questionsTotal: number;
    }>;
    recentMistakes: string[];
  }): Promise<WeaknessAnalysisOutput> {
    if (!isAIConfigured()) {
      throw new Error("AI is not configured. Please set your OpenAI API key for weakness analysis.");
    }

    const response = await callAI(
      PERFORMANCE_ANALYST_SYSTEM,
      weaknessAnalysisPrompt(params),
      {
        model: "gpt-4o-mini",
        temperature: 0.4,
        maxTokens: 4096,
        responseFormat: { type: "json_object" },
      }
    );

    const parsed = JSON.parse(response);
    return WeaknessAnalysisSchema.parse(parsed);
  }

  async generateDailyInsight(params: {
    recentActivity: string;
    upcomingDeadlines: string;
    weakAreas: string;
    streak: number;
  }): Promise<string> {
    if (!isAIConfigured()) {
      return "Start your preparation journey by adding a learning track or generating a roadmap!";
    }

    return callAI(
      PERFORMANCE_ANALYST_SYSTEM,
      dailyInsightPrompt(params),
      { temperature: 0.7, maxTokens: 256 }
    );
  }

  estimateMasteryLevel(score: number): string {
    if (score >= 90) return "mastered";
    if (score >= 75) return "strong";
    if (score >= 60) return "proficient";
    if (score >= 40) return "developing";
    if (score >= 20) return "beginner";
    return "not_started";
  }

  calculateSpacedRepetitionInterval(
    currentInterval: number,
    quality: number, // 0-5, where 5 is perfect recall
    easeFactor: number
  ): { newInterval: number; newEaseFactor: number } {
    // SM-2 algorithm
    let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);

    let newInterval: number;
    if (quality < 3) {
      newInterval = 1; // Reset to 1 day
    } else if (currentInterval === 0) {
      newInterval = 1;
    } else if (currentInterval === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }

    return { newInterval, newEaseFactor };
  }
}

export const performanceAnalyst = new PerformanceAnalyst();
