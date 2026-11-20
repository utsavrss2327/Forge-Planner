"use client";
import { useState } from "react";
import { googleSignInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function GoogleSignIn({ destination = "/dashboard", label = "Continue with Google" }: { destination?: string; label?: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function signIn() {
    setBusy(true); setError("");
    try {
      const result = await googleSignInAction(destination);
      if (result.error) { setError(result.error); setBusy(false); }
      else if (result.url) window.location.assign(result.url);
    } catch { setError("Unable to start Google sign-in. Please retry."); setBusy(false); }
  }
  return <div className="space-y-3">
    <Button type="button" variant="outline" onClick={signIn} disabled={busy} className="w-full bg-white text-zinc-900 hover:bg-zinc-100">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.6A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.92v-2.6H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.52l3.35-2.6Z" />
        <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.61 9.61 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.35 2.6A5.99 5.99 0 0 1 12 5.96Z" />
      </svg>
      {busy ? "Connecting to Google…" : label}
    </Button>
    {error && <p role="alert" className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</p>}
  </div>;
}
