import { TodaysTasks } from "@/components/dashboard/todays-tasks";
import { ActiveSession } from "@/components/planner/active-session";
import { SubjectDay } from "@/components/planner/subject-day";
import { TaskEditor } from "@/components/planner/task-editor";
import { isDateKey, shiftDate, studyDate } from "@/lib/dates";
import { capacityWarning } from "@/lib/planner";
import Link from "next/link";
import { getPlannerData } from "./actions";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const data = await getPlannerData();
  const params = await searchParams;
  const today = studyDate(data.profile?.timezone),
    date = params.date && isDateKey(params.date) ? params.date : today;
  const days = Array.from({ length: params.view === "week" ? 7 : 1 }, (_, i) =>
    shiftDate(date, i),
  );
  const active = data.sessions.find((s) => !s.ended_at);
  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Daily planner</h1>
          <p className="mt-1 text-sm text-text-muted">
            Plan within your availability. Record time you actually spend
            studying.
          </p>
        </div>
        <TaskEditor date={date} tracks={data.tracks} />
      </header>
      {active && (
        <ActiveSession
          session={active}
          title={
            data.tasks.find((t) => t.id === active.task_id)?.title ??
            "Active study session"
          }
          serverNow={new Date().toISOString()}
        />
      )}
      <Link className="forge-button inline-block" href="/planner/customize">
        Customize weekly routine
      </Link>
      <div className="flex flex-wrap items-end gap-4">
        <form className="flex items-end gap-2">
          <label className="text-sm">
            Study date
            <input
              name="date"
              type="date"
              defaultValue={date}
              className="mt-1 block rounded border border-border bg-surface p-2"
            />
          </label>
          <button className="rounded border border-border px-3 py-2 text-sm">
            View
          </button>
        </form>
        <Link
          className="rounded border border-border px-3 py-2 text-sm"
          href={`/planner?date=${shiftDate(date, -1)}`}
        >
          Previous day
        </Link>
        <Link
          className="rounded border border-border px-3 py-2 text-sm"
          href={`/planner?date=${today}`}
        >
          Today
        </Link>
        <Link
          className="rounded border border-border px-3 py-2 text-sm"
          href={`/planner?date=${shiftDate(date, 1)}`}
        >
          Next day
        </Link>
        <Link
          className="rounded border border-border px-3 py-2 text-sm"
          href={`/planner?date=${date}&view=${params.view === "week" ? "day" : "week"}`}
        >
          {params.view === "week" ? "Daily view" : "Next 7 days"}
        </Link>
      </div>
      {data.tasks.length === 0 && (
        <p className="forge-panel">
          No activated routine yet. Create a roadmap, customize your week, and
          approve it to see subjects and topics here. You can also add manual
          tasks.
        </p>
      )}
      {days.map((day) => {
        const tasks = data.tasks.filter((t) => t.scheduled_date === day);
        const warning = capacityWarning(data.tasks, data.profile, day, 0);
        const planned = tasks
          .filter((t) => t.status !== "skipped")
          .reduce((n, t) => n + t.estimated_minutes, 0);
        return (
          <section key={day} className="space-y-3">
            <div className="flex justify-between">
              <h2 className="font-semibold">
                {day} · {planned} minutes planned
              </h2>
              <TaskEditor date={day} tracks={data.tracks} />
            </div>
            {warning && (
              <p
                role="status"
                className="rounded border border-primary/30 p-3 text-sm text-primary"
              >
                {warning}
              </p>
            )}
            <div className="grid gap-3 lg:grid-cols-2">
              {[
                ...new Set(tasks.map((t) => t.subject || "Independent study")),
              ].map((subject) => (
                <SubjectDay
                  key={subject}
                  subject={subject}
                  tasks={tasks.filter(
                    (t) => (t.subject || "Independent study") === subject,
                  )}
                />
              ))}
            </div>
            <TodaysTasks
              tasks={tasks}
              today={today}
              title={`Study tasks — ${day}`}
            />
            {tasks.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded border border-border p-2"
                  >
                    <span className="max-w-48 truncate text-xs">
                      {task.title}
                    </span>
                    <TaskEditor task={task} date={day} tracks={data.tracks} />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
      {data.tasks.some(
        (t) =>
          t.scheduled_date < today &&
          !["completed", "skipped"].includes(t.status),
      ) && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Unfinished earlier tasks</h2>
          <p className="text-sm text-text-muted">
            Move these tasks using Edit task. Tasks are retained until you
            complete, skip, or delete them.
          </p>
          {data.tasks
            .filter(
              (t) =>
                t.scheduled_date < today &&
                !["completed", "skipped"].includes(t.status),
            )
            .map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded border border-border p-3"
              >
                <span className="text-sm">
                  {t.title} · {t.scheduled_date}
                </span>
                <TaskEditor task={t} date={today} tracks={data.tracks} />
              </div>
            ))}
        </section>
      )}
      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Recorded study sessions</h2>
        <p className="text-xs text-text-muted">
          Completed timer segments. Running time is excluded until paused.
          Deleting a task keeps its recorded sessions.
        </p>
        {data.sessions.filter((s) => s.ended_at).length === 0 && (
          <p className="text-sm text-text-muted">
            No sessions recorded. Start a task and pause or complete it to
            record your time.
          </p>
        )}
        {data.sessions
          .filter((s) => s.ended_at)
          .slice(0, 30)
          .map((s) => (
            <div
              key={s.id}
              className="flex justify-between gap-3 border-t border-border py-2 text-sm"
            >
              <span>
                {data.tasks.find((t) => t.id === s.task_id)?.title ??
                  "Deleted task"}{" "}
                · {studyDate(data.profile?.timezone, new Date(s.started_at))}
              </span>
              <span>
                {Math.floor(
                  (s.duration_seconds ?? (s.duration_minutes ?? 0) * 60) / 60,
                )}
                m {(s.duration_seconds ?? 0) % 60}s
              </span>
            </div>
          ))}
      </section>
    </div>
  );
}
