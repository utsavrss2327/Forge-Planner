"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-xl space-y-4 p-8"><h1 className="text-2xl font-semibold">FORGE is temporarily unavailable</h1><p className="text-text-muted">Your account or preparation data could not be loaded. Check the service configuration and try again.</p><button onClick={reset} className="rounded bg-primary px-4 py-2">Retry</button><Link href="/login" className="ml-4 text-primary underline">Return to sign in</Link></main>;
}
