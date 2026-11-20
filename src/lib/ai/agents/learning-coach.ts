import { callAI, callAIWithMessages, isAIConfigured } from "../client";
import {
  LEARNING_COACH_SYSTEM,
  explainConceptPrompt,
  reviewNotesPrompt,
  answerDoubtPrompt,
} from "../prompts";

export class LearningCoach {
  async explainConcept(
    topic: string,
    userLevel: string = "intermediate",
    context?: string
  ): Promise<string> {
    if (!isAIConfigured()) {
      return "AI is not configured. Please set your OpenAI API key in Settings to use the Learning Coach.";
    }

    return callAI(
      LEARNING_COACH_SYSTEM,
      explainConceptPrompt(topic, userLevel, context),
      { temperature: 0.7 }
    );
  }

  async reviewNotes(notes: string, topic: string): Promise<string> {
    if (!isAIConfigured()) {
      return "AI is not configured. Please set your OpenAI API key in Settings to use note reviews.";
    }

    return callAI(
      LEARNING_COACH_SYSTEM,
      reviewNotesPrompt(notes, topic),
      { temperature: 0.5 }
    );
  }

  async answerDoubt(question: string, context?: string): Promise<string> {
    if (!isAIConfigured()) {
      return "AI is not configured. Please set your OpenAI API key in Settings to ask questions.";
    }

    return callAI(
      LEARNING_COACH_SYSTEM,
      answerDoubtPrompt(question, context),
      { temperature: 0.7 }
    );
  }

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    userContext?: string
  ): Promise<string> {
    if (!isAIConfigured()) {
      return "AI is not configured. Please set your OpenAI API key in Settings to chat with the AI Mentor.";
    }

    const systemMessage = userContext
      ? `${LEARNING_COACH_SYSTEM}\n\nStudent context:\n${userContext}`
      : LEARNING_COACH_SYSTEM;

    const allMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemMessage },
      ...messages,
    ];

    return callAIWithMessages(allMessages, { temperature: 0.7, maxTokens: 2048 });
  }
}

export const learningCoach = new LearningCoach();
