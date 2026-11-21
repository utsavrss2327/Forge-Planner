/* eslint-disable @typescript-eslint/no-require-imports -- Explicit live provider verification using nonpersonal fixtures and in-memory storage. */
const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  { load } = require("../tests/helpers.cjs");
if (!process.env.GEMINI_API_KEY)
  throw Error("Set GEMINI_API_KEY locally. Never pass it on the command line.");
if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== "gemini")
  throw Error("This verification is for Gemini only.");
const client = load("src/lib/ai/client.ts", { "server-only": {} });
const material = [
  [
    "Computer Networks",
    [
      "OSI layers separate responsibilities; IP routes packets between networks.",
      "TCP uses sequence numbers, acknowledgements and retransmissions for ordered reliable delivery.",
      "UDP datagrams do not guarantee delivery or ordering.",
      "DNS resolves names; A records contain IPv4 addresses and AAAA records IPv6.",
    ],
  ],
  [
    "DBMS",
    [
      "Atomicity means all transaction changes commit or none do.",
      "Two transactions reading and overwriting the same value can lose an update; suitable locking or serialization prevents it.",
      "BCNF requires every determinant of a nontrivial functional dependency to be a superkey; 3NF additionally permits a prime right-hand attribute.",
      "A B+ tree index speeds indexed reads but adds storage and write maintenance cost.",
    ],
  ],
  [
    "Operating Systems",
    [
      "Threads of a process share its address space; processes usually have separate address spaces.",
      "Round-robin scheduling uses a time quantum; smaller quanta can improve responsiveness but increase context switching.",
      "Deadlock requires mutual exclusion, hold-and-wait, no preemption and circular wait.",
      "A page fault occurs when a referenced virtual page is not currently available in physical memory.",
    ],
  ],
  [
    "Object-Oriented Programming",
    [
      "Encapsulation hides representation behind an interface.",
      "Subtypes should preserve behavioral expectations of their base type.",
      "Runtime polymorphism dispatches an overridden method through a base interface.",
      "Composition can reduce inheritance coupling by delegating behavior to contained objects.",
    ],
  ],
];
const sources = material.flatMap(([subject, notes], i) =>
  notes.map((note, j) => ({
    id: `video:fixture-${i}-${j}`,
    kind: "video",
    subject,
    title: `${subject} playlist video ${j + 1}`,
    topics: [note.split(";")[0]],
    notes: note,
  })),
);
sources.push({
  id: "dsa:fixture-two-sum",
  kind: "dsa",
  subject: "Data Structures & Algorithms",
  title: "Two sum attempt",
  topics: ["Hash map complement lookup"],
  notes:
    "Given an array and target, find two distinct indices whose values sum to target. I look up target-current in a hash map before inserting current to avoid reusing the same index. Expected O(n) time and O(n) space. Mistake: initially inserted before lookup.",
});
let generated;
const owner = "nonpersonal-provider-verification",
  id = "10000000-0000-4000-8000-000000000001";
const answerMap = {};
const admin = {
  rpc: async (name, args) => {
    if (name === "persist_generated_assessment") {
      generated = args.payload;
      return { data: id, error: null };
    }
    if (name === "finalize_assessment") {
      admin.grades = args.payload;
      return { error: null };
    }
    throw Error("Unexpected fixture RPC.");
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
        data: { id, user_id: owner, status: "submitted" },
      }),
      then(resolve) {
        const questions = generated.questions.map((q, i) => ({
          id: q.id,
          question_type: q.type,
          question_text: q.question,
          correct_answer: q.correctAnswer,
          marks: q.marks,
          subject: q.subject,
          topic: q.topic,
          options: q.options,
          explanation: q.explanation,
          rubric: q.rubric,
          source_ids: q.sourceIds,
          estimated_minutes: q.minutes,
          order_index: i,
        }));
        const data =
          table === "assessment_questions"
            ? questions
            : generated.questions.map((q) => ({
                question_id: q.id,
                user_answer: answerMap[q.id],
              }));
        return Promise.resolve({ data, error: null }).then(resolve);
      },
    };
    return chain;
  },
};
const actions = load("src/app/(app)/assessments/actions.ts", {
  "next/cache": { revalidatePath() {} },
  "@/lib/storage/learning": {
    learningContext: async () => ({
      userId: owner,
      db: { rpc: async () => ({ data: "submitted", error: null }) },
    }),
  },
  "@/lib/assessment/context": {
    readAssessmentContext: async () => ({ sources, warnings: [] }),
  },
  "@/lib/supabase/admin": { assessmentAdmin: () => admin },
  "@/lib/ai/client": client,
});
(async () => {
  const config = client.aiConfiguration();
  console.log({
    provider: config.provider,
    model: config.model,
    fixtureSources: sources.length,
    subjects: new Set(sources.map((s) => s.subject)).size,
    productionDatabaseWrites: false,
  });
  const result = await actions.generateDailyAssessmentAction(
    "2026-11-21",
    "2026-11-21",
  );
  if (result.error) throw Error(result.error);
  assert.ok(generated);
  console.log({
    generation: "passed",
    questions: generated.questions.length,
    duration: generated.questions.reduce((n, q) => n + q.minutes, 0),
    coveredSubjects: new Set(generated.questions.map((q) => q.subject)).size,
  });
  const written = generated.questions.find((q) => q.type !== "mcq");
  if (!written)
    throw Error("Generation did not include a written/application question.");
  for (const q of generated.questions)
    answerMap[q.id] =
      q.id === written.id
        ? "I will talk about purple bananas instead of answering the question."
        : q.correctAnswer;
  const grade = await actions.submitAssessmentAction(id, answerMap);
  if (grade.error) throw Error(grade.error);
  const wrong = admin.grades.find((g) => g.questionId === written.id);
  assert.equal(
    wrong.marksAwarded,
    0,
    "Unrelated long prose must earn zero marks.",
  );
  const receipt = {
    verifiedAt: new Date().toISOString(),
    provider: config.provider,
    model: config.model,
    fixtureSources: sources.length,
    subjects: 5,
    questions: generated.questions.length,
    durationMinutes: 60,
    generationSchemaValidated: true,
    gradingSchemaValidated: true,
    unrelatedWrittenAnswerScore: wrong.marksAwarded,
    productionDatabaseWrites: false,
    limitations:
      "Nonpersonal provider fixture; not a signed-in production exam or code-execution test.",
  };
  fs.writeFileSync(
    "supabase/gemini-verification.json",
    JSON.stringify(receipt, null, 2) + "\n",
  );
  console.log({
    grading: "passed",
    unrelatedAnswerScore: wrong.marksAwarded,
    receipt: "supabase/gemini-verification.json",
  });
})().catch((e) => {
  console.error(e.message.split(process.env.GEMINI_API_KEY).join("[REDACTED]"));
  process.exitCode = 1;
});
