"use server";
import { studyDate } from "@/lib/dates";
import { learningContext } from "@/lib/storage/learning";
import { readPlacement } from "@/lib/storage/placement";
import { readProfile } from "@/lib/storage/profile";
import type { DSAProblemStatus } from "@/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
const status = z.enum(["pending", "attempted", "solved", "revision_needed"]);
export async function getDsaDataAction() {
  const r = await readPlacement();
  return { problems: r.problems, topicMastery: r.mastery };
}
export async function createDsaProblemAction(form: FormData) {
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(240),
      url: z
        .string()
        .url()
        .refine((s) => /^https?:/.test(s))
        .or(z.literal("")),
      topic: z.string().trim().min(1).max(120),
      difficulty: z.enum(["easy", "medium", "hard"]),
      platform: z.enum([
        "leetcode",
        "geeksforgeeks",
        "codeforces",
        "hackerrank",
        "other",
      ]),
      status,
      time_taken_minutes: z.number().int().min(0).max(1440),
      solution_notes: z.string().max(12000),
      mistakes: z.string().max(8000),
    })
    .safeParse({
      name: form.get("name"),
      url: form.get("url") || "",
      topic: form.get("topic"),
      difficulty: form.get("difficulty") || "medium",
      platform: form.get("platform") || "leetcode",
      status: form.get("status") || "attempted",
      time_taken_minutes: Number(form.get("timeTaken") || 0),
      solution_notes: form.get("solutionNotes") || "",
      mistakes: form.get("mistakes") || "",
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { db, userId, demo } = await learningContext();
  if (demo) return { error: "Use a connected account for DSA tracking." };
  const p = await readProfile();
  const { error } = await db.from("dsa_problems").insert({
    ...parsed.data,
    url: parsed.data.url || null,
    user_id: userId,
    attempts: 1,
    needs_revision: form.get("needsRevision") === "true",
    last_attempted_at: new Date().toISOString(),
    date_solved:
      parsed.data.status === "solved" ? studyDate(p?.timezone) : null,
  });
  if (error) return { error: "Could not save DSA attempt." };
  revalidatePath("/dsa");
  return { success: true };
}
export async function updateDsaProblemStatusAction(
  id: string,
  next: DSAProblemStatus,
) {
  if (!status.safeParse(next).success) return { error: "Invalid status." };
  const { db, userId } = await learningContext();
  const p = await readProfile();
  const { data, error } = await db
    .from("dsa_problems")
    .update({
      status: next,
      last_attempted_at: new Date().toISOString(),
      date_solved: next === "solved" ? studyDate(p?.timezone) : null,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");
  if (error || !data?.length)
    return { error: "Problem not found or update failed." };
  revalidatePath("/dsa");
  return { success: true };
}
export async function toggleDsaRevisionAction(id: string) {
  const { db, userId } = await learningContext();
  const { data: p, error } = await db
    .from("dsa_problems")
    .select("needs_revision,updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) return { error: "Problem not found." };
  const r = await db
    .from("dsa_problems")
    .update({ needs_revision: !p.needs_revision })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("updated_at", p.updated_at)
    .select("id");
  if (r.error || !r.data?.length)
    return { error: "Problem changed. Reload and retry." };
  revalidatePath("/dsa");
  return { success: true, needs_revision: !p.needs_revision };
}
