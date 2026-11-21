import { isDateKey } from "@/lib/dates";
import { z } from "zod";
export const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const date = z.string().refine(isDateKey, "Use a real calendar date.");
export const topicSchema = z.object({
  id: z.string().uuid(),
  subject: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(240),
  minutes: z.number().int().min(15).max(2400),
  prerequisites: z.array(z.string().uuid()).max(20).default([]),
  resource: z
    .string()
    .url()
    .refine((v) => /^https?:/.test(v))
    .or(z.literal(""))
    .default(""),
  sourceReference: z.string().max(500).optional(),
  completed: z.boolean().default(false),
});
export const roadmapInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    topics: z.array(topicSchema).min(1).max(200),
  })
  .superRefine((v, ctx) => {
    const ids = new Set(v.topics.map((t) => t.id));
    if (ids.size !== v.topics.length)
      ctx.addIssue({ code: "custom", message: "Topic IDs must be unique." });
    for (const t of v.topics)
      if (t.prerequisites.some((p) => !ids.has(p) || p === t.id))
        ctx.addIssue({
          code: "custom",
          message:
            "Prerequisites must reference another topic in this roadmap.",
        });
    const visiting = new Set<string>(),
      visited = new Set<string>();
    function visit(id: string): boolean {
      if (visiting.has(id)) return false;
      if (visited.has(id)) return true;
      visiting.add(id);
      for (const p of v.topics.find((t) => t.id === id)?.prerequisites ?? [])
        if (!visit(p)) return false;
      visiting.delete(id);
      visited.add(id);
      return true;
    }
    if (v.topics.some((t) => !visit(t.id)))
      ctx.addIssue({
        code: "custom",
        message: "Prerequisites contain a cycle.",
      });
  });
export const subjectRuleSchema = z.object({
  subject: z.string().min(1).max(120),
  sessions: z.number().int().min(0).max(14),
  minutes: z.number().int().min(15).max(180),
  priority: z.number().int().min(1).max(5),
  mandatory: z.boolean(),
});
export const windowSchema = z
  .object({
    day: z.number().int().min(0).max(6),
    start: z.number().int().min(0).max(1439),
    end: z.number().int().min(1).max(1440),
    capacity: z.number().int().min(0).max(1440),
  })
  .refine(
    (w) => w.end > w.start && w.capacity <= w.end - w.start,
    "Availability must fit its time window.",
  );
export const sessionSchema = z.object({
  id: z.string().uuid(),
  topicId: z.string().uuid().nullable(),
  subject: z.string().min(1).max(120),
  title: z.string().min(1).max(240),
  date,
  start: z.number().int().min(0).max(1439),
  minutes: z.number().int().min(15).max(240),
  kind: z.enum([
    "learning",
    "practice",
    "revision",
    "assessment",
    "commitment",
    "break",
  ]),
  locked: z.boolean(),
  notes: z.string().max(4000).default(""),
  resource: z
    .string()
    .url()
    .refine((v) => /^https?:/.test(v))
    .or(z.literal(""))
    .default(""),
});
export const routineSchema = z
  .object({
    week: date,
    windows: z.array(windowSchema).length(7),
    rules: z.array(subjectRuleSchema).min(1).max(40),
    maxSubjects: z.number().int().min(1).max(12),
    sessions: z.array(sessionSchema).max(140),
    topics: z.array(topicSchema).max(200),
  })
  .superRefine((v, ctx) => {
    if (
      new Set(v.windows.map((w) => w.day)).size !== 7 ||
      new Set(v.rules.map((r) => r.subject)).size !== v.rules.length ||
      new Set(v.sessions.map((s) => s.id)).size !== v.sessions.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Days, subjects and session IDs must be unique.",
      });
  });
export type Topic = z.infer<typeof topicSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Routine = z.infer<typeof routineSchema>;
export type RoutineRow = {
  id: string;
  user_id: string;
  version: number;
  state: string;
  draft: Routine;
  approved: Routine | null;
  approved_version: number | null;
  updated_at: string;
};
