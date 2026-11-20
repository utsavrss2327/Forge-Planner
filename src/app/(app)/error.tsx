"use client";
import Link from "next/link";
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-surface p-6"><h1 className="text-xl font-semibold">This workspace could not be loaded</h1><p className="text-sm text-text-muted">Check your connection and database setup, then retry. Unsaved forms may need to be entered again.</p><button onClick={reset} className="rounded bg-primary px-4 py-2 text-sm">Try again</button><Link href="/settings" className="ml-4 text-sm text-primary underline">Open settings</Link></section>;
}
