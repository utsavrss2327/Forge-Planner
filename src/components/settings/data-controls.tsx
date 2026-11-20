"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearPreparationDataAction, deleteAccountAction } from "@/app/(app)/settings/actions";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DataControls({ demo, googleAccount = false }: { demo: boolean; googleAccount?: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function submit(form: FormData, account: boolean) {
    setBusy(true); setMessage("");
    try {
      const result = await (account ? deleteAccountAction(form) : clearPreparationDataAction(form));
      if (result.error) setMessage(result.error);
      else { router.push(account ? "/login" : "/onboarding"); router.refresh(); }
    } catch { setMessage("This request could not be completed. Refresh and check your account before retrying."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-6 rounded-xl border border-border bg-surface p-5">
    <div><h2 className="text-lg font-semibold">Your data</h2><p className="mt-1 text-sm text-text-muted">Export includes saved preparation records and preferences. API keys, passwords, and authentication tokens are excluded.</p><a href="/api/account/export" className="mt-3 inline-block rounded border border-border px-4 py-2 text-sm">Download my data (JSON)</a></div>
    <form action={(form) => submit(form, false)} className="space-y-3 border-t border-border pt-5">
      <h3 className="font-semibold">{demo ? "Clear demo preparation data" : "Delete preparation data"}</h3>
      <p className="text-sm text-text-muted">Permanently deletes your learning tracks, notes, videos, tasks, sessions, roadmaps and other preparation records. Resets preferences and onboarding. Your login account and email remain. Export first if you need a copy.</p>
      <label className="block text-sm">Type DELETE MY PREPARATION DATA<Input name="confirmation" required autoComplete="off" /></label>
      <Button type="submit" variant="outline" disabled={busy}>Delete preparation data</Button>
    </form>
    {!demo && <form action={(form) => submit(form, true)} className="space-y-3 border-t border-border pt-5">
      <h3 className="font-semibold text-primary">Delete account permanently</h3>
      <p className="text-sm text-text-muted">Deletes your authentication account and all FORGE preparation data. This cannot be undone.</p>
      {googleAccount ? <div className="space-y-2"><p className="text-sm text-text-muted">Verify your Google account, then return here and confirm deletion within five minutes.</p><GoogleSignIn destination="/settings" label="Verify Google account" /></div> : <label className="block text-sm">Current password<Input name="password" type="password" autoComplete="current-password" required /></label>}
      <label className="block text-sm">Type DELETE MY ACCOUNT<Input name="confirmation" required autoComplete="off" /></label>
      <Button type="submit" variant="outline" disabled={busy}>Permanently delete account</Button>
    </form>}
    {message && <p role="alert" className="text-sm text-primary">{message}</p>}
  </section>;
}
