"use client";
import { parseRoadmapText } from "@/lib/routine/import-text";
import {
  extractRoadmapAction,
  proposeRoadmapAction,
  saveRoadmapAction,
} from "@/app/(app)/roadmaps/actions";
import { type Topic } from "@/lib/routine/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function RoadmapEditor({ subjects }: { subjects: string[] }) {
  const router = useRouter(),
    [title, setTitle] = useState("My preparation roadmap"),
    [topics, setTopics] = useState<Topic[]>([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const add = () =>
    setTopics([
      ...topics,
      {
        id: crypto.randomUUID(),
        subject: subjects[0] ?? "",
        title: "",
        minutes: 60,
        prerequisites: [],
        resource: "",
        completed: false,
      },
    ]);
  function importText(source: string) {
    try {
      const parsed = parseRoadmapText(source, title, () => crypto.randomUUID());
      setTitle(parsed.title);
      setTopics(parsed.topics);
      setError("");
    } catch {
      setError(
        "Import needs valid roadmap JSON, CSV columns Subject,Topic,Minutes, or lines Subject | Topic | Minutes.",
      );
    }
  }
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const r = await proposeRoadmapAction(text);
      if (r.error) setError(r.error);
      else if (r.proposal) {
        setTitle(r.proposal.title);
        setTopics(r.proposal.topics);
      }
    } catch {
      setError("AI unavailable. You can create topics manually.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const r = await saveRoadmapAction({ title, topics });
      if (r.error) setError(r.error);
      else router.push("/planner/customize");
    } catch {
      setError("Roadmap could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="text-3xl font-bold">Create and review roadmap</h1>
      <p className="text-text-muted">
        Import or generate a proposal, correct subjects and estimates, then
        save. Your routine is activated only after separate approval.
      </p>
      {error && (
        <p role="alert" className="forge-error">
          {error}
        </p>
      )}
      <section className="forge-panel space-y-3">
        <label className="block">
          Roadmap name
          <input
            className="forge-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block">
          Paste a plan or describe your goals
          <textarea
            className="forge-input"
            rows={5}
            value={text}
            maxLength={60000}
            onChange={(e) => setText(e.target.value)}
            placeholder="Computer Networks | TCP reliability | 120"
          />
        </label>
        <label className="block text-sm">
          Extract TXT, Markdown, CSV, JSON, DOCX, XLSX, PDF, JPG or PNG
          <input
            className="forge-input"
            type="file"
            multiple
            accept=".txt,.md,.csv,.json,.docx,.xlsx,.pdf,.jpg,.jpeg,.png"
            disabled={busy}
            onChange={async (e) => {
              const files = e.target.files;
              if (!files?.length) return;
              setBusy(true);
              setError("");
              try {
                const form = new FormData();
                for (const f of files) form.append("files", f);
                const r = await extractRoadmapAction(form);
                if (r.error) setError(r.error);
                else if (r.text) {
                  setText(r.text);
                  if (r.warnings?.length) setError(r.warnings.join(" "));
                }
              } catch {
                setError("Extraction failed. Existing topics are unchanged.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        <p className="text-sm text-text-muted">
          Up to 3 files, 1.5 MB each, 2.5 MB combined. Office/text extraction
          runs on the server. PDF and image transcription uses Gemini and needs
          a key. Review extracted text below, then parse structured lines or
          request an AI proposal. Audio/video imports are not enabled. Files and
          formulas are never executed.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="forge-button-secondary"
            onClick={() => importText(text)}
          >
            Parse structured text
          </button>
          <button
            disabled={busy}
            type="button"
            className="forge-button"
            onClick={generate}
          >
            Propose with AI
          </button>
          <button className="forge-button-secondary" onClick={add}>
            Add topic manually
          </button>
        </div>
        <p className="text-sm text-text-muted">
          AI sends this text and selected preparation subjects to your
          configured provider. Free-tier provider data terms apply.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Review subjects and topics</h2>
        {topics.map((t, i) => (
          <div className="forge-panel grid gap-3 sm:grid-cols-2" key={t.id}>
            <label>
              Subject
              <select
                className="forge-input"
                value={t.subject}
                onChange={(e) =>
                  setTopics(
                    topics.map((x) =>
                      x.id === t.id ? { ...x, subject: e.target.value } : x,
                    ),
                  )
                }
              >
                {[...new Set([...subjects, t.subject])]
                  .filter(Boolean)
                  .map((s) => (
                    <option key={s}>{s}</option>
                  ))}
              </select>
            </label>
            <label>
              Topic
              <input
                className="forge-input"
                value={t.title}
                onChange={(e) =>
                  setTopics(
                    topics.map((x) =>
                      x.id === t.id ? { ...x, title: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              Estimated minutes
              <input
                type="number"
                min={15}
                max={2400}
                className="forge-input"
                value={t.minutes}
                onChange={(e) =>
                  setTopics(
                    topics.map((x) =>
                      x.id === t.id
                        ? { ...x, minutes: Number(e.target.value) }
                        : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              Resource URL (optional)
              <input
                className="forge-input"
                type="url"
                value={t.resource}
                onChange={(e) =>
                  setTopics(
                    topics.map((x) =>
                      x.id === t.id ? { ...x, resource: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              Source reference
              <input
                className="forge-input"
                value={t.sourceReference ?? "Manual review"}
                onChange={(e) =>
                  setTopics(
                    topics.map((x) =>
                      x.id === t.id
                        ? { ...x, sourceReference: e.target.value }
                        : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              Prerequisites
              <select
                multiple
                className="forge-input"
                value={t.prerequisites}
                onChange={(e) =>
                  setTopics(
                    topics.map((x) =>
                      x.id === t.id
                        ? {
                            ...x,
                            prerequisites: Array.from(
                              e.target.selectedOptions,
                              (o) => o.value,
                            ),
                          }
                        : x,
                    ),
                  )
                }
              >
                {topics
                  .filter((x) => x.id !== t.id)
                  .map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.subject}: {x.title}
                    </option>
                  ))}
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <label>
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={(e) =>
                    setTopics(
                      topics.map((x) =>
                        x.id === t.id
                          ? { ...x, completed: e.target.checked }
                          : x,
                      ),
                    )
                  }
                />{" "}
                Already completed
              </label>
              <button
                className="forge-button-secondary"
                disabled={i === 0}
                onClick={() => {
                  const v = [...topics];
                  [v[i - 1], v[i]] = [v[i], v[i - 1]];
                  setTopics(v);
                }}
              >
                Move earlier
              </button>
              <button
                className="forge-button-secondary"
                onClick={() =>
                  setTopics(
                    topics
                      .filter((x) => x.id !== t.id)
                      .map((x) => ({
                        ...x,
                        prerequisites: x.prerequisites.filter(
                          (p) => p !== t.id,
                        ),
                      })),
                  )
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </section>
      <button
        className="forge-button"
        disabled={busy || !topics.length}
        onClick={save}
      >
        {busy ? "Working…" : "Save reviewed roadmap and customize routine"}
      </button>
    </div>
  );
}
