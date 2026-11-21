export const maxDuration = 120;
import { RoutineEditor } from "@/components/routine/routine-editor";
import { isDateKey, studyDate } from "@/lib/dates";
import { dayNames, type Routine, type RoutineRow } from "@/lib/routine/schema";
import { learningContext } from "@/lib/storage/learning";
import { readProfile } from "@/lib/storage/profile";
import { readRoadmaps } from "@/lib/storage/roadmaps";
export default async function CustomizePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { db, userId, demo } = await learningContext();
  const profile = await readProfile(),
    { topics } = await readRoadmaps(),
    params = await searchParams;
  const week =
    params.week && isDateKey(params.week)
      ? params.week
      : studyDate(profile?.timezone);
  const { data: row, error } = demo
    ? { data: null, error: null }
    : await db
        .from("weekly_routines")
        .select("*")
        .eq("user_id", userId)
        .eq("week", week)
        .maybeSingle();
  if (error)
    throw new Error(
      "Apply the routine planning migration before using the editor.",
    );
  const { data: versions } = row
    ? await db
        .from("routine_versions")
        .select("version,summary,created_at,snapshot")
        .eq("routine_id", row.id)
        .order("version", { ascending: false })
        .limit(20)
    : { data: [] };
  const evidence = demo
    ? []
    : await Promise.all([
        db
          .from("topic_mastery")
          .select("subject,score,questions_attempted")
          .eq("user_id", userId),
        db
          .from("daily_tasks")
          .select("subject")
          .eq("user_id", userId)
          .lt("scheduled_date", studyDate(profile?.timezone))
          .in("status", ["pending", "in_progress", "rescheduled"]),
      ]);
  if (evidence.some((r) => r.error))
    throw new Error("Assessment and missed-task evidence could not be loaded.");
  const rawPriorityHints: string[] = [
    ...new Set([
      ...(evidence[0]?.data ?? [])
        .filter(
          (m: { score: number; questions_attempted: number }) =>
            Number(m.score) < 60 && m.questions_attempted > 0,
        )
        .map((m: { subject: string }) => m.subject),
      ...(evidence[1]?.data ?? [])
        .map((t: { subject: string | null }) => t.subject)
        .filter(Boolean),
    ]),
  ] as string[];
  const subjects = [
    ...new Set([
      ...(profile?.preparation_subjects ?? []),
      ...topics.map((t) => t.subject),
    ]),
  ];
  const priorityHints = rawPriorityHints.filter((subject) =>
    subjects.includes(subject),
  );
  const initial: Routine = row?.draft ?? {
    week,
    windows:
      profile?.planning_preferences?.windows ??
      dayNames.map((day, i) => ({
        day: i,
        start: 480,
        end: 1440,
        capacity: profile?.available_days.includes(day)
          ? Math.round((profile.daily_study_hours ?? 3) * 60)
          : 0,
      })),
    maxSubjects: profile?.planning_preferences?.maxSubjects ?? 3,
    rules: subjects.map((subject) => ({
      subject,
      sessions:
        profile?.planning_preferences?.rules?.find((r) => r.subject === subject)
          ?.sessions ?? 1,
      minutes:
        profile?.planning_preferences?.rules?.find((r) => r.subject === subject)
          ?.minutes ?? 45,
      priority: Math.max(
        profile?.planning_preferences?.rules?.find((r) => r.subject === subject)
          ?.priority ?? 3,
        profile?.weak_subjects.includes(subject) ||
          priorityHints.includes(subject)
          ? 4
          : 1,
      ),
      mandatory:
        profile?.planning_preferences?.rules?.find((r) => r.subject === subject)
          ?.mandatory ?? true,
    })),
    topics,
    sessions: [],
  };
  return (
    <RoutineEditor
      key={week}
      initial={initial}
      priorityHints={priorityHints}
      deadline={profile?.target_date}
      row={row as RoutineRow | null}
      userId={userId}
      versions={versions ?? []}
    />
  );
}
