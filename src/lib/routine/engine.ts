import { shiftDate } from "@/lib/dates";
import { routineSchema, type Routine, type Session } from "./schema";
export type Issue = {
  rule: string;
  severity: "error" | "warning";
  message: string;
  sessions: string[];
};
export function validateRoutine(input: Routine, previous?: Routine): Issue[] {
  const parsed = routineSchema.safeParse(input);
  if (!parsed.success)
    return parsed.error.issues.map((i) => ({
      rule: "shape",
      severity: "error",
      message: i.message,
      sessions: [],
    }));
  const r = parsed.data,
    issues: Issue[] = [];
  const error = (rule: string, message: string, ids: string[] = []) =>
    issues.push({ rule, severity: "error", message, sessions: ids });
  for (const old of previous?.sessions ?? [])
    if (old.locked) {
      const next = r.sessions.find((s) => s.id === old.id);
      if (
        !next ||
        JSON.stringify([
          next.id,
          next.topicId,
          next.subject,
          next.title,
          next.date,
          next.start,
          next.minutes,
          next.kind,
          next.locked,
          next.notes,
          next.resource,
        ]) !==
          JSON.stringify([
            old.id,
            old.topicId,
            old.subject,
            old.title,
            old.date,
            old.start,
            old.minutes,
            old.kind,
            old.locked,
            old.notes,
            old.resource,
          ])
      )
        error("locked", `Unlock ${old.title} before changing it.`, [old.id]);
    }
  for (const s of r.sessions) {
    if (s.date < r.week || s.date > shiftDate(r.week, 6))
      error("week", `${s.title} is outside this week.`, [s.id]);
    const window = r.windows.find(
      (w) => w.day === new Date(s.date + "T12:00:00Z").getUTCDay(),
    );
    if (
      s.kind !== "commitment" &&
      (!window ||
        window.capacity === 0 ||
        s.start < window.start ||
        s.start + s.minutes > window.end)
    )
      error("window", `${s.title} is outside study availability.`, [s.id]);
    if (s.start + s.minutes > 1440)
      error("duration", `${s.title} extends into the next day.`, [s.id]);
    if (
      !["commitment", "break"].includes(s.kind) &&
      !r.rules.some((rule) => rule.subject === s.subject)
    )
      error("subject", `Select ${s.subject} before scheduling it.`, [s.id]);
    if (
      s.topicId &&
      !r.topics.some((t) => t.id === s.topicId && t.subject === s.subject)
    )
      error("topic", `${s.title} references an unknown topic.`, [s.id]);
  }
  for (let i = 0; i < 7; i++) {
    const date = shiftDate(r.week, i),
      sessions = r.sessions
        .filter((s) => s.date === date)
        .sort((a, b) => a.start - b.start);
    for (let j = 1; j < sessions.length; j++)
      if (
        sessions
          .slice(0, j)
          .some((p) => p.start + p.minutes > sessions[j].start)
      )
        error(
          "overlap",
          `${date}: sessions overlap. Move one to another time.`,
          sessions.map((s) => s.id),
        );
    const study = sessions.filter(
      (s) => !["commitment", "break"].includes(s.kind),
    );
    const capacity =
      r.windows.find((w) => w.day === new Date(date + "T12:00:00Z").getUTCDay())
        ?.capacity ?? 0;
    if (study.reduce((n, s) => n + s.minutes, 0) > capacity)
      error(
        "capacity",
        `${date} exceeds available minutes. Reduce or move a session.`,
        study.map((s) => s.id),
      );
    if (new Set(study.map((s) => s.subject)).size > r.maxSubjects)
      error(
        "switching",
        `${date} exceeds your daily subject limit.`,
        study.map((s) => s.id),
      );
    if (study.some((s) => s.minutes > 120))
      issues.push({
        rule: "break",
        severity: "warning",
        message: `${date}: consider a break during long sessions.`,
        sessions: [],
      });
  }
  for (const rule of r.rules) {
    const count = r.sessions.filter(
      (s) =>
        s.subject === rule.subject && !["commitment", "break"].includes(s.kind),
    ).length;
    if (count < rule.sessions)
      issues.push({
        rule: "coverage",
        severity: rule.mandatory ? "error" : "warning",
        message: `${rule.subject}: ${count}/${rule.sessions} sessions planned. Add learning objectives/capacity or lower the target.`,
        sessions: [],
      });
  }
  for (const s of r.sessions.filter((s) => s.topicId)) {
    const topic = r.topics.find((t) => t.id === s.topicId);
    for (const id of topic?.prerequisites ?? []) {
      const prerequisite = r.topics.find((t) => t.id === id);
      if (prerequisite?.completed) continue;
      const before = r.sessions
        .filter(
          (p) =>
            p.topicId === id &&
            (p.date < s.date ||
              (p.date === s.date && p.start + p.minutes <= s.start)),
        )
        .reduce((n, p) => n + p.minutes, 0);
      if (!prerequisite || before < prerequisite.minutes)
        error(
          "prerequisite",
          `${s.title}: finish ${prerequisite?.title ?? "prerequisite"} first.`,
          [s.id],
        );
    }
  }
  return issues;
}
export function generateRoutine(input: Routine, newId: () => string): Routine {
  if (!routineSchema.safeParse(input).success) return structuredClone(input);
  const r: Routine = structuredClone(input);
  r.sessions = r.sessions.filter((s) => s.locked || s.kind === "commitment");
  const rules = [...r.rules].sort(
    (a, b) =>
      Number(b.mandatory) - Number(a.mandatory) || b.priority - a.priority,
  );
  // Each pass allocates one session per subject before higher frequencies receive extras.
  for (let round = 0; round < 14; round++)
    for (const rule of rules) {
      if (r.sessions.length >= 140) return r;
      if (
        r.sessions.filter(
          (s) =>
            s.subject === rule.subject &&
            !["commitment", "break"].includes(s.kind),
        ).length >= rule.sessions
      )
        continue;
      const candidates = Array.from({ length: 7 }, (_, i) =>
        shiftDate(r.week, i),
      ).sort((a, b) => {
        const score = (date: string) =>
          r.sessions
            .filter((s) => s.date === date)
            .reduce((n, s) => n + s.minutes, 0) +
          r.sessions.filter(
            (s) => s.date === date && s.subject === rule.subject,
          ).length *
            1440;
        return score(a) - score(b) || a.localeCompare(b);
      });
      let placed = false;
      for (const date of candidates) {
        const w = r.windows.find(
          (w) => w.day === new Date(date + "T12:00:00Z").getUTCDay(),
        )!;
        const topics = r.topics.filter(
          (t) => t.subject === rule.subject && !t.completed,
        );
        const remaining = topics.find(
          (t) =>
            r.sessions
              .filter((s) => s.topicId === t.id)
              .reduce((n, s) => n + s.minutes, 0) < t.minutes,
        );
        if (!remaining) continue;
        const minutes = Math.max(
          15,
          Math.min(
            rule.minutes,
            remaining.minutes -
              r.sessions
                .filter((s) => s.topicId === remaining.id)
                .reduce((n, s) => n + s.minutes, 0),
          ),
        );
        const daySessions = r.sessions.filter((s) => s.date === date);
        const study = daySessions.filter(
          (s) => !["commitment", "break"].includes(s.kind),
        );
        if (study.reduce((n, s) => n + s.minutes, 0) + minutes > w.capacity)
          continue;
        if (
          !study.some((s) => s.subject === rule.subject) &&
          new Set(study.map((s) => s.subject)).size >= r.maxSubjects
        )
          continue;
        for (let start = w.start; start + minutes <= w.end; start += 15) {
          if (
            daySessions.some(
              (s) => s.start < start + minutes && start < s.start + s.minutes,
            )
          )
            continue;
          const session: Session = {
            id: newId(),
            date,
            start,
            minutes,
            topicId: remaining.id,
            subject: rule.subject,
            title: remaining.title,
            kind: "learning",
            locked: false,
            notes: "",
            resource: remaining.resource,
          };
          const proposal = { ...r, sessions: [...r.sessions, session] };
          if (
            !validateRoutine(proposal).some(
              (i) => i.severity === "error" && i.rule !== "coverage",
            )
          ) {
            r.sessions.push(session);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }
  return r;
}
export function timeLabel(minutes: number) {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
}
// PostgreSQL JSONB normalizes object key order. Compare content, not serialization order.
export function routineFingerprint(value: Routine): string {
  return JSON.stringify(value, (_key: string, item: unknown) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, (item as Record<string, unknown>)[key]]),
        )
      : item,
  );
}
