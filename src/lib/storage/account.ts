import "server-only";
import { getStore, saveStore } from "./store";

export function exportDemoData(userId: string) {
  const store = getStore();
  return { ...store, profiles: Object.fromEntries(Object.entries(store.profiles).filter(([id]) => id === userId)) };
}

export function clearDemoData(userId: string) {
  const store = getStore();
  for (const key of Object.keys(store) as (keyof typeof store)[]) {
    if (key !== "profiles") Object.assign(store, { [key]: [] });
  }
  const profile = store.profiles[userId];
  if (profile) Object.assign(profile, { full_name: null, avatar_url: null, target_role: "SDE-1", education_level: null, target_date: null,
    target_companies: [], preparation_level: "beginner", daily_study_hours: 3, available_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    strong_subjects: [], weak_subjects: [], completed_topics: [], study_preference: "structured", preparation_subjects: [], onboarding_completed: false,
    timezone: "Asia/Kolkata", updated_at: new Date().toISOString() });
  saveStore(store);
}
