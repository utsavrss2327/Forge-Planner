"use server";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { isDateKey, studyDate } from "@/lib/dates";
import { learningContext } from "@/lib/storage/learning";
import { readPlacement } from "@/lib/storage/placement";
import { readProfile } from "@/lib/storage/profile";
import type { ApplicationStatus } from "@/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function getApplicationsAction() {
  return { applications: (await readPlacement()).applications };
}
export async function createApplicationAction(f: FormData) {
  const s = (k: string) => String(f.get(k) || "").trim();
  const payload = {
    company: s("company"),
    role: s("role"),
    location: s("location"),
    job_url: s("jobUrl"),
    status: s("status") || "saved",
    referral_status: s("referralStatus"),
    resume_version: s("resumeVersion"),
    deadline: s("deadline") || null,
    salary_range: s("salaryRange"),
    notes: s("notes"),
  };
  const parsed = z
    .object({
      company: z.string().min(1).max(200),
      role: z.string().min(1).max(200),
      location: z.string().max(200),
      job_url: z
        .string()
        .url()
        .refine((s) => /^https?:/.test(s))
        .or(z.literal("")),
      status: z.enum(APPLICATION_STATUSES),
      referral_status: z.string().max(200),
      resume_version: z.string().max(200),
      deadline: z.string().refine(isDateKey).nullable(),
      salary_range: z.string().max(200),
      notes: z.string().max(12000),
    })
    .safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { db, userId, demo } = await learningContext();
  if (demo) return { error: "Connect an account to save applications." };
  const p = await readProfile();
  const { error } = await db.from("job_applications").insert({
    ...parsed.data,
    user_id: userId,
    job_url: payload.job_url || null,
    application_date: studyDate(p?.timezone),
  });
  if (error) return { error: "Application could not be saved." };
  revalidatePath("/applications");
  return { success: true };
}
export async function updateApplicationStatusAction(
  id: string,
  status: ApplicationStatus,
) {
  if (!z.enum(APPLICATION_STATUSES).safeParse(status).success)
    return { error: "Invalid application status." };
  const { db, userId } = await learningContext();
  const { data, error } = await db
    .from("job_applications")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");
  if (error || !data?.length)
    return { error: "Application not found or update failed." };
  revalidatePath("/applications");
  return { success: true };
}
