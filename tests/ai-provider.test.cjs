/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { load } = require("./helpers.cjs");
test("Gemini uses native requests, bounded reasoning and JSON responses without routing keys through URLs", async () => {
  const names = ["AI_PROVIDER", "AI_MODEL", "GEMINI_API_KEY"],
    before = Object.fromEntries(names.map((n) => [n, process.env[n]])),
    real = global.fetch;
  let request;
  try {
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-4-hydrogen";
    process.env.GEMINI_API_KEY = "test-key-never-sent";
    global.fetch = async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  {
                    thought: true,
                    text: "Internal reasoning must not be returned",
                  },
                  { text: '{"ok":true}' },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      );
    };
    const client = load("src/lib/ai/client.ts", { "server-only": {} });
    const answer = await client.callAI(
      "System instruction",
      "Student material",
      {
        responseFormat: { type: "json_object" },
        maxTokens: 4000,
        jsonSchema: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
        },
      },
    );
    assert.equal(answer, '{"ok":true}');
    assert.ok(
      request.url.endsWith("/models/gemini-4-hydrogen:generateContent"),
    );
    assert.ok(!request.url.includes(process.env.GEMINI_API_KEY));
    assert.equal(
      request.body.systemInstruction.parts[0].text,
      "System instruction",
    );
    assert.equal(
      request.body.generationConfig.responseMimeType,
      "application/json",
    );
    assert.equal(
      request.body.generationConfig.thinkingConfig.thinkingLevel,
      "low",
    );
    assert.equal(request.body.generationConfig.maxOutputTokens, 4000);
    assert.deepEqual(
      request.body.generationConfig.responseJsonSchema.required,
      ["ok"],
    );
    let calls = 0;
    global.fetch = async () => {
      calls++;
      return new Response("{}", { status: 429 });
    };
    await assert.rejects(client.callAI("System", "Input"), /quota/);
    assert.equal(calls, 1, "No provider or paid fallback call");
    global.fetch = async () => {
      throw new DOMException("Aborted", "TimeoutError");
    };
    await assert.rejects(client.callAI("System", "Input"), /timed out/);
  } finally {
    global.fetch = real;
    for (const n of names)
      if (before[n] === undefined) delete process.env[n];
      else process.env[n] = before[n];
  }
});
