import { isGoogleOnlyAccount } from "@/lib/auth/oauth";
import Link from "next/link";
import { readProfile } from "@/lib/storage/profile";
import { learningContext } from "@/lib/storage/learning";
import { DataControls } from "@/components/settings/data-controls";

export default async function SettingsPage() {
  const profile = await readProfile(); const { demo, db } = await learningContext();
  const { data: { user } } = await db.auth.getUser();
  const googleAccount = Boolean(user && !demo && isGoogleOnlyAccount(user));
  const integrations = [
    { name: "Account and database", configured: !demo, detail: demo ? "Explicit single-user demo mode. No real authentication." : "Supabase is configured. External availability is checked when you use a feature." },
    { name: "YouTube playlist imports", configured: Boolean(process.env.YOUTUBE_API_KEY), detail: "Requires YouTube Data API v3 and a server-side API key. No transcripts are assumed." },
    { name: "AI services", configured: Boolean(process.env.OPENAI_API_KEY), detail: "AI assessments and roadmaps are later milestones. Configured credentials alone do not make those workflows available." },
    { name: "Password recovery links", configured: Boolean(process.env.NEXT_PUBLIC_SITE_URL) && !demo, detail: "Requires Auth redirect URLs and a working email provider in Supabase." },
  ];
  return <div className="space-y-6 pb-12"><header><h1 className="text-3xl font-bold">Settings</h1><p className="mt-1 text-sm text-text-muted">Preparation preferences, integrations and control over your data.</p></header>
    <section className="space-y-3 rounded-xl border border-border bg-surface p-5"><h2 className="text-lg font-semibold">Preparation profile</h2><p className="text-sm">{profile?.full_name ?? "Complete your profile"} · {profile?.target_role ?? "Choose a role"}</p><p className="text-sm text-text-muted">{profile?.daily_study_hours ?? 3} study hours per available day · {profile?.timezone ?? "Asia/Kolkata"}</p><Link href="/onboarding" className="inline-block rounded border border-border px-4 py-2 text-sm">Edit preparation preferences</Link><Link href="/forgot-password" className="ml-3 text-sm text-primary underline">Request password recovery</Link></section>
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5"><h2 className="text-lg font-semibold">Integration configuration</h2><p className="text-xs text-text-muted">Configuration presence is shown here; this is not a live service health check. Secret values are never displayed.</p>{integrations.map((i) => <div key={i.name} className="border-t border-border pt-3"><div className="flex justify-between gap-3"><h3 className="text-sm font-medium">{i.name}</h3><span className={i.configured ? "text-sm text-text-secondary" : "text-sm text-primary"}>{i.configured ? "Configured" : "Setup required"}</span></div><p className="mt-1 text-xs text-text-muted">{i.detail}</p></div>)}</section>
    <DataControls demo={demo} googleAccount={googleAccount} />
  </div>;
}
