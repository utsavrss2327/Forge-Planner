/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { randomUUID } = require("node:crypto"),
  { load } = require("./helpers.cjs");
function actions({
  submissionError = false,
  failGrading = true,
  type = "short_answer",
} = {}) {
  const id = randomUUID(),
    qid = randomUUID(),
    calls = [];
  const question = {
    id: qid,
    question_type: type,
    subject: "DBMS",
    topic: "Transactions",
    question_text: "Explain lost updates",
    source_ids: ["video:1"],
    estimated_minutes: 60,
    marks: 4,
    options: [],
    correct_answer: type === "mcq" ? "B" : "Read modify write",
    explanation: "Reference explanation",
    rubric: [{ criterion: "Explains conflicting writes", points: 4 }],
  };
  const admin = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      return { error: null };
    },
    from(table) {
      const chain = {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        order() {
          return this;
        },
        single: async () => ({
          data: { id, user_id: "owner", status: "submitted" },
        }),
        then(resolve) {
          return Promise.resolve({
            data:
              table === "assessment_questions"
                ? [question]
                : [
                    {
                      question_id: qid,
                      user_answer: type === "mcq" ? "B" : "Student reasoning",
                    },
                  ],
            error: null,
          }).then(resolve);
        },
      };
      return chain;
    },
  };
  const api = load("src/app/(app)/assessments/actions.ts", {
    "next/cache": { revalidatePath() {} },
    "@/lib/storage/learning": {
      learningContext: async () => ({
        userId: "owner",
        db: {
          rpc: async (name, args) => {
            calls.push({ name, args });
            return {
              data: "submitted",
              error: submissionError ? { message: "connection lost" } : null,
            };
          },
        },
      }),
    },
    "@/lib/assessment/context": {},
    "@/lib/supabase/admin": { assessmentAdmin: () => admin },
    "@/lib/ai/client": {
      callAI: async () => {
        if (failGrading) throw Error("Quota reached");
        return JSON.stringify({
          evaluations: [
            {
              questionId: qid,
              criteria: [
                {
                  index: 0,
                  points: 1,
                  reason: "Identifies a shared record but no lost write",
                },
              ],
              feedback: "Explain the second write overwriting the first.",
              missingConcepts: ["Lost write"],
            },
          ],
        });
      },
    },
  });
  return { api, id, qid, calls };
}
test("grading quota failure freezes persisted submission with no invented score and retry marker", async () => {
  const { api, id, qid, calls } = actions();
  const r = await api.submitAssessmentAction(id, { [qid]: "User reasoning" });
  assert.equal(r.submitted, true);
  assert.match(r.error, /Quota reached/);
  assert.equal(calls[0].name, "save_assessment_answers");
  assert.equal(
    calls.some((c) => c.name === "finalize_assessment"),
    false,
  );
});
test("failed submission does not falsely lock the client form", async () => {
  const { api, id, qid } = actions({ submissionError: true });
  const r = await api.submitAssessmentAction(id, { [qid]: "User reasoning" });
  assert.ok(r.error);
  assert.notEqual(r.submitted, true);
});
test("validated partial credit is finalized once using authenticated owner and saved answers", async () => {
  const { api, id, qid, calls } = actions({ failGrading: false });
  const r = await api.submitAssessmentAction(id, { [qid]: "Client draft" });
  assert.equal(r.success, true);
  const final = calls.find((c) => c.name === "finalize_assessment");
  assert.equal(final.args.owner_id, "owner");
  assert.equal(final.args.payload[0].marksAwarded, 1);
});
test("objective-only submission grades without requiring an AI response", async () => {
  const { api, id, qid, calls } = actions({ type: "mcq" });
  const r = await api.submitAssessmentAction(id, { [qid]: "B" });
  assert.equal(r.success, true);
  assert.equal(
    calls.find((c) => c.name === "finalize_assessment").args.payload[0]
      .marksAwarded,
    4,
  );
});
test("an OpenAI key never becomes an automatic paid fallback for default Gemini configuration", () => {
  const names = ["AI_PROVIDER", "AI_MODEL", "OPENAI_API_KEY", "GEMINI_API_KEY"],
    before = Object.fromEntries(names.map((n) => [n, process.env[n]]));
  try {
    for (const n of names) delete process.env[n];
    process.env.OPENAI_API_KEY = "test-not-sent";
    const client = load("src/lib/ai/client.ts", { "server-only": {} });
    assert.equal(client.aiConfiguration().provider, "gemini");
    assert.equal(client.isAIConfigured(), false);
    assert.throws(() => client.getOpenAIClient(), /unavailable/);
  } finally {
    for (const n of names)
      if (before[n] === undefined) delete process.env[n];
      else process.env[n] = before[n];
  }
});
