"use server";

import { getStore, getProfile } from "@/lib/storage/store";
import { performanceAnalyst } from "@/lib/ai";

export async function getAnalyticsDataAction() {
  const store = getStore();
  const profile = getProfile();

  const totalDsa = store.dsaProblems.length;
  const solvedDsa = store.dsaProblems.filter((p) => p.status === "solved").length;
  const evaluatedAssessments = store.assessments.filter((a) => a.status === "evaluated");

  const avgScore =
    evaluatedAssessments.length > 0
      ? Math.round(
          evaluatedAssessments.reduce((acc, a) => acc + (a.percentage || 0), 0) /
            evaluatedAssessments.length
        )
      : 0;

  const activeRoadmap = store.roadmaps.find((r) => r.status === "active") || store.roadmaps[0];
  const roadmapPercentage = activeRoadmap
    ? Math.round((activeRoadmap.completed_tasks / Math.max(activeRoadmap.total_tasks, 1)) * 100)
    : 0;

  // Funnel stats
  const funnel = {
    saved: store.jobApplications.filter((a) => a.status === "saved").length,
    applied: store.jobApplications.filter((a) => a.status === "applied").length,
    oa: store.jobApplications.filter((a) => a.status === "online_assessment").length,
    interviewing: store.jobApplications.filter(
      (a) => a.status === "interview_scheduled" || a.status === "interviewing"
    ).length,
    offer: store.jobApplications.filter((a) => a.status === "offer").length,
  };

  // Sort Topic Mastery from highest to lowest
  const sortedMastery = [...store.topicMastery].sort((a, b) => b.score - a.score);

  return {
    profile,
    stats: {
      totalDsa,
      solvedDsa,
      dsaRate: totalDsa > 0 ? Math.round((solvedDsa / totalDsa) * 100) : 0,
      totalAssessments: evaluatedAssessments.length,
      avgScore,
      roadmapPercentage,
      revisionsCompleted: store.revisionItems.filter((r) => r.repetitions > 0).length,
      totalRevisions: store.revisionItems.length,
    },
    funnel,
    topicMastery: sortedMastery,
    activityLogs: store.activityLogs,
    assessments: evaluatedAssessments,
  };
}
