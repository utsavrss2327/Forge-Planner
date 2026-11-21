"use client";
import { timeLabel } from "@/lib/routine/engine";
import {
  saveDailyTaskAction,
  transitionTaskAction,
} from "@/app/(app)/planner/actions";
import type { DailyTask } from "@/types";

import { useState } from "react";
export function SubjectDay({
  subject,
  tasks,
}: {
  subject: string;
  tasks: DailyTask[];
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function complete() {
    setBusy(true);
    setError("");
    try {
      for (const t of tasks.filter((t) => t.status !== "completed")) {
        const r = await transitionTaskAction(t.id, "completed");
        if (r.error) {
          setError(r.error);
          break;
        }
      }
    } catch {
      setError("Could not complete this subject. Retry.");
    } finally {
      setBusy(false);
    }
  }
  async function saveTopics(form: FormData) {
    const t = tasks.find((t) => t.id === form.get("taskId"));
    if (!t) return;
    const payload = new FormData();
    for (const [k, v] of Object.entries({
      taskId: t.id,
      expectedUpdatedAt: t.updated_at,
      title: t.title,
      description: form.get("topics")?.toString() ?? "",
      subject: t.subject ?? "",
      scheduledDate: t.scheduled_date,
      estimatedMinutes: String(t.estimated_minutes),
      priority: t.priority,
      trackId: t.learning_track_id ?? "",
      sourceUrl: t.source_url ?? "",
    }))
      payload.set(k, v);
    setBusy(true);
    setError("");
    try {
      const r = await saveDailyTaskAction(payload);
      if (r.error) setError(r.error);
    } catch {
      setError("Topics could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  const all = tasks.every((t) => t.status === "completed");
  return (
    <section className="forge-panel space-y-3">
      <label className="flex gap-3 items-center text-lg font-semibold">
        <input
          aria-label={`Complete ${subject}`}
          type="checkbox"
          checked={all}
          disabled={busy || all}
          onChange={complete}
        />
        {subject}
        <span className="ml-auto text-sm text-text-muted">
          {tasks.filter((t) => t.status === "completed").length}/{tasks.length}{" "}
          complete
        </span>
      </label>
      {error && (
        <p role="alert" className="forge-error">
          {error}
        </p>
      )}
      {tasks.map((t) => (
        <form
          key={t.id}
          action={saveTopics}
          className="border-t border-border pt-3 space-y-2"
        >
          <input type="hidden" name="taskId" value={t.id} />
          <h3 className="font-medium">
            {t.scheduled_start != null && `${timeLabel(t.scheduled_start)} · `}
            {t.title} · {t.estimated_minutes}m{" "}
            {t.status === "completed" ? "· Completed" : ""}
          </h3>
          <label className="block text-sm">
            Topics I will study
            <textarea
              aria-label={`Topics for ${t.title}`}
              className="forge-input"
              name="topics"
              defaultValue={t.description ?? ""}
              placeholder="Write the specific topics for this subject today"
            />
          </label>
          <button disabled={busy} className="forge-button-secondary">
            Save topics
          </button>
        </form>
      ))}
    </section>
  );
}
