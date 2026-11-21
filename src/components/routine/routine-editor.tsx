"use client";
import {
  approveRoutineAction,
  optimizeRoutineAction,
  saveRoutineAction,
  unlockSessionAction,
} from "@/app/(app)/planner/customize/actions";
import { shiftDate } from "@/lib/dates";
import {
  generateRoutine,
  routineFingerprint,
  timeLabel,
  validateRoutine,
} from "@/lib/routine/engine";
import {
  type Routine,
  type RoutineRow,
  type Session,
  dayNames,
} from "@/lib/routine/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
type Version = {
  version: number;
  summary: string;
  created_at: string;
  snapshot: Routine;
};
export function RoutineEditor({
  initial,
  row,
  userId,
  versions,
  priorityHints = [],
  deadline,
}: {
  initial: Routine;
  row: RoutineRow | null;
  userId: string;
  versions: Version[];
  priorityHints?: string[];
  deadline?: string | null;
}) {
  const router = useRouter(),
    [draft, setDraft] = useState(initial),
    [saved, setSaved] = useState(row),
    [past, setPast] = useState<Routine[]>([]),
    [future, setFuture] = useState<Routine[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [status, setStatus] = useState("Saved"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [view, setView] = useState("week"),
    [panel, setPanel] = useState("calendar"),
    [day, setDay] = useState(initial.week),
    [proposal, setProposal] = useState<Routine | null>(null),
    [instruction, setInstruction] = useState(""),
    [recovery, setRecovery] = useState<Routine | null>(null);
  const saving = useRef(false),
    savedRef = useRef(row),
    draftRef = useRef(draft),
    lastSaved = useRef(routineFingerprint(initial)),
    key = `forge-routine:${userId}:${initial.week}`,
    ready = useRef(false);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  const issues = validateRoutine(draft),
    active = draft.sessions.find((s) => s.id === selected);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const cached = JSON.parse(raw);
        if (
          cached.version === (row?.version ?? 0) &&
          routineFingerprint(cached.draft) !== routineFingerprint(initial)
        )
          queueMicrotask(() => setRecovery(cached.draft));
      }
    } catch {}
    ready.current = true;
  }, [key, initial, row]);
  async function persist(
    value: Routine,
    availabilityEdit = false,
  ): Promise<RoutineRow | null> {
    if (saving.current) return null;
    saving.current = true;
    setStatus("Saving");
    try {
      const result = await saveRoutineAction(
        savedRef.current?.id ?? null,
        savedRef.current?.version ?? 0,
        value,
        availabilityEdit,
      );
      if (result.error) {
        setError(result.error);
        setStatus("Save failed");
        return null;
      }
      if (result.row) {
        savedRef.current = result.row;
        setSaved(result.row);
        lastSaved.current = routineFingerprint(value);
        setStatus("Saved");
        localStorage.setItem(
          key,
          JSON.stringify({ version: result.row.version, draft: value }),
        );
        return result.row;
      }
      return null;
    } catch {
      setStatus("Save failed");
      setError("Network error. Your local draft is retained.");
      return null;
    } finally {
      saving.current = false;
    }
  }
  useEffect(() => {
    if (!ready.current || routineFingerprint(draft) === lastSaved.current)
      return;
    queueMicrotask(() => setStatus("Unsaved changes"));
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ version: savedRef.current?.version ?? 0, draft }),
      );
    } catch {}
    const timer = setTimeout(() => {
      void persist(draft);
    }, 1200);
    return () => clearTimeout(timer);
    // Persist uses refs to serialize saves and prevent old responses replacing edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);
  // If editing continued during a request, save the latest draft after it completes.
  useEffect(() => {
    if (
      status === "Saved" &&
      routineFingerprint(draftRef.current) !== lastSaved.current
    ) {
      const t = setTimeout(() => void persist(draftRef.current), 100);
      return () => clearTimeout(t);
    }
    // Ref-backed persistence is intentionally stable across draft updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  function change(next: Routine) {
    setPast((p) => [...p.slice(-29), draft]);
    setFuture([]);
    setDraft(next);
    setError("");
  }
  function editSession(patch: Partial<Session>) {
    if (!active) return;
    if (active.locked) {
      setError("Explicitly unlock this session before editing.");
      return;
    }
    change({
      ...draft,
      sessions: draft.sessions.map((s) =>
        s.id === active.id ? { ...s, ...patch } : s,
      ),
    });
  }
  function add(
    topicId: string | null,
    date = day,
    start = 540,
    kind: Session["kind"] = "learning",
  ) {
    const topic = draft.topics.find((t) => t.id === topicId);
    const subject =
      topic?.subject ?? draft.rules[0]?.subject ?? "Fixed commitment";
    const s: Session = {
      id: crypto.randomUUID(),
      date,
      start,
      minutes: 45,
      topicId,
      subject,
      title:
        topic?.title ??
        (kind === "commitment" ? "Fixed commitment" : "Study session"),
      kind,
      locked: kind === "commitment",
      resource: topic?.resource ?? "",
      notes: "",
    };
    change({ ...draft, sessions: [...draft.sessions, s] });
    setSelected(s.id);
    setPanel("inspector");
  }
  function drop(event: React.DragEvent, date: string, start: number) {
    event.preventDefault();
    const token = event.dataTransfer.getData("text/plain");
    const [type, id] = token.split(":");
    if (type === "topic") {
      const topic = draft.topics.find((t) => t.id === id);
      if (!topic) return;
      const s: Session = {
        id: crypto.randomUUID(),
        date,
        start,
        minutes: 45,
        topicId: id,
        subject: topic.subject,
        title: topic.title,
        kind: "learning",
        locked: false,
        notes: "",
        resource: topic.resource,
      };
      const next = { ...draft, sessions: [...draft.sessions, s] };
      if (
        validateRoutine(next).some(
          (i) => i.severity === "error" && i.rule !== "coverage",
        )
      ) {
        setError(
          "That slot conflicts with availability, capacity or another session. Choose another time.",
        );
        return;
      }
      change(next);
      setSelected(s.id);
      setPanel("inspector");
    } else {
      const s = draft.sessions.find((s) => s.id === id);
      if (!s || s.locked) return;
      const next = {
        ...draft,
        sessions: draft.sessions.map((s) =>
          s.id === id ? { ...s, date, start } : s,
        ),
      };
      if (
        validateRoutine(next).some(
          (i) => i.severity === "error" && i.rule !== "coverage",
        )
      ) {
        setError("Move rejected: choose a free slot within availability.");
        return;
      }
      change(next);
    }
  }
  async function approve() {
    setBusy(true);
    setError("");
    try {
      const current =
        routineFingerprint(draft) !== lastSaved.current || !savedRef.current
          ? await persist(draft)
          : savedRef.current;
      if (!current) {
        setError("Wait for saving to finish, then retry.");
        return;
      }
      const r = await approveRoutineAction(current.id, current.version);
      if (r.error) setError(r.error);
      else router.push(`/planner?date=${draft.week}`);
    } catch {
      setError("Approval failed. Your active planner has not been replaced.");
    } finally {
      setBusy(false);
    }
  }
  async function unlock() {
    if (!active) return;
    setBusy(true);
    try {
      const current =
        routineFingerprint(draft) !== lastSaved.current || !savedRef.current
          ? await persist(draft)
          : savedRef.current;
      if (!current) return;
      const r = await unlockSessionAction(
        current.id,
        current.version,
        active.id,
      );
      if (r.error) setError(r.error);
      else if (r.row) {
        setPast([]);
        setFuture([]);
        savedRef.current = r.row;
        setSaved(r.row);
        lastSaved.current = routineFingerprint(r.row.draft);
        setDraft(r.row.draft);
        setStatus("Saved");
      }
    } finally {
      setBusy(false);
    }
  }
  async function optimize() {
    setBusy(true);
    try {
      const r = await optimizeRoutineAction(draft, instruction);
      if (r.error) setError(r.error);
      else if (r.proposal) setProposal(r.proposal);
    } catch {
      setError("AI proposal unavailable. Your routine is unchanged.");
    } finally {
      setBusy(false);
    }
  }
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(draft.week, i));
  return (
    <div className="space-y-5 pb-12">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Your week, your control
          </h1>
          <p className="text-text-muted mt-1">
            Generate a draft, customize, validate, then approve. Active tasks
            stay safe while you edit.
          </p>
        </div>
        <Link className="forge-button-secondary" href="/roadmaps/new">
          Add roadmap topics
        </Link>
      </header>
      {priorityHints.length > 0 && (
        <p className="forge-panel text-sm">
          Assessment or missed-task evidence suggests more attention to{" "}
          {priorityHints.join(", ")}. New drafts consider this evidence while
          preserving saved session targets; active routines change only after
          approval.
        </p>
      )}
      {deadline && shiftDate(draft.week, 6) > deadline && (
        <p className="forge-error">
          This week extends beyond your preparation target of {deadline}. Review
          the deadline and available time before approving.
        </p>
      )}
      <div className="flex flex-wrap gap-3 items-end">
        <form>
          <label>
            Week starting
            <input
              name="week"
              className="forge-input"
              type="date"
              defaultValue={draft.week}
            />
          </label>
          <button className="forge-button-secondary mt-2">Open week</button>
        </form>
        <p role="status" className="text-sm">
          {status} · v{saved?.version ?? 0}{" "}
          {saved?.approved && "· approved version retained"}
        </p>
        <button
          className="forge-button-secondary"
          disabled={!past.length || busy}
          onClick={() => {
            const prev = past.at(-1)!;
            if (validateRoutine(prev, draft).some((i) => i.rule === "locked")) {
              setError("Unlock sessions before undoing their changes.");
              return;
            }
            setPast(past.slice(0, -1));
            setFuture([draft, ...future]);
            setDraft(prev);
          }}
        >
          Undo
        </button>
        <button
          className="forge-button-secondary"
          disabled={!future.length || busy}
          onClick={() => {
            setPast([...past, draft]);
            setDraft(future[0]);
            setFuture(future.slice(1));
          }}
        >
          Redo
        </button>
        <button
          className="forge-button-secondary"
          disabled={busy}
          onClick={() =>
            setProposal(generateRoutine(draft, () => crypto.randomUUID()))
          }
        >
          Propose balanced week
        </button>
        <button
          className="forge-button-secondary"
          disabled={busy || status === "Saving"}
          onClick={() => void persist(draft)}
        >
          Save draft
        </button>
      </div>
      {error && (
        <p role="alert" className="forge-error">
          {error}
        </p>
      )}
      {recovery && (
        <div className="forge-panel">
          <p>A newer local draft was found for this saved version.</p>
          <button
            className="forge-button"
            onClick={() => {
              change(recovery);
              setRecovery(null);
            }}
          >
            Recover draft
          </button>
          <button
            className="forge-button-secondary"
            onClick={() => {
              setRecovery(null);
              localStorage.removeItem(key);
            }}
          >
            Discard local copy
          </button>
        </div>
      )}
      <details className="forge-panel">
        <summary className="cursor-pointer font-semibold">
          Availability, rest days and subject targets
        </summary>
        <p className="my-3 text-sm text-text-muted">
          Set a study window and capacity for each day. Zero capacity makes a
          rest day. Fixed commitments are managed here.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {draft.windows.map((w) => (
            <div
              key={w.day}
              className="space-y-2 border border-border rounded-lg p-3"
            >
              <h3 className="capitalize">{dayNames[w.day]}</h3>
              {(["start", "end", "capacity"] as const).map((field) => (
                <label className="block text-sm" key={field}>
                  {field === "capacity"
                    ? "Study minutes"
                    : field === "start"
                      ? "Window starts"
                      : "Window ends"}
                  <input
                    className="forge-input"
                    type={field === "capacity" ? "number" : "time"}
                    value={
                      field === "capacity" ? w.capacity : timeLabel(w[field])
                    }
                    onChange={(e) => {
                      const value =
                        field === "capacity"
                          ? Number(e.target.value)
                          : e.target.value
                              .split(":")
                              .reduce(
                                (n, v, i) => n + Number(v) * (i === 0 ? 60 : 1),
                                0,
                              );
                      change({
                        ...draft,
                        windows: draft.windows.map((x) =>
                          x.day === w.day ? { ...x, [field]: value } : x,
                        ),
                      });
                    }}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
        <label className="block my-4">
          Maximum subjects per day
          <input
            className="forge-input max-w-32"
            type="number"
            min={1}
            max={12}
            value={draft.maxSubjects}
            onChange={(e) =>
              change({ ...draft, maxSubjects: Number(e.target.value) })
            }
          />
        </label>
        <button
          className="forge-button-secondary"
          onClick={() => add(null, day, 540, "commitment")}
        >
          Add fixed commitment on selected day
        </button>
        {draft.sessions
          .filter((s) => s.kind === "commitment")
          .map((s) => (
            <div key={s.id} className="grid gap-2 sm:grid-cols-5 my-3">
              <input
                aria-label="Commitment title"
                className="forge-input"
                value={s.title}
                onChange={(e) =>
                  change({
                    ...draft,
                    sessions: draft.sessions.map((x) =>
                      x.id === s.id ? { ...x, title: e.target.value } : x,
                    ),
                  })
                }
              />
              <input
                aria-label="Commitment date"
                className="forge-input"
                type="date"
                value={s.date}
                onChange={(e) =>
                  change({
                    ...draft,
                    sessions: draft.sessions.map((x) =>
                      x.id === s.id ? { ...x, date: e.target.value } : x,
                    ),
                  })
                }
              />
              <input
                aria-label="Commitment starts"
                type="time"
                className="forge-input"
                value={timeLabel(s.start)}
                onChange={(e) =>
                  change({
                    ...draft,
                    sessions: draft.sessions.map((x) =>
                      x.id === s.id
                        ? {
                            ...x,
                            start:
                              Number(e.target.value.slice(0, 2)) * 60 +
                              Number(e.target.value.slice(3)),
                          }
                        : x,
                    ),
                  })
                }
              />
              <input
                aria-label="Commitment minutes"
                type="number"
                className="forge-input"
                value={s.minutes}
                onChange={(e) =>
                  change({
                    ...draft,
                    sessions: draft.sessions.map((x) =>
                      x.id === s.id
                        ? { ...x, minutes: Number(e.target.value) }
                        : x,
                    ),
                  })
                }
              />
              <button
                className="forge-button-secondary"
                onClick={() =>
                  change({
                    ...draft,
                    sessions: draft.sessions.filter((x) => x.id !== s.id),
                  })
                }
              >
                Remove commitment
              </button>
            </div>
          ))}
        <p className="text-sm text-text-muted">
          Save availability changes explicitly here. This is the only control
          that can change a fixed commitment.
        </p>
        <button
          className="forge-button-secondary mt-3"
          disabled={busy || status === "Saving"}
          onClick={() => void persist(draft, true)}
        >
          Save availability and commitments
        </button>
      </details>
      <div
        className="flex flex-wrap gap-2 xl:hidden"
        aria-label="Routine workspace panels"
      >
        {[
          ["library", "Subjects"],
          ["calendar", "Calendar"],
          ["inspector", "Session"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={panel === value}
            className={
              panel === value ? "forge-button" : "forge-button-secondary"
            }
            onClick={() => setPanel(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_260px]">
        <aside
          className={`forge-panel space-y-3 xl:max-h-[75dvh] xl:overflow-y-auto ${panel === "library" ? "" : "hidden"} xl:block`}
        >
          <h2 className="text-lg font-semibold">Subject library</h2>
          <input
            aria-label="Search subjects"
            className="forge-input"
            placeholder="Search subjects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {draft.rules
            .filter((r) =>
              r.subject.toLowerCase().includes(query.toLowerCase()),
            )
            .map((rule) => {
              const planned = draft.sessions.filter(
                (s) => s.subject === rule.subject && s.kind !== "commitment",
              );
              return (
                <div
                  className="border-t border-border pt-3 space-y-2"
                  key={rule.subject}
                >
                  <h3 className="font-semibold">{rule.subject}</h3>
                  <p className="text-sm text-text-muted">
                    {planned.length}/{rule.sessions} sessions ·{" "}
                    {planned.reduce((n, s) => n + s.minutes, 0)} minutes
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["sessions", "minutes", "priority"] as const).map(
                      (field) => (
                        <label className="text-sm" key={field}>
                          {field}
                          <input
                            className="forge-input"
                            type="number"
                            value={rule[field]}
                            onChange={(e) =>
                              change({
                                ...draft,
                                rules: draft.rules.map((r) =>
                                  r.subject === rule.subject
                                    ? { ...r, [field]: Number(e.target.value) }
                                    : r,
                                ),
                              })
                            }
                          />
                        </label>
                      ),
                    )}
                  </div>
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      checked={rule.mandatory}
                      onChange={(e) =>
                        change({
                          ...draft,
                          rules: draft.rules.map((r) =>
                            r.subject === rule.subject
                              ? { ...r, mandatory: e.target.checked }
                              : r,
                          ),
                        })
                      }
                    />{" "}
                    Required weekly target
                  </label>
                  {draft.topics
                    .filter((t) => t.subject === rule.subject && !t.completed)
                    .map((t) => (
                      <button
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", `topic:${t.id}`)
                        }
                        className="w-full text-left rounded border border-border p-2 text-sm hover:border-primary"
                        key={t.id}
                        onClick={() => add(t.id)}
                        title="Drag to a time slot or click to schedule"
                      >
                        {t.title}
                        <span className="block text-text-muted">
                          {t.minutes}m objective · Add session
                        </span>
                      </button>
                    ))}
                </div>
              );
            })}
          {!draft.topics.length && (
            <p className="text-sm text-text-muted">
              Create a roadmap to schedule real topics.
            </p>
          )}
        </aside>
        <section
          className={`forge-panel space-y-3 ${panel === "calendar" ? "" : "hidden"} xl:block`}
        >
          <div className="flex flex-wrap gap-2 items-center">
            <h2 className="text-lg font-semibold mr-auto">Weekly calendar</h2>
            <select
              aria-label="Calendar view"
              className="forge-input w-auto"
              value={view}
              onChange={(e) => setView(e.target.value)}
            >
              <option value="week">Week</option>
              <option value="day">Day</option>
              <option value="agenda">Agenda</option>
            </select>
            <input
              aria-label="Selected day"
              className="forge-input w-auto"
              type="date"
              min={draft.week}
              max={shiftDate(draft.week, 6)}
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>
          <p className="text-sm text-text-muted">
            Drag to a time slot on desktop. Select a session to move or resize
            it with accessible controls on any screen.
          </p>
          <div
            className={`grid gap-3 ${view === "week" ? "md:grid-cols-2 2xl:grid-cols-3" : ""}`}
          >
            {days
              .filter((d) => view !== "day" || d === day)
              .map((date) => {
                const w = draft.windows.find(
                    (w) => w.day === new Date(date + "T12:00:00Z").getUTCDay(),
                  )!,
                  sessions = draft.sessions
                    .filter((s) => s.date === date)
                    .sort((a, b) => a.start - b.start);
                return (
                  <div
                    key={date}
                    className="rounded-lg border border-border p-3 min-w-0"
                  >
                    <h3 className="font-semibold">
                      {new Date(date + "T12:00:00Z").toLocaleDateString("en", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {sessions
                        .filter((s) => s.kind !== "commitment")
                        .reduce((n, s) => n + s.minutes, 0)}
                      /{w.capacity}m ·{" "}
                      {w.capacity === 0
                        ? "Rest"
                        : `${timeLabel(w.start)}–${timeLabel(w.end)}`}
                    </p>
                    {sessions.map((s) => (
                      <button
                        draggable={!s.locked}
                        onDragStart={(e) =>
                          e.dataTransfer.setData(
                            "text/plain",
                            `session:${s.id}`,
                          )
                        }
                        onClick={() => {
                          setSelected(s.id);
                          setPanel("inspector");
                        }}
                        key={s.id}
                        className={`my-2 w-full text-left border rounded-lg p-3 text-sm ${selected === s.id ? "border-primary bg-primary/10" : "border-border bg-elevated"}`}
                      >
                        <span className="block text-primary">
                          {timeLabel(s.start)}–{timeLabel(s.start + s.minutes)}{" "}
                          {s.locked ? "· Locked" : ""}
                        </span>
                        <strong>{s.subject}</strong>
                        <span className="block">{s.title}</span>
                        <span className="text-text-muted">{s.kind}</span>
                      </button>
                    ))}
                    {view !== "agenda" && w.capacity > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer">
                          Available time grid
                        </summary>
                        <div className="max-h-64 overflow-y-auto mt-2">
                          {Array.from(
                            { length: Math.ceil((w.end - w.start) / 30) },
                            (_, i) => w.start + i * 30,
                          ).map((start) => (
                            <div
                              key={start}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => drop(e, date, start)}
                              className="border-t border-border p-2 text-sm hover:bg-primary/10"
                            >
                              {timeLabel(start)} · Drop here
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
        <aside
          className={`forge-panel space-y-3 xl:self-start xl:sticky xl:top-3 ${panel === "inspector" ? "" : "hidden"} xl:block`}
        >
          <h2 className="text-lg font-semibold">Session inspector</h2>
          {!active ? (
            <p className="text-sm text-text-muted">
              Select a session to edit its topic, time, duration, resource or
              lock.
            </p>
          ) : (
            <>
              <p className="text-sm text-primary">
                {active.kind} {active.locked ? "· locked" : ""}
              </p>
              <fieldset disabled={active.locked || busy} className="space-y-3">
                <label className="block">
                  Task title
                  <input
                    className="forge-input"
                    value={active.title}
                    onChange={(e) => editSession({ title: e.target.value })}
                  />
                </label>
                <label className="block">
                  Date
                  <input
                    className="forge-input"
                    type="date"
                    value={active.date}
                    onChange={(e) => editSession({ date: e.target.value })}
                  />
                </label>
                <label className="block">
                  Start
                  <input
                    className="forge-input"
                    type="time"
                    value={timeLabel(active.start)}
                    onChange={(e) =>
                      editSession({
                        start:
                          Number(e.target.value.slice(0, 2)) * 60 +
                          Number(e.target.value.slice(3)),
                      })
                    }
                  />
                </label>
                <label className="block">
                  Duration (minutes)
                  <input
                    className="forge-input"
                    type="number"
                    min={15}
                    max={240}
                    step={15}
                    value={active.minutes}
                    onChange={(e) =>
                      editSession({ minutes: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="block">
                  Type
                  <select
                    className="forge-input"
                    value={active.kind}
                    onChange={(e) =>
                      editSession({ kind: e.target.value as Session["kind"] })
                    }
                  >
                    {[
                      "learning",
                      "practice",
                      "revision",
                      "assessment",
                      "break",
                    ].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Notes
                  <textarea
                    className="forge-input"
                    value={active.notes}
                    onChange={(e) => editSession({ notes: e.target.value })}
                  />
                </label>
                <label className="block">
                  Resource URL
                  <input
                    className="forge-input"
                    value={active.resource}
                    onChange={(e) => editSession({ resource: e.target.value })}
                  />
                </label>
                <button
                  className="forge-button-secondary"
                  onClick={() =>
                    editSession({ minutes: Math.min(240, active.minutes + 15) })
                  }
                >
                  Resize +15m
                </button>
                <button
                  className="forge-button-secondary"
                  onClick={() =>
                    change({
                      ...draft,
                      sessions: [
                        ...draft.sessions,
                        {
                          ...active,
                          id: crypto.randomUUID(),
                          locked: false,
                          start: active.start + active.minutes,
                        },
                      ],
                    })
                  }
                >
                  Duplicate
                </button>
                <button
                  className="forge-button-secondary"
                  onClick={() =>
                    change({
                      ...draft,
                      sessions: draft.sessions.filter(
                        (s) => s.id !== active.id,
                      ),
                    })
                  }
                >
                  Return to library
                </button>
              </fieldset>
              {active.kind !== "commitment" && (
                <button
                  disabled={busy}
                  className="forge-button-secondary"
                  onClick={() =>
                    active.locked
                      ? void unlock()
                      : editSession({ locked: true })
                  }
                >
                  {active.locked ? "Explicitly unlock" : "Lock session"}
                </button>
              )}
            </>
          )}
          <details>
            <summary className="cursor-pointer">Saved version history</summary>
            {versions.map((v) => (
              <button
                key={v.version}
                className="block text-sm underline p-2"
                onClick={() => setProposal(v.snapshot)}
              >
                v{v.version}: {v.summary}
              </button>
            ))}
          </details>
        </aside>
      </div>
      <section className="forge-panel space-y-3">
        <h2 className="text-lg font-semibold">Optimize with AI</h2>
        <label>
          Describe a preference
          <input
            className="forge-input"
            value={instruction}
            maxLength={2000}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Give DBMS more sessions while preserving my locks"
          />
        </label>
        <button
          className="forge-button-secondary"
          disabled={busy || !instruction}
          onClick={optimize}
        >
          Preview AI allocation changes
        </button>
        <p className="text-sm text-text-muted">
          AI recommends allocation; deterministic rules schedule it. Locked
          sessions are preserved. No active plan changes without approval.
        </p>
      </section>
      {proposal && (
        <section className="forge-panel space-y-3">
          <h2 className="text-xl font-semibold">Compare proposal</h2>
          <p>
            {draft.sessions.length} → {proposal.sessions.length} sessions.{" "}
            {draft.sessions.filter((s) => s.locked).length} locked sessions
            retained.
          </p>
          {proposal.rules.map((r) => (
            <p key={r.subject}>
              {r.subject}:{" "}
              {draft.sessions
                .filter((s) => s.subject === r.subject)
                .reduce((n, s) => n + s.minutes, 0)}{" "}
              →{" "}
              {proposal.sessions
                .filter((s) => s.subject === r.subject)
                .reduce((n, s) => n + s.minutes, 0)}{" "}
              minutes
            </p>
          ))}
          {validateRoutine(proposal, draft).map((i, n) => (
            <p
              key={n}
              className={
                i.severity === "error" ? "text-primary" : "text-text-muted"
              }
            >
              {i.message}
            </p>
          ))}
          <button
            className="forge-button"
            onClick={() => {
              const locked = validateRoutine(proposal, draft).some(
                (i) => i.rule === "locked",
              );
              if (locked) {
                setError(
                  "Proposal changes locked sessions. Unlock explicitly first.",
                );
                return;
              }
              change(proposal);
              setProposal(null);
            }}
          >
            Apply to draft
          </button>
          <button
            className="forge-button-secondary ml-2"
            onClick={() => setProposal(null)}
          >
            Discard proposal
          </button>
        </section>
      )}
      <section className="forge-panel space-y-3">
        <h2 className="text-xl font-semibold">Validate and approve</h2>
        {issues.length === 0 ? (
          <p>All scheduling constraints pass.</p>
        ) : (
          issues.map((i, n) => (
            <p
              key={n}
              className={
                i.severity === "error" ? "text-primary" : "text-text-muted"
              }
            >
              {i.severity === "error" ? "Required fix: " : "Suggestion: "}
              {i.message}
            </p>
          ))
        )}
        <p>
          Your personalized study routine is ready. Does this routine work for
          you, or would you like to make changes?
        </p>
        <p className="text-sm text-text-muted">
          Approval creates tasks for this week only. Unfinished existing tasks
          are retained, and conflicting activations are rejected. Topic
          estimates beyond this week remain in the library.
        </p>
        <button
          className="forge-button"
          disabled={
            busy ||
            issues.some((i) => i.severity === "error") ||
            status === "Saving"
          }
          onClick={approve}
        >
          Approve & activate daily planner
        </button>
      </section>
    </div>
  );
}
