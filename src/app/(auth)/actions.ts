"use server";

import { z } from "zod";
import { isGoogleProviderEnabled } from "@/lib/auth/google-provider";
import { siteOrigin } from "@/lib/auth/oauth";
import { field } from "@/lib/validation";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/middleware";

export async function loginAction(formData: FormData) {
  const email = field(formData, "email").trim();
  const password = field(formData, "password");

  if (!z.email().safeParse(email).success || !password || password.length > 128) {
    return { error: "Email and password are required." };
  }

  if (!isSupabaseConfigured()) {
    if (process.env.FORGE_DEMO_MODE !== "true") return { error: "Authentication requires Supabase configuration. Local demonstrations require FORGE_DEMO_MODE=true." };
    // Demo mode: set cookie and redirect
    const cookieStore = await cookies();
    cookieStore.set(
      "forge_demo_user",
      JSON.stringify({
        id: "00000000-0000-0000-0000-000000000001",
        email,
        fullName: email.split("@")[0],
      }),
      { path: "/", maxAge: 60 * 60 * 24 * 7, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" }
    );
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const fullName = field(formData, "fullName").trim();
  const email = field(formData, "email").trim();
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirmPassword");

  if (!fullName || !email || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!z.email().safeParse(email).success || fullName.length > 100) return { error: "Enter a valid name and email address." };
  if (password.length < 8 || password.length > 128) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!isSupabaseConfigured()) {
    if (process.env.FORGE_DEMO_MODE !== "true") return { error: "Authentication requires Supabase configuration. Local demonstrations require FORGE_DEMO_MODE=true." };
    // Demo mode: auto-login and direct to onboarding
    const cookieStore = await cookies();
    cookieStore.set(
      "forge_demo_user",
      JSON.stringify({
        id: "00000000-0000-0000-0000-000000000001",
        email,
        fullName,
      }),
      { path: "/", maxAge: 60 * 60 * 24 * 7, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" }
    );
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) redirect("/onboarding");
  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("forge_demo_user");

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Sign out failed. Please retry before leaving this device.");
  }

  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = field(formData, "email").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!isSupabaseConfigured()) return { error: "Password recovery requires Supabase. Demo accounts have no passwords to recover." };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!siteUrl) return { error: "Set NEXT_PUBLIC_SITE_URL to configure recovery links." };
  let recoveryUrl: string;
  try {
    const url = new URL(siteUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    recoveryUrl = new URL("/auth/callback?next=/reset-password", url.origin).toString();
  } catch { return { error: "Account recovery URL is not configured correctly." }; }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: recoveryUrl,
  });
  if (error) return { error: "Recovery is unavailable right now. Please try again later." };
  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  const password = field(formData, "password");
  if (password.length < 8 || password.length > 128) return { error: "Use a password between 8 and 128 characters." };
  if (password !== formData.get("confirmPassword")) return { error: "Passwords do not match." };
  if (!isSupabaseConfigured()) return { error: "Password recovery requires Supabase." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Open a valid password recovery link first." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Could not update your password. Request a new recovery link and retry." };
  return { success: true };
}

export async function googleSignInAction(destination = "/dashboard") {
  if (!isSupabaseConfigured()) return { error: "Google sign-in requires Supabase configuration and an enabled Google provider. Demo mode cannot sign in with Google." };
  if (!["/dashboard", "/settings"].includes(destination)) return { error: "Invalid sign-in destination." };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  const origin = siteOrigin(siteUrl);
  if (!origin) return { error: "Set NEXT_PUBLIC_SITE_URL to your app URL, such as http://localhost:3000, before using Google sign-in." };
  try {
    if (!await isGoogleProviderEnabled()) return { error: "Google sign-in is not enabled for this Supabase project yet. Add your Google OAuth client ID and secret in Supabase, then enable the Google provider." };
    const supabase = await createClient();
    const callback = new URL("/auth/callback", origin); callback.searchParams.set("next", destination);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString(), skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
    });
    if (error || !data.url) return { error: "Google sign-in is unavailable. Enable the Google provider in Supabase and check its client credentials and redirect URLs." };
    // Redirect only to the Auth endpoint of the configured project.
    const authorize = new URL(data.url), project = new URL((process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!);
    if (authorize.origin !== project.origin || authorize.pathname !== "/auth/v1/authorize" || authorize.searchParams.get("provider") !== "google") {
      return { error: "The authentication service returned an unexpected sign-in URL. Check your Supabase configuration." };
    }
    return { url: authorize.toString() };
  } catch { return { error: "Google sign-in could not start. Check your connection and Supabase configuration, then retry." }; }
}
