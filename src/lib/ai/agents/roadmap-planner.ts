import { callAI, isAIConfigured } from "../client";
import {
  ROADMAP_PLANNER_SYSTEM,
  generateRoadmapPrompt,
  parseUploadedRoadmapPrompt,
  rebalanceRoadmapPrompt,
} from "../prompts";
import {
  RoadmapGenerationSchema,
  ParsedRoadmapSchema,
  type RoadmapGenerationOutput,
  type ParsedRoadmapOutput,
} from "../schemas";

export class RoadmapPlanner {
  async generateRoadmap(params: {
    targetRole: string;
    targetCompanies: string[];
    durationDays: number;
    dailyHours: number;
    currentLevel: string;
    subjects: string[];
    existingKnowledge: string[];
    excludeTopics?: string[];
  }): Promise<RoadmapGenerationOutput> {
    if (!isAIConfigured()) {
      throw new Error("AI is not configured. Please set your OpenAI API key to generate roadmaps.");
    }

    const response = await callAI(
      ROADMAP_PLANNER_SYSTEM,
      generateRoadmapPrompt(params),
      {
        model: "gpt-4o-mini",
        temperature: 0.6,
        maxTokens: 8192,
        responseFormat: { type: "json_object" },
      }
    );

    const parsed = JSON.parse(response);
    return RoadmapGenerationSchema.parse(parsed);
  }

  async parseUploadedRoadmap(text: string): Promise<ParsedRoadmapOutput> {
    if (!isAIConfigured()) {
      throw new Error("AI is not configured. Please set your OpenAI API key to parse roadmaps.");
    }

    const response = await callAI(
      ROADMAP_PLANNER_SYSTEM,
      parseUploadedRoadmapPrompt(text),
      {
        model: "gpt-4o-mini",
        temperature: 0.3,
        maxTokens: 4096,
        responseFormat: { type: "json_object" },
      }
    );

    const parsed = JSON.parse(response);
    return ParsedRoadmapSchema.parse(parsed);
  }

  async rebalanceRoadmap(params: {
    originalPlan: string;
    completedTopics: string[];
    pendingTopics: string[];
    remainingDays: number;
    dailyHours: number;
    weakTopics: string[];
  }): Promise<string> {
    if (!isAIConfigured()) {
      return "AI is not configured. Please set your OpenAI API key to rebalance roadmaps.";
    }

    return callAI(
      ROADMAP_PLANNER_SYSTEM,
      rebalanceRoadmapPrompt(params),
      { temperature: 0.5, maxTokens: 4096 }
    );
  }

  async generateDailySchedule(params: {
    topics: string[];
    availableMinutes: number;
    priorities: string[];
    revisionTopics: string[];
  }): Promise<string> {
    if (!isAIConfigured()) {
      return "AI is not configured.";
    }

    const prompt = `Generate a daily study schedule for ${params.availableMinutes} minutes:

Topics to cover: ${params.topics.join(", ")}
Priority topics: ${params.priorities.join(", ")}
Topics needing revision: ${params.revisionTopics.join(", ")}

Create a time-blocked schedule with:
- Learning tasks with durations
- Practice tasks
- Revision slots
- Short breaks between sessions

Be realistic about timing. Include buffer time.`;

    return callAI(ROADMAP_PLANNER_SYSTEM, prompt, { temperature: 0.6 });
  }
}

export const roadmapPlanner = new RoadmapPlanner();
