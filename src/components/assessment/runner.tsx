"use client";
import {
  autosaveAssessmentAction,
  startAssessmentAction,
  submitAssessmentAction,
} from "@/app/(app)/assessments/actions";
import type { PublicQuestion } from "@/lib/assessment/schema";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
export function ExamRunner({
  id,
  title,
  state,
  deadline,
  questions,
  savedAnswers,
}: {
  id: string;
  title: string;
  state: string;
  deadline: string | null;
  questions: PublicQuestion[];
  savedAnswers: Record<string, string>;
}) {
  const router = useRouter(),
    [answers, setAnswers] = useState(savedAnswers),
    [status, setStatus] = useState("Saved"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [remaining, setRemaining] = useState(() =>
      deadline
        ? Math.max(
            0,
            Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000),
          )
        : 3600,
    ),
    [submitted, setSubmitted] = useState(state === "submitted");
  const latest = useRef(answers),
    saving = useRef(false),
    auto = useRef(false);
  useEffect(() => {
    latest.current = answers;
  }, [answers]);
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await submitAssessmentAction(id, latest.current);
      if (r.success || r.submitted) setSubmitted(true);
      if (r.error) setError(r.error);
      else router.push(`/assessments/${id}/results`);
    } catch {
      setError(
        "Connection interrupted. Retry submission; saved answers are retained.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!deadline || submitted) return;
    const tick = () => {
      const secs = Math.max(
        0,
        Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000),
      );
      setRemaining(secs);
      if (secs === 0 && !auto.current) {
        auto.current = true;
        void submit();
      }
    };
    const t = setInterval(tick, 1000);
    return () =>
      clearInterval(
        t,
      ); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [deadline, submitted]);
  const expired = remaining === 0;
  useEffect(() => {
    if (state !== "in_progress" || submitted || expired) return;
    const timer = setTimeout(async () => {
      if (saving.current) return;
      saving.current = true;
      setStatus("Saving");
      try {
        const r = await autosaveAssessmentAction(id, latest.current);
        if (r.error) {
          setStatus("Save failed");
          setError(r.error);
        } else {
          setStatus("Saved");
          if (r.status === "submitted") setSubmitted(true);
        }
      } catch {
        setStatus("Save failed");
        setError("Connection lost. Keep this page open and retry saving.");
      } finally {
        saving.current = false;
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [answers, id, state, submitted, expired]);
  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <header className="forge-panel sticky top-0 z-10">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p role="status" className="mt-2">
          {submitted
            ? "Submitted — ready for grading"
            : state === "draft"
              ? "60 minutes · starts when you choose Start"
              : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} remaining · ${status}`}
        </p>
        <p className="text-sm text-text-muted">
          Deadline is enforced on the server. Written/code feedback uses AI
          rubric review; code is not executed.
        </p>
      </header>
      {error && (
        <p className="forge-error" role="alert">
          {error}
        </p>
      )}
      {state === "draft" ? (
        <button
          disabled={busy}
          className="forge-button"
          onClick={async () => {
            setBusy(true);
            try {
              const r = await startAssessmentAction(id);
              if (r.error) setError(r.error);
              else router.refresh();
            } finally {
              setBusy(false);
            }
          }}
        >
          Start 60-minute assessment
        </button>
      ) : (
        <>
          {questions.map((q, i) => (
            <section key={q.id} className="forge-panel space-y-3">
              <p className="text-sm text-primary">
                {q.subject} · {q.topic} · {q.marks} marks · {q.minutes}m
              </p>
              <h2 className="font-semibold whitespace-pre-wrap">
                {i + 1}. {q.question}
              </h2>
              <p className="text-sm text-text-muted">
                Based on {q.sourceIds.length} saved learning source(s)
              </p>
              {q.type === "mcq" ? (
                q.options.map((o) => (
                  <label
                    className="flex gap-3 p-3 border border-border rounded-lg"
                    key={o.label}
                  >
                    <input
                      disabled={submitted || remaining === 0}
                      type="radio"
                      name={q.id}
                      value={o.label}
                      checked={answers[q.id] === o.label}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.id]: e.target.value })
                      }
                    />
                    {o.label}. {o.text}
                  </label>
                ))
              ) : (
                <textarea
                  aria-label={`Answer question ${i + 1}`}
                  disabled={submitted || remaining === 0}
                  rows={q.type === "coding" ? 12 : 6}
                  className={`forge-input ${q.type === "coding" ? "font-mono" : ""}`}
                  maxLength={15000}
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                />
              )}
            </section>
          ))}
          <div className="flex flex-wrap gap-3">
            <button
              className="forge-button-secondary"
              disabled={busy || submitted || remaining === 0}
              onClick={async () => {
                const r = await autosaveAssessmentAction(id, answers);
                setStatus(r.error ? "Save failed" : "Saved");
                if (r.error) setError(r.error);
              }}
            >
              Save answers now
            </button>
            <button className="forge-button" disabled={busy} onClick={submit}>
              {busy
                ? "Evaluating…"
                : submitted
                  ? "Retry grading submitted answers"
                  : "Submit and evaluate"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
