import { isDateKey, studyDate } from "@/lib/dates";
import { learningContext, readLearning } from "@/lib/storage/learning";
import { readProfile } from "@/lib/storage/profile";
import type {
  DailyTask,
  DSAProblem,
  JournalEntry,
  LearningTrack,
  PlaylistVideo,
  Profile,
  RevisionItem,
  YoutubePlaylist,
} from "@/types";
import "server-only";
import type { LearningSource } from "./schema";
type ContextInput = {
  profile: Profile | null;
  tracks: LearningTrack[];
  playlists: YoutubePlaylist[];
  videos: PlaylistVideo[];
  journals: JournalEntry[];
  tasks: DailyTask[];
  problems: DSAProblem[];
  revisions: RevisionItem[];
};
export function collectLearningSources(
  data: ContextInput,
  from: string,
  to: string,
): { sources: LearningSource[]; warnings: string[] } {
  const timezone = data.profile?.timezone,
    sources: LearningSource[] = [],
    warnings: string[] = [];
  const inside = (timestamp: string | null | undefined) =>
    !!timestamp &&
    studyDate(
      timezone,
      new Date(timestamp.length === 10 ? timestamp + "T12:00:00Z" : timestamp),
    ) >= from &&
    studyDate(
      timezone,
      new Date(timestamp.length === 10 ? timestamp + "T12:00:00Z" : timestamp),
    ) <= to;
  for (const v of data.videos) {
    if (!inside(v.last_studied_at) && !inside(v.completed_at)) continue;
    const playlist = data.playlists.find((p) => p.id === v.playlist_id),
      track = data.tracks.find((t) => t.id === playlist?.learning_track_id);
    if (!track?.subject) {
      warnings.push(`${v.title}: assign its track a subject.`);
      continue;
    }
    if (!v.notes?.trim() && !v.topics_learned?.length) {
      warnings.push(
        `${v.title}: add topic tags or notes; video numbers alone are not assessment evidence.`,
      );
      continue;
    }
    sources.push({
      id: `video:${v.id}`,
      kind: "video",
      subject: track.subject,
      title: `${playlist?.title ?? track.title} · video ${v.order_index + 1}: ${v.title}`,
      topics: v.topics_learned ?? [],
      notes: v.notes ?? "",
      url: `https://www.youtube.com/watch?v=${v.video_id}`,
      difficulty: v.difficulty_rating ?? undefined,
    });
  }
  for (const j of data.journals.filter((j) => j.date >= from && j.date <= to)) {
    const track = data.tracks.find((t) => t.id === j.learning_track_id);
    const subject = track?.subject;
    if (!subject) {
      warnings.push(`Journal ${j.date}: link a subject track to include it.`);
      continue;
    }
    if (!j.summary?.trim() && !j.concepts?.length) continue;
    sources.push({
      id: `journal:${j.id}`,
      kind: "journal",
      subject,
      title: `${subject} journal ${j.date}`,
      topics: j.concepts ?? [],
      notes: [
        j.summary,
        ...(j.confusing_topics ?? []).map((t) => `Confusing: ${t}`),
        ...(j.questions ?? []),
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }
  for (const t of data.tasks.filter(
    (t) => t.status === "completed" && inside(t.completed_at) && t.subject,
  )) {
    sources.push({
      id: `task:${t.id}`,
      kind: "task",
      subject: t.subject!,
      title: t.title,
      topics: [t.title],
      notes: t.description ?? "",
    });
  }
  for (const p of data.problems.filter(
    (p) =>
      ["attempted", "solved", "revision_needed"].includes(p.status) &&
      (inside(p.last_attempted_at) ||
        (!!p.date_solved && p.date_solved >= from && p.date_solved <= to)),
  )) {
    if (!p.solution_notes?.trim() && !p.mistakes?.trim()) {
      warnings.push(
        `${p.name}: add approach or mistakes for grounded DSA questions.`,
      );
      continue;
    }
    sources.push({
      id: `dsa:${p.id}`,
      kind: "dsa",
      subject: "Data Structures & Algorithms",
      title: p.name,
      topics: p.topic ? [p.topic] : [],
      notes: `Self-reported status: ${p.status}\nApproach: ${p.solution_notes ?? ""}\nMistakes: ${p.mistakes ?? ""}`,
      url: p.url ?? undefined,
    });
  }
  for (const r of data.revisions
    .filter((r) => r.status === "active" && r.next_review_date <= to)
    .slice(0, 6))
    sources.push({
      id: `revision:${r.id}`,
      kind: "revision",
      subject: r.subject,
      title: `Retest: ${r.topic}`,
      topics: [r.topic],
      notes: r.content ?? "",
    });
  // Round-robin subjects before applying limits; never silently discard a subject.
  const grouped = new Map<string, LearningSource[]>();
  for (const s of sources) {
    const group = grouped.get(s.subject) ?? [];
    group.push(s);
    grouped.set(s.subject, group);
  }
  const selected: LearningSource[] = [];
  for (let i = 0; i < 6; i++)
    for (const group of grouped.values())
      if (group[i])
        selected.push({ ...group[i], notes: group[i].notes.slice(0, 2500) });
  if (
    selected.length > 40 ||
    selected.reduce((n, s) => n + s.notes.length + s.title.length, 0) > 60000
  )
    throw Error(
      "Too much learning material for one test. Choose a smaller date range.",
    );
  if (selected.length < sources.length)
    warnings.push(
      "Up to six sources per subject are included in this test. Use another date range to assess the remaining material.",
    );
  return { sources: selected, warnings };
}
export async function readAssessmentContext(from: string, to: string) {
  if (!isDateKey(from) || !isDateKey(to) || from > to)
    throw Error("Choose a valid learning date range.");
  const { db, userId, demo } = await learningContext();
  if (demo)
    throw Error(
      "Assessments use your real saved learning. Connect Supabase first.",
    );
  const [learning, profile, tasks, problems, revisions] = await Promise.all([
    readLearning(),
    readProfile(),
    db
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed"),
    db.from("dsa_problems").select("*").eq("user_id", userId),
    db
      .from("revision_items")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);
  if (tasks.error || problems.error || revisions.error)
    throw Error("Learning context could not be loaded.");
  return collectLearningSources(
    {
      ...learning,
      profile,
      tasks: tasks.data,
      problems: problems.data,
      revisions: revisions.data,
    },
    from,
    to,
  );
}
