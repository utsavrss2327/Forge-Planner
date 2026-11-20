"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { transitionTaskAction } from "@/app/(app)/planner/actions";
import { Button } from "@/components/ui/button";
import type { StudySession } from "@/types";

export function ActiveSession({ session, title, serverNow }: { session: StudySession; title: string; serverNow: string }) {
  const router = useRouter(); const [now, setNow] = useState(Date.parse(serverNow)), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const elapsed = Math.max(0, Math.floor((now - Date.parse(session.started_at)) / 1000));
  async function pause() {
    if (!session.task_id) return;
    setBusy(true); setError("");
    try { const result = await transitionTaskAction(session.task_id, "pending"); if (result.error) setError(result.error); else router.refresh(); }
    catch { setError("Could not pause the session. Please retry."); } finally { setBusy(false); }
  }
  return <section className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-primary">Study session running</p><h2 className="font-semibold">{title}</h2></div><p className="font-mono text-2xl" aria-label="Elapsed time">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</p><Button onClick={pause} disabled={busy}>Pause session</Button></div>
    <p className="text-xs text-text-muted">The timer continues if you close or refresh this page. Pause when you stop studying. Recorded duration is calculated on the server when paused or completed. <Link className="text-primary underline" href="/planner">Open planner</Link></p>
    {error && <p role="alert" className="text-sm text-primary">{error}</p>}
  </section>;
}
