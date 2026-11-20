import "server-only";
import { learningContext } from "./learning";
import { getProfile } from "./store";
import type { Profile } from "@/types";

export async function readProfile(): Promise<Profile | null> {
  const { db, userId, demo } = await learningContext();
  if (demo) return getProfile(userId);
  const { data, error } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error("Your preparation profile could not be loaded. Please retry.");
  return data as Profile | null;
}
