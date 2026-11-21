import OpenAI from "openai";
import "server-only";

type Options = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, unknown>;
  responseFormat?: { type: "json_object" } | { type: "text" };
};
export function aiConfiguration() {
  const provider = process.env.AI_PROVIDER || "gemini";
  if (!["gemini", "groq", "openai"].includes(provider))
    throw new Error("Choose gemini, groq or openai for AI_PROVIDER.");
  const apiKey =
    provider === "gemini"
      ? process.env.GEMINI_API_KEY
      : provider === "groq"
        ? process.env.GROQ_API_KEY
        : process.env.OPENAI_API_KEY;
  const model =
    process.env.AI_MODEL ||
    (provider === "gemini"
      ? "gemini-3.1-flash-lite"
      : provider === "groq"
        ? "llama-3.3-70b-versatile"
        : "gpt-4o-mini");
  const baseURL =
    provider === "gemini"
      ? "https://generativelanguage.googleapis.com/v1beta/openai/"
      : provider === "groq"
        ? "https://api.groq.com/openai/v1"
        : undefined;
  return { provider, apiKey, model, baseURL };
}
export function getOpenAIClient(): OpenAI {
  const config = aiConfiguration();
  if (!config.apiKey)
    throw new Error(
      "AI is unavailable. Configure the selected provider's server-side API key.",
    );
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: 45000,
    maxRetries: 0,
  });
}
export function isAIConfigured(): boolean {
  return !!aiConfiguration().apiKey;
}
export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: Options,
): Promise<string> {
  return callAIWithMessages(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    options,
  );
}
export async function callAIWithMessages(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: Options,
): Promise<string> {
  const config = aiConfiguration();
  if (config.provider === "gemini") return callGeminiNative(messages, options);
  const client = getOpenAIClient();
  try {
    const result = await client.chat.completions.create({
      model:
        config.provider === "openai"
          ? options?.model || config.model
          : config.model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 8192,
      ...(options?.responseFormat
        ? { response_format: options.responseFormat }
        : {}),
    });
    if (result.choices[0]?.finish_reason === "length")
      throw new Error(
        "AI response exceeded its limit. Reduce the source material and retry.",
      );
    const content = result.choices[0]?.message?.content;
    if (!content)
      throw new Error(
        "AI returned no content. Your work has not been graded or replaced.",
      );
    return content;
  } catch (error) {
    if (error instanceof OpenAI.APIConnectionTimeoutError)
      throw new Error(
        "AI request timed out. Your saved work is safe; retry later.",
      );
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429)
        throw new Error(
          "AI free-tier or account quota reached. Your saved work is safe; retry later or configure another provider. No paid fallback is used.",
        );
      throw new Error(
        "AI provider unavailable. Check the selected model and API key; your saved work is safe.",
      );
    }
    throw error;
  }
}

export const GEMINI_TIMEOUT_MS = 90000;
async function callGeminiNative(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: Options,
): Promise<string> {
  const config = aiConfiguration();
  if (!config.apiKey)
    throw new Error(
      "AI is unavailable. Configure the selected provider's server-side API key.",
    );
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey,
        },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: messages
                  .filter((m) => m.role === "system")
                  .map((m) => m.content)
                  .join("\n\n"),
              },
            ],
          },
          contents: messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          generationConfig: {
            temperature: options?.temperature ?? 0.3,
            maxOutputTokens: options?.maxTokens ?? 8192,
            ...(options?.responseFormat?.type === "json_object"
              ? { responseMimeType: "application/json" }
              : {}),
            ...(options?.jsonSchema
              ? { responseJsonSchema: options.jsonSchema }
              : {}),
            ...(/^gemini-[34]/.test(config.model)
              ? { thinkingConfig: { thinkingLevel: "low" } }
              : {}),
          },
        }),
      },
    );
    if (!response.ok) {
      if (response.status === 429)
        throw new Error(
          "AI free-tier or account quota reached. Your saved work is safe; retry later. No paid fallback is used.",
        );
      throw new Error(
        `Gemini request failed (HTTP ${response.status}). Check the selected model, API access and key; saved work is safe.`,
      );
    }
    const data = await response.json(),
      candidate = data.candidates?.[0];
    if (candidate?.finishReason === "MAX_TOKENS")
      throw new Error(
        "AI response exceeded its limit. Reduce source material and retry.",
      );
    if (candidate?.finishReason !== "STOP")
      throw new Error(
        "Gemini did not complete the response. Your work was not graded or replaced.",
      );
    const content = candidate.content?.parts
      ?.filter(
        (p: { text?: string; thought?: boolean }) => p.text && !p.thought,
      )
      .map((p: { text: string }) => p.text)
      .join("");
    if (!content)
      throw new Error(
        "Gemini returned no content. No substitute or estimated score was created.",
      );
    return content;
  } catch (error) {
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    )
      throw new Error(
        "Gemini request timed out. Your saved work is safe; retry later.",
      );
    throw error;
  }
}
