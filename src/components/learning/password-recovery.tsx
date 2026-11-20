"use client";
import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, resetPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await (reset ? resetPasswordAction(form) : requestPasswordResetAction(form));
      if (result.error) setError(result.error); else setSuccess(true);
    } catch { setError("Unable to complete this request. Please retry."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">{reset ? "Choose a new password" : "Recover your account"}</h1>
    {success ? <p role="status">{reset ? "Password updated. You can now sign in." : "If an account exists for that address, check your email for a recovery link."}</p> :
      <form onSubmit={submit} className="space-y-4">
        {error && <p role="alert" className="text-primary">{error}</p>}
        {reset ? <>
          <label className="block text-sm">New password<Input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="mt-2" /></label>
          <label className="block text-sm">Confirm password<Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="mt-2" /></label>
        </> : <label className="block text-sm">Email address<Input name="email" type="email" autoComplete="email" required className="mt-2" /></label>}
        <Button type="submit" disabled={busy}>{busy ? "Submitting…" : reset ? "Update password" : "Send recovery link"}</Button>
      </form>}
    <Link href="/login" className="block text-sm text-primary">Back to sign in</Link>
  </div>;
}
