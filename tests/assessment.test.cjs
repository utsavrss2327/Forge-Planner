/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { randomUUID } = require("node:crypto"),
  { load } = require("./helpers.cjs");
const { gradeAnswers, validateGeneratedExam, publicQuestion } = load(
  "src/lib/assessment/schema.ts",
);
const q = (type = "short_answer") => ({
  id: randomUUID(),
  type,
  subject: "DBMS",
  topic: "Transactions",
  question: "Explain lost updates with an example",
  sourceIds: ["video:dbms"],
  minutes: 15,
  marks: 4,
  options: [],
  correctAnswer:
    "Two writers read the same old value and overwrite each other.",
  explanation: "Use serialization or locking.",
  rubric: [
    { criterion: "Identifies conflicting read-modify-write", points: 2 },
    { criterion: "Explains prevention", points: 2 },
  ],
});
test("grading gives no marks for length, enforces criteria bounds and rejects missing or duplicate evaluations", () => {
  const question = q(),
    answer = "Completely unrelated text that happens to be very long.";
  const zero = {
    questionId: question.id,
    criteria: [
      { index: 0, points: 0, reason: "No conflict described" },
      { index: 1, points: 0, reason: "No prevention described" },
    ],
    feedback: "The answer does not discuss transactions.",
    missingConcepts: ["Lost updates"],
  };
  assert.equal(
    gradeAnswers(
      [question],
      { [question.id]: answer },
      { evaluations: [zero] },
    )[0].marksAwarded,
    0,
  );
  assert.throws(() =>
    gradeAnswers([question], { [question.id]: answer }, { evaluations: [] }),
  );
  assert.throws(() =>
    gradeAnswers(
      [question],
      { [question.id]: answer },
      { evaluations: [zero, zero] },
    ),
  );
  assert.throws(() =>
    gradeAnswers(
      [question],
      { [question.id]: answer },
      {
        evaluations: [
          {
            ...zero,
            criteria: [
              { index: 0, points: 4, reason: "bad" },
              { index: 1, points: 2, reason: "bad" },
            ],
          },
        ],
      },
    ),
  );
});
test("MCQs and blanks use deterministic grading and public questions contain no keys", () => {
  const a = q("mcq");
  a.options = ["A", "B", "C", "D"].map((label) => ({ label, text: label }));
  a.correctAnswer = "B";
  assert.equal(
    gradeAnswers([a], { [a.id]: "b" }, { evaluations: [] })[0].marksAwarded,
    4,
  );
  assert.equal(gradeAnswers([q()], {}, { evaluations: [] })[0].marksAwarded, 0);
  const safe = publicQuestion(a);
  assert.equal(safe.correctAnswer, undefined);
  assert.equal(safe.rubric, undefined);
});
test("generation requires every source subject, valid provenance, valid rubric and 60 minutes", () => {
  const sources = [
    {
      id: "video:dbms",
      kind: "video",
      subject: "DBMS",
      title: "Transactions",
      topics: ["lost updates"],
      notes: "...",
    },
  ];
  const exam = {
    title: "Recall",
    questions: Array.from({ length: 4 }, () => q()),
  };
  exam.questions[0] = {
    ...exam.questions[0],
    type: "mcq",
    options: ["A", "B", "C", "D"].map((label) => ({ label, text: label })),
    correctAnswer: "B",
  };
  assert.equal(validateGeneratedExam(exam, sources).questions.length, 4);
  assert.throws(
    () =>
      validateGeneratedExam(
        {
          ...exam,
          questions: exam.questions.map((q) => ({
            ...q,
            type: "short_answer",
            options: [],
          })),
        },
        sources,
      ),
    /objective recall/,
  );
  assert.throws(() =>
    validateGeneratedExam(exam, [
      ...sources,
      { ...sources[0], id: "video:cn", subject: "Networks" },
    ]),
  );
  exam.questions[0].sourceIds = ["invented"];
  assert.throws(() => validateGeneratedExam(exam, sources));
});
test("context combines four subject playlists plus DSA without inventing video contents", () => {
  const { collectLearningSources } = load("src/lib/assessment/context.ts", {
    "server-only": {},
    "@/lib/storage/learning": {},
    "@/lib/storage/profile": {},
  });
  const subjects = ["Networks", "DBMS", "OS", "OOP"];
  const tracks = subjects.map((subject, i) => ({ id: "t" + i, subject })),
    playlists = subjects.map((s, i) => ({
      id: "p" + i,
      learning_track_id: "t" + i,
      title: s,
    }));
  const videos = subjects.flatMap((s, i) =>
    Array.from({ length: 4 }, (_, j) => ({
      id: `v${i}-${j}`,
      playlist_id: "p" + i,
      title: s + " concept",
      order_index: j,
      video_id: "real",
      last_studied_at: "2026-11-21T10:00:00Z",
      completed_at: null,
      notes: s + " notes",
      topics_learned: [s + " topic"],
    })),
  );
  videos.push({
    id: "empty",
    playlist_id: "p0",
    title: "Unannotated",
    last_studied_at: "2026-11-21T10:00:00Z",
    topics_learned: [],
  });
  const r = collectLearningSources(
    {
      profile: { timezone: "Asia/Kolkata" },
      tracks,
      playlists,
      videos,
      journals: [],
      tasks: [],
      problems: [
        {
          id: "dsa",
          name: "Two sum",
          topic: "Hash maps",
          status: "solved",
          last_attempted_at: "2026-11-21T10:00:00Z",
          solution_notes: "Used a hash map",
          mistakes: "Repeated indices",
        },
      ],
      revisions: [],
    },
    "2026-11-21",
    "2026-11-21",
  );
  assert.equal(r.sources.length, 17);
  assert.equal(new Set(r.sources.map((s) => s.subject)).size, 5);
  assert.ok(r.warnings.some((w) => w.includes("Unannotated")));
  assert.ok(!r.sources.some((s) => s.id === "video:empty"));
});
