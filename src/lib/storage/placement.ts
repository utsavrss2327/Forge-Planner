import type {
  ActivityLog,
  AIConversation,
  Assessment,
  DSAProblem,
  JobApplication,
  RevisionItem,
  TopicMastery,
} from "@/types";
import "server-only";
import { learningContext } from "./learning";
import { getStore } from "./store";
export async function readPlacement() {
  const { db, userId, demo } = await learningContext();
  if (demo) {
    const s = getStore();
    return {
      problems: s.dsaProblems,
      applications: s.jobApplications,
      revisions: s.revisionItems,
      mastery: s.topicMastery,
      conversations: s.aiConversations,
      assessments: s.assessments,
      activity: s.activityLogs,
    };
  }
  const tables = [
    "dsa_problems",
    "job_applications",
    "revision_items",
    "topic_mastery",
    "ai_conversations",
    "assessments",
    "activity_log",
  ];
  const r = await Promise.all(
    tables.map((t) => db.from(t).select("*").eq("user_id", userId)),
  );
  if (r.some((r) => r.error))
    throw Error(
      "Your preparation records could not be loaded. Check the connection and migrations.",
    );
  return {
    problems: r[0].data as DSAProblem[],
    applications: r[1].data as JobApplication[],
    revisions: r[2].data as RevisionItem[],
    mastery: r[3].data as TopicMastery[],
    conversations: r[4].data as AIConversation[],
    assessments: r[5].data as Assessment[],
    activity: r[6].data as ActivityLog[],
  };
}
