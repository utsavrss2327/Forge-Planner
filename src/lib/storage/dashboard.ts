import "server-only";
import { learningContext } from "./learning";
import { getStore, getProfile } from "./store";
import { studyDate } from "@/lib/dates";
import type { Profile, DailyTask, DSAProblem, Assessment, RevisionItem, Roadmap, TopicMastery, ActivityLog, StudySession } from "@/types";

function activityLogs(userId: string, profile: Profile | null, tasks: DailyTask[], videos: { id: string; completed_at: string | null }[], sessions: StudySession[]): ActivityLog[] {
  const records = [
    ...tasks.filter((t) => t.status === "completed" && t.completed_at).map((t) => ({ id: t.id, stamp: t.completed_at!, type: "task_completed" })),
    ...videos.filter((v) => v.completed_at).map((v) => ({ id: v.id, stamp: v.completed_at!, type: "video_completed" })),
    ...sessions.filter((s) => s.ended_at && (s.duration_seconds ?? (s.duration_minutes ?? 0) * 60) > 0).map((s) => ({ id: s.id, stamp: s.ended_at!, type: "study_session" })),
  ];
  return records.map((r) => ({ id: r.id, user_id: userId, activity_type: r.type, activity_date: studyDate(profile?.timezone, new Date(r.stamp)), count: 1, metadata: {}, created_at: r.stamp }));
}

export async function readDashboard() {
  const { db, userId, demo } = await learningContext();
  if (demo) {
    const store = getStore(), profile = getProfile();
    return { ...store, profile, activityLogs: activityLogs(userId, profile, store.dailyTasks, store.playlistVideos.filter((v) => v.status === "completed"), store.studySessions) };
  }
  const tables = ["profiles", "daily_tasks", "dsa_problems", "assessments", "revision_items", "roadmaps", "topic_mastery", "study_sessions"];
  const results = await Promise.all(tables.map((table) => db.from(table).select("*").eq(table === "profiles" ? "id" : "user_id", userId)));
  if (results.some((r) => r.error)) throw new Error("Could not load dashboard data. Check database setup.");
  const dailyTasks = results[1].data as DailyTask[], studySessions = results[7].data as StudySession[];
  const videos = await db.from("playlist_videos").select("id,completed_at").eq("status", "completed");
  if (videos.error) throw new Error("Could not load completed learning activities.");
  const profile = results[0].data[0] as Profile | undefined;
  return { profile: profile ?? null, dailyTasks, studySessions, dsaProblems: results[2].data as DSAProblem[], assessments: results[3].data as Assessment[],
    revisionItems: results[4].data as RevisionItem[], roadmaps: results[5].data as Roadmap[], topicMastery: results[6].data as TopicMastery[],
    activityLogs: activityLogs(userId, profile ?? null, dailyTasks, videos.data as { id: string; completed_at: string | null }[], studySessions) };
}
