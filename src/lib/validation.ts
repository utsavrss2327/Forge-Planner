import { z } from "zod";
import { isDateKey, isTimezone } from "./dates";

export const text = (max = 200) => z.string().trim().max(max);
export const dateKey = z.string().refine(isDateKey, "Enter a valid calendar date.");
export const prioritySchema = z.enum(["low", "medium", "high", "critical"]);
export const daysSchema = z.array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])).min(1).max(7);
export const tagsSchema = z.array(text(200).min(1)).max(100);
export function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
export function tags(value: string): string[] {
  return [...new Set(value.split(",").map((v) => v.trim()).filter(Boolean))];
}
export const profileSchema = z.object({
  full_name: text(100).min(1, "Enter your name."),
  target_role: text().min(1), education_level: text(),
  target_date: dateKey.nullable(), target_companies: tagsSchema,
  preparation_level: z.enum(["beginner", "intermediate", "advanced"]),
  daily_study_hours: z.number().min(0.25).max(16), available_days: daysSchema,
  preparation_subjects: tagsSchema.min(1, "Select at least one preparation subject."),
  strong_subjects: tagsSchema, weak_subjects: tagsSchema, completed_topics: tagsSchema,
  study_preference: z.enum(["structured", "flexible"]),
  timezone: text(100).refine(isTimezone, "Enter a valid IANA timezone, such as Asia/Kolkata."),
}).refine((p) => !p.strong_subjects.some((s) => p.weak_subjects.includes(s)), "A subject cannot be both a strength and a weakness.");

export const webUrl = z.string().url().refine((value) => ["https:", "http:"].includes(new URL(value).protocol), "Use an http or https URL.");
export const trackSchema = z.object({
  title: text().min(1, "Enter a track title."), description: text(10000), subject: text(), target_outcome: text(2000),
  deadline: dateKey.nullable(), priority: prioritySchema, daily_goal: text(1000), weekly_goal: text(1000),
  notes: text(50000), resource_links: z.array(webUrl).max(30),
  status: z.enum(["active", "paused", "completed", "archived"]),
});
export const journalSchema = z.object({
  summary: text(20000), concepts: tagsSchema, confusing_topics: tagsSchema, questions: tagsSchema,
  code: z.string().max(50000), language: text(50),
}).refine((j) => Boolean(j.summary || j.concepts.length || j.code.trim()), "Record a summary, concept, or code snippet before saving.");

export const taskSchema = z.object({
  title: text().min(1, "Enter a task title."), description: text(10000), subject: text(),
  scheduled_date: dateKey, estimated_minutes: z.number().int().min(1).max(960), priority: prioritySchema,
  source_url: z.union([z.literal(""), webUrl]), learning_track_id: z.string().nullable(),
});
