"use client";
import {
  generateDailyAssessmentAction,
  previewAssessmentContextAction,
} from "@/app/(app)/assessments/actions";
import type { LearningSource } from "@/lib/assessment/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function AssessmentBuilder({ today }: { today: string }) {
  const router = useRouter(),
    [from, setFrom] = useState(today),
    [to, setTo] = useState(today),
    [sources, setSources] = useState<LearningSource[] | null>(null),
    [warnings, setWarnings] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function preview() {
    setBusy(true);
    setError("");
    try {
      const r = await previewAssessmentContextAction(from, to);
      if ("error" in r) {
        setError(r.error);
        setSources(null);
      } else {
        setSources(r.sources);
        setWarnings(r.warnings);
      }
    } catch {
      setError("Learning context unavailable.");
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const r = await generateDailyAssessmentAction(from, to);
      if (r.error) setError(r.error);
      else if (r.id) router.push(`/assessments/${r.id}`);
    } catch {
      setError("Generation unavailable. No sample test was substituted.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5 max-w-4xl">
      <h1 className="text-3xl font-bold">Build your active recall test</h1>
      <p className="text-text-muted">
        Combine saved video topics and notes, linked journals, completed daily
        tasks, DSA approaches and due revision. Every represented subject must
        appear in the generated test.
      </p>
      <div className="forge-panel space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            Learning from
            <input
              className="forge-input"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setSources(null);
              }}
            />
          </label>
          <label>
            Learning through
            <input
              className="forge-input"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setSources(null);
              }}
            />
          </label>
        </div>
        <button
          className="forge-button-secondary"
          disabled={busy}
          onClick={preview}
        >
          Review learning sources
        </button>
      </div>
      {error && (
        <p role="alert" className="forge-error">
          {error}
        </p>
      )}
      {warnings.map((w, i) => (
        <p key={i} className="text-sm text-text-muted">
          {w}
        </p>
      ))}
      {sources && (
        <section className="forge-panel space-y-3">
          <h2 className="text-xl font-semibold">
            {sources.length} sources ·{" "}
            {new Set(sources.map((s) => s.subject)).size} subjects
          </h2>
          {!sources.length && (
            <p>
              Add topic tags or notes to studied videos, record a DSA approach,
              or complete a daily task. Video numbers alone cannot generate a
              grounded assessment.
            </p>
          )}
          {sources.map((s) => (
            <details key={s.id} className="border-t border-border pt-2">
              <summary>
                {s.subject} · {s.title}
              </summary>
              <p className="text-sm whitespace-pre-wrap">
                {s.topics.join(", ")}
                {"\n"}
                {s.notes}
              </p>
            </details>
          ))}
          <p className="text-sm text-text-muted">
            Generating and grading sends this learning content and your answers
            to the configured AI provider. Gemini free-tier content may be used
            for product improvement. Quotas apply; FORGE does not switch to a
            paid provider automatically.
          </p>
          <button
            className="forge-button"
            disabled={busy || !sources.length}
            onClick={generate}
          >
            {busy ? "Working…" : "Generate 60-minute test"}
          </button>
        </section>
      )}
    </div>
  );
}
