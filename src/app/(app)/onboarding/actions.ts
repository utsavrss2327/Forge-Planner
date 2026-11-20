"use server";

import { revalidatePath } from "next/cache";
import { saveProfile } from "@/lib/storage/store";
import { learningContext } from "@/lib/storage/learning";
import { field, tags, profileSchema } from "@/lib/validation";
import { studyDate } from "@/lib/dates";

export async function saveOnboardingAction(formData: FormData) {
  const parsed = profileSchema.safeParse({
    full_name: field(formData, "fullName"), target_role: field(formData, "targetRole"),
    education_level: field(formData, "educationLevel"), target_date: field(formData, "targetDate") || null,
    target_companies: tags(field(formData, "targetCompanies")), preparation_level: field(formData, "preparationLevel"),
    daily_study_hours: Number(field(formData, "dailyStudyHours")), available_days: tags(field(formData, "availableDays")),
    preparation_subjects: tags(field(formData, "preparationSubjects")), strong_subjects: tags(field(formData, "strongSubjects")),
    weak_subjects: tags(field(formData, "weakSubjects")), completed_topics: tags(field(formData, "completedTopics")),
    study_preference: field(formData, "studyPreference"), timezone: field(formData, "timezone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.target_date && parsed.data.target_date < studyDate(parsed.data.timezone)) return { error: "Choose a target date today or later." };
  const { db, userId, demo } = await learningContext();
  const profile = { ...parsed.data, id: userId, onboarding_completed: true };
  if (demo) saveProfile(profile);
  else {
    const { error } = await db.from("profiles").upsert(profile);
    if (error) return { error: "Could not save preparation preferences. Please retry." };
  }
  revalidatePath("/", "layout");
  return { success: true };
}
