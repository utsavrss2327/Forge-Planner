import { callAI, isAIConfigured } from "../client";
import {
  ASSESSMENT_EXAMINER_SYSTEM,
  generateAssessmentPrompt,
  evaluateAnswersPrompt,
  growthReportPrompt,
} from "../prompts";
import {
  AssessmentGenerationSchema,
  AssessmentEvaluationSchema,
  type AssessmentGenerationOutput,
  type AssessmentEvaluationOutput,
} from "../schemas";

export class AssessmentExaminer {
  async generateAssessment(params: {
    topics: string[];
    notes?: string;
    weaknesses?: string[];
    previousTopics?: string[];
    durationMinutes?: number;
  }): Promise<AssessmentGenerationOutput> {
    if (!isAIConfigured()) {
      throw new Error("AI is not configured. Please set your OpenAI API key to generate assessments.");
    }

    const response = await callAI(
      ASSESSMENT_EXAMINER_SYSTEM,
      generateAssessmentPrompt({
        topics: params.topics,
        notes: params.notes,
        weaknesses: params.weaknesses,
        previousTopics: params.previousTopics,
        durationMinutes: params.durationMinutes || 60,
      }),
      {
        model: "gpt-4o-mini",
        temperature: 0.6,
        maxTokens: 8192,
        responseFormat: { type: "json_object" },
      }
    );

    const parsed = JSON.parse(response);
    return AssessmentGenerationSchema.parse(parsed);
  }

  async evaluateAssessment(params: {
    questions: Array<{
      questionText: string;
      type: string;
      correctAnswer: string;
      marks: number;
      topic: string;
    }>;
    answers: Array<{
      questionIndex: number;
      userAnswer: string;
    }>;
  }): Promise<AssessmentEvaluationOutput> {
    if (!isAIConfigured()) {
      throw new Error("AI is not configured. Please set your OpenAI API key to evaluate assessments.");
    }

    const response = await callAI(
      ASSESSMENT_EXAMINER_SYSTEM,
      evaluateAnswersPrompt(params),
      {
        model: "gpt-4o-mini",
        temperature: 0.3,
        maxTokens: 4096,
        responseFormat: { type: "json_object" },
      }
    );

    const parsed = JSON.parse(response);
    return AssessmentEvaluationSchema.parse(parsed);
  }

  async generateGrowthReport(params: {
    currentScore: number;
    totalMarks: number;
    strengths: string[];
    weaknesses: string[];
    previousScores?: number[];
    topicPerformance: Record<string, { correct: number; total: number }>;
  }): Promise<string> {
    if (!isAIConfigured()) {
      return "AI is not configured. Please set your OpenAI API key for growth reports.";
    }

    return callAI(
      ASSESSMENT_EXAMINER_SYSTEM,
      growthReportPrompt(params),
      { temperature: 0.6 }
    );
  }
}

export const assessmentExaminer = new AssessmentExaminer();
