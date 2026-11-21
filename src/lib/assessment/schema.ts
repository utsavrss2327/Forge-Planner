import { z } from "zod";
export const sourceSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["video", "journal", "task", "dsa", "revision"]),
  subject: z.string().min(1),
  title: z.string(),
  topics: z.array(z.string()),
  notes: z.string(),
  url: z.string().optional(),
  difficulty: z.number().optional(),
});
export type LearningSource = z.infer<typeof sourceSchema>;
export const examQuestionSchema = z
  .object({
    id: z.string().uuid(),
    type: z.enum(["mcq", "short_answer", "coding"]),
    subject: z.string().min(1),
    topic: z.string().min(1),
    question: z.string().min(10).max(6000),
    sourceIds: z.array(z.string()).min(1).max(10),
    minutes: z.number().int().min(1).max(30),
    marks: z.number().int().min(1).max(20),
    options: z
      .array(
        z.object({
          label: z.enum(["A", "B", "C", "D"]),
          text: z.string().min(1),
        }),
      )
      .max(4)
      .default([]),
    correctAnswer: z.string().min(1).max(12000),
    explanation: z.string().min(1).max(5000),
    rubric: z
      .array(
        z.object({
          criterion: z.string().min(1).max(600),
          points: z.number().int().positive(),
        }),
      )
      .min(1)
      .max(8),
  })
  .superRefine((q, ctx) => {
    if (q.rubric.reduce((n, r) => n + r.points, 0) !== q.marks)
      ctx.addIssue({
        code: "custom",
        message: "Rubric points must sum to question marks.",
      });
    if (
      q.type === "mcq" &&
      (q.options.length !== 4 ||
        new Set(q.options.map((o) => o.label)).size !== 4 ||
        !q.options.some((o) => o.label === q.correctAnswer))
    )
      ctx.addIssue({
        code: "custom",
        message: "MCQ must have four distinct labels and a valid answer.",
      });
  });
export const examSchema = z.object({
  title: z.string().min(1).max(160),
  questions: z.array(examQuestionSchema).min(4).max(20),
});
export type ExamQuestion = z.infer<typeof examQuestionSchema>;
export type PublicQuestion = Omit<
  ExamQuestion,
  "correctAnswer" | "explanation" | "rubric"
>;
export const gradingSchema = z.object({
  evaluations: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        criteria: z
          .array(
            z.object({
              index: z.number().int().min(0),
              points: z.number().finite().nonnegative(),
              reason: z.string().min(1).max(2000),
            }),
          )
          .min(1)
          .max(8),
        missingConcepts: z.array(z.string().max(300)).max(10),
        feedback: z.string().min(1).max(4000),
      }),
    )
    .max(20),
});
export type Grade = {
  questionId: string;
  marksAwarded: number;
  isCorrect: boolean;
  feedback: string;
  missingConcepts: string[];
  criteria: { index: number; points: number; reason: string }[];
};
export function validateGeneratedExam(
  value: unknown,
  sources: LearningSource[],
) {
  const exam = examSchema.parse(value),
    ids = new Set(sources.map((s) => s.id)),
    subjects = new Set(sources.map((s) => s.subject));
  if (
    !exam.questions.some((q) => q.type === "mcq") ||
    !exam.questions.some((q) => q.type === "short_answer")
  )
    throw Error(
      "Assessment must include objective recall and written explanation questions.",
    );
  if (
    sources.some((s) => s.kind === "dsa") &&
    !exam.questions.some(
      (q) =>
        q.type === "coding" &&
        q.sourceIds.some((id) =>
          sources.some((s) => s.id === id && s.kind === "dsa"),
        ),
    )
  )
    throw Error("A studied DSA attempt needs a sourced coding variation.");
  if (new Set(exam.questions.map((q) => q.id)).size !== exam.questions.length)
    throw Error("Duplicate question IDs.");
  if (exam.questions.reduce((n, q) => n + q.minutes, 0) !== 60)
    throw Error("Assessment question durations must total 60 minutes.");
  for (const q of exam.questions) {
    if (q.sourceIds.some((id) => !ids.has(id)))
      throw Error("Question references an unknown learning source.");
    if (
      !q.sourceIds.some(
        (id) => sources.find((s) => s.id === id)?.subject === q.subject,
      )
    )
      throw Error("Question subject must match its learning evidence.");
  }
  for (const subject of subjects)
    if (!exam.questions.some((q) => q.subject === subject))
      throw Error(
        `Assessment omitted ${subject}. Narrow the date range or retry.`,
      );
  return exam;
}
export function gradeAnswers(
  questions: ExamQuestion[],
  answers: Record<string, string>,
  ai: unknown,
): Grade[] {
  const parsed = gradingSchema.parse(ai),
    expected = questions.filter(
      (q) => q.type !== "mcq" && !!answers[q.id]?.trim(),
    );
  if (
    parsed.evaluations.length !== expected.length ||
    new Set(parsed.evaluations.map((e) => e.questionId)).size !==
      expected.length ||
    parsed.evaluations.some((e) => !expected.some((q) => q.id === e.questionId))
  )
    throw Error(
      "AI returned incomplete or duplicate grading. No score was saved.",
    );
  return questions.map((q) => {
    const answer = answers[q.id]?.trim() ?? "";
    if (!answer)
      return {
        questionId: q.id,
        marksAwarded: 0,
        isCorrect: false,
        feedback: "No answer submitted.",
        missingConcepts: [q.topic],
        criteria: [],
      };
    if (q.type === "mcq") {
      const correct = answer.toUpperCase() === q.correctAnswer.toUpperCase();
      return {
        questionId: q.id,
        marksAwarded: correct ? q.marks : 0,
        isCorrect: correct,
        feedback: q.explanation,
        missingConcepts: correct ? [] : [q.topic],
        criteria: [],
      };
    }
    const e = parsed.evaluations.find((e) => e.questionId === q.id)!;
    if (
      e.criteria.length !== q.rubric.length ||
      new Set(e.criteria.map((c) => c.index)).size !== q.rubric.length ||
      e.criteria.some(
        (c) => !q.rubric[c.index] || c.points > q.rubric[c.index].points,
      )
    )
      throw Error(
        "AI rubric marks exceeded the validated rubric. No score was saved.",
      );
    const score =
      Math.round(e.criteria.reduce((n, c) => n + c.points, 0) * 10) / 10;
    return {
      questionId: q.id,
      marksAwarded: score,
      isCorrect: score === q.marks,
      feedback: e.feedback,
      missingConcepts: e.missingConcepts,
      criteria: e.criteria,
    };
  });
}
export function publicQuestion(q: ExamQuestion): PublicQuestion {
  return {
    id: q.id,
    type: q.type,
    subject: q.subject,
    topic: q.topic,
    question: q.question,
    sourceIds: q.sourceIds,
    minutes: q.minutes,
    marks: q.marks,
    options: q.options,
  };
}
// Provider-side schema enforcement complements, never replaces, our stronger invariant checks.
const providerExamSchema = z.object({
  title: z.string().min(1).max(160),
  questions: z
    .array(z.object({ ...examQuestionSchema.shape, id: z.string().optional() }))
    .min(4)
    .max(16),
});
function providerShape(node: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (["type", "required", "enum", "additionalProperties"].includes(key))
      result[key] = value;
    else if (key === "properties")
      result[key] = Object.fromEntries(
        Object.entries(value as Record<string, Record<string, unknown>>).map(
          ([name, field]) => [name, providerShape(field)],
        ),
      );
    else if (key === "items")
      result[key] = providerShape(value as Record<string, unknown>);
    else if (["anyOf", "oneOf"].includes(key))
      result[key] = (value as Record<string, unknown>[]).map(providerShape);
  }
  return result;
}
// Full numeric/string/array bounds remain enforced by Zod after generation. Encoding
// nested bounds in Gemini's grammar can exceed its serving-state limit.
export const assessmentGenerationJSONSchema = providerShape(
  z.toJSONSchema(providerExamSchema),
);
export const assessmentGradingJSONSchema = providerShape(
  z.toJSONSchema(gradingSchema),
);
