"use server";

import { studyDate } from "@/lib/dates";
import { readDashboard } from "@/lib/storage/dashboard";
import { transitionTaskAction, moveTaskAction } from "../planner/actions";
import type { TaskStatus } from "@/types";

export async function getDashboardData() {
  const store = await readDashboard();
  const profile = store.profile;
  const today = studyDate(profile?.timezone);

  const todayTasks = store.dailyTasks.filter((t) => t.scheduled_date === today);
  const completedTodayTasks = todayTasks.filter((t) => t.status === "completed");

  const totalDsaSolved = store.dsaProblems.filter((p) => p.status === "solved").length;

  const totalAssessments = store.assessments.filter((a) => a.status === "evaluated");
  const avgAssessmentScore =
    totalAssessments.length > 0
      ? Math.round(
          totalAssessments.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
            totalAssessments.length
        )
      : 0;

  const dueRevisions = store.revisionItems.filter(
    (r) => r.next_review_date <= today && r.status === "active"
  );

  const activeRoadmap = store.roadmaps.find((r) => r.status === "active") || store.roadmaps[0];
  const roadmapTasks = activeRoadmap ? store.dailyTasks.filter((t) => t.roadmap_id === activeRoadmap.id) : [];

  const sessionTaskIds = new Set(store.studySessions.map((s) => s.task_id));
  const legacyMinutes = store.dailyTasks.filter((t) => !sessionTaskIds.has(t.id)).reduce((n, t) => n + (t.actual_minutes ?? 0), 0);
  const recordedSeconds = store.studySessions.reduce((n, s) => n + (s.duration_seconds ?? (s.duration_minutes ?? 0) * 60), 0);
  const learningHours = ((recordedSeconds + legacyMinutes * 60) / 3600).toFixed(1);

  // Calculate streak from activity logs
  const activityDates = Array.from(new Set(store.activityLogs.map((l) => l.activity_date))).sort();
  const activeDates = new Set(activityDates);
  const dayBefore = (date: string) => new Date(Date.parse(date + "T12:00:00Z") - 86400000).toISOString().slice(0, 10);
  let cursor = activeDates.has(today) ? today : dayBefore(today);
  let currentStreak = 0;
  while (activeDates.has(cursor)) { currentStreak++; cursor = dayBefore(cursor); }
  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.parse(today + "T12:00:00Z") - (6 - index) * 86400000).toISOString().slice(0, 10);
    const tasks = store.dailyTasks.filter((t) => t.scheduled_date === date);
    return { day: date.slice(5), plannedHours: tasks.reduce((n, t) => n + t.estimated_minutes, 0) / 60,
      actualHours: (store.studySessions.filter((s) => studyDate(profile?.timezone, new Date(s.started_at)) === date).reduce((n, s) => n + (s.duration_seconds ?? (s.duration_minutes ?? 0) * 60), 0) / 3600) + tasks.filter((t) => !sessionTaskIds.has(t.id)).reduce((n, t) => n + (t.actual_minutes ?? 0), 0) / 60 };
  });

  // Daily completion percentage
  const dailyCompletionPercentage =
    todayTasks.length > 0 ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) : 0;

  return {
    profile,
    activeSession: store.studySessions.find((s) => !s.ended_at) ?? null,
    allTasks: store.dailyTasks,
    weeklyData,
    today,
    todayTasks,
    activeRoadmap,
    stats: {
      dailyStudyHours: profile?.daily_study_hours || 3.0,
      todayTasksCount: todayTasks.length,
      todayCompletedCount: completedTodayTasks.length,
      dailyCompletionPercentage,
      currentStreak,
      totalDsaSolved,
      learningHours,
      assessmentsCompleted: totalAssessments.length,
      avgAssessmentScore,
      upcomingRevisionsCount: dueRevisions.length,
      roadmapCompletion: roadmapTasks.length
        ? Math.round(roadmapTasks.filter((t) => t.status === "completed").length / roadmapTasks.length * 100)
        : 0,
    },
    topicMastery: store.topicMastery,
    activityLogs: store.activityLogs,
    dueRevisions,
  };
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  return transitionTaskAction(taskId, status);
}

export async function rescheduleTaskAction(taskId: string, newDate: string) {
  return moveTaskAction(taskId, newDate);
}
