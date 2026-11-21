import type { DailyTask, Profile, StudySession, TaskStatus } from "@/types";

export function capacityWarning(
  tasks: DailyTask[],
  profile: Profile | null,
  date: string,
  minutes: number,
  excludeId?: string,
): string | null {
  const weekday = new Intl.DateTimeFormat("en", {
    weekday: "long",
    timeZone: "UTC",
  })
    .format(new Date(date + "T12:00:00Z"))
    .toLowerCase();
  const dayRule = profile?.planning_preferences?.windows?.find(
    (w) => w.day === new Date(date + "T12:00:00Z").getUTCDay(),
  );
  const capacity =
    dayRule?.capacity ??
    ((profile?.available_days.includes(weekday) ?? true)
      ? Math.round(Number(profile?.daily_study_hours ?? 3) * 60)
      : 0);
  const planned = tasks
    .filter(
      (t) =>
        t.id !== excludeId &&
        t.scheduled_date === date &&
        t.status !== "skipped",
    )
    .reduce((n, t) => n + t.estimated_minutes, 0);
  return planned + minutes > capacity
    ? `${date} has ${capacity} available minutes and ${planned} already planned. This would add ${minutes} minutes. Adjust the plan or explicitly allow an over-capacity day.`
    : null;
}

// The server is the clock authority. A pause closes a segment; resuming creates another.
export function transitionTask(
  task: DailyTask,
  sessions: StudySession[],
  userId: string,
  status: TaskStatus,
  now: Date,
  sessionId: string,
): void {
  if (task.user_id !== userId) throw new Error("Task not found.");
  const running = sessions.find((s) => s.user_id === userId && !s.ended_at);
  if (status === "in_progress") {
    if (task.status === "completed" || task.status === "skipped")
      throw new Error("Reopen this task before starting a session.");
    if (running && running.task_id !== task.id)
      throw new Error(
        "Pause your current study session before starting another task.",
      );
    if (!running)
      sessions.push({
        id: sessionId,
        user_id: userId,
        task_id: task.id,
        learning_track_id: task.learning_track_id,
        subject: task.subject,
        started_at: now.toISOString(),
        ended_at: null,
        duration_minutes: null,
        duration_seconds: null,
        notes: null,
        created_at: now.toISOString(),
      });
  } else if (running?.task_id === task.id) {
    const seconds = Math.max(
      0,
      Math.floor((now.getTime() - Date.parse(running.started_at)) / 1000),
    );
    Object.assign(running, {
      ended_at: now.toISOString(),
      duration_seconds: seconds,
      duration_minutes: Math.floor(seconds / 60),
    });
  }
  task.status = status;
  task.completed_at =
    status === "completed" ? (task.completed_at ?? now.toISOString()) : null;
  task.actual_minutes = Math.floor(
    sessions
      .filter((s) => s.task_id === task.id && s.user_id === userId)
      .reduce(
        (n, s) => n + (s.duration_seconds ?? (s.duration_minutes ?? 0) * 60),
        0,
      ) / 60,
  );
  task.updated_at = now.toISOString();
}
