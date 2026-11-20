import { ActiveSession } from "@/components/planner/active-session";
import { getDashboardData } from "./actions";
import { DailyMission } from "@/components/dashboard/daily-mission";
import { TodaysTasks } from "@/components/dashboard/todays-tasks";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { AIInsight } from "@/components/dashboard/ai-insight";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Daily Mission Command Banner */}
      <DailyMission profile={data.profile} stats={data.stats} />

      {data.activeSession && <ActiveSession session={data.activeSession} title={data.allTasks.find((t) => t.id === data.activeSession?.task_id)?.title ?? "Active study session"} serverNow={new Date().toISOString()} />}
      {/* 2. AI Insight Diagnostic */}
      <AIInsight weakTopics={data.topicMastery} streak={data.stats.currentStreak} />

      {/* 3. Today's Actionable Tasks */}
      <TodaysTasks tasks={data.todayTasks} today={data.today} />

      {/* 4. Preparation Overview (2x3 Grid) */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-3">
          Preparation Readiness Overview
        </h2>
        <StatsGrid stats={data.stats} />
      </div>

      {/* 5. Weekly Analytics & Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyChart data={data.weeklyData} />
        <ActivityHeatmap logs={data.activityLogs} today={data.today} />
      </div>
    </div>
  );
}
