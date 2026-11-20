"use server";
import { revalidatePath } from "next/cache";
import { learningContext } from "@/lib/storage/learning";
import { clearDemoData } from "@/lib/storage/account";
import { isGoogleOnlyAccount, hasRecentGoogleAuthentication } from "@/lib/auth/oauth";
import { field } from "@/lib/validation";

export async function clearPreparationDataAction(form: FormData) {
  if (field(form, "confirmation") !== "DELETE MY PREPARATION DATA") return { error: "Type DELETE MY PREPARATION DATA to confirm." };
  const { db, userId, demo } = await learningContext();
  if (demo) clearDemoData(userId);
  else {
    const { error } = await db.rpc("clear_preparation_data");
    if (error) return { error: "Your data could not be deleted. Nothing was reported as deleted; please retry." };
  }
  revalidatePath("/", "layout"); return { success: true };
}

export async function deleteAccountAction(form: FormData) {
  if (field(form, "confirmation") !== "DELETE MY ACCOUNT") return { error: "Type DELETE MY ACCOUNT to confirm." };
  const { db, demo } = await learningContext();
  if (demo) return { error: "There is no real account in demo mode. Clear demo preparation data instead." };
  const { data: { user } } = await db.auth.getUser();
  if (!user?.email) return { error: "Sign in again before deleting your account." };
  if (isGoogleOnlyAccount(user)) {
    const { data, error } = await db.auth.getClaims();
    if (error || !hasRecentGoogleAuthentication(data?.claims, user.id)) return { error: "Verify your Google account again, then confirm deletion within five minutes." };
  } else {
    if (!field(form, "password")) return { error: "Enter your account password to delete your account." };
    const { error: authError } = await db.auth.signInWithPassword({ email: user.email, password: field(form, "password") });
    if (authError) return { error: "Your password could not be verified. The account was not deleted." };
  }
  const { error } = await db.rpc("delete_forge_account");
  if (error) return { error: "Account deletion failed. Your account may own external storage objects; contact the project administrator if retrying fails." };
  await db.auth.signOut();
  revalidatePath("/", "layout"); return { success: true };
}
