import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }
  return openaiInstance;
}

export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: "json_object" } | { type: "text" };
  }
): Promise<string> {
  if (!isAIConfigured()) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.");
  }

  const client = getOpenAIClient();

  try {
    const completion = await client.chat.completions.create({
      model: options?.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      ...(options?.responseFormat && { response_format: options.responseFormat }),
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: unknown) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw new Error("AI rate limit reached. Please try again in a few moments.");
      }
      throw new Error(`AI service error: ${error.message}`);
    }
    throw error;
  }
}

export async function callAIWithMessages(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: "json_object" } | { type: "text" };
  }
): Promise<string> {
  if (!isAIConfigured()) {
    throw new Error("OpenAI API key is not configured.");
  }

  const client = getOpenAIClient();

  try {
    const completion = await client.chat.completions.create({
      model: options?.model || "gpt-4o-mini",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      ...(options?.responseFormat && { response_format: options.responseFormat }),
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: unknown) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw new Error("AI rate limit reached. Please try again in a few moments.");
      }
      throw new Error(`AI service error: ${error.message}`);
    }
    throw error;
  }
}
