import {
  BarChart3,
  TrendingUp,
  Target,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAnalyticsDataAction } from "./actions";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsDataAction();
  const { stats, funnel, topicMastery, activityLogs } = data;

  const strongestTopics = topicMastery.filter((m) => m.score >= 70);
  const weakestTopics = topicMastery.filter((m) => m.score < 60);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-2.5">
          <BarChart3 className="h-7 w-7 text-primary" />
          Analytics & Performance Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Evidence-based placement readiness tracking across DSA, CS fundamentals, assessments, and applications.
        </p>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-surface border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-text-muted font-medium">DSA Accuracy Rate</span>
            <div className="text-2xl font-black text-text-primary">
              {stats.dsaRate}%
            </div>
            <div className="text-[11px] text-text-muted">
              {stats.solvedDsa} of {stats.totalDsa} Solved
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-text-muted font-medium">Assessment Benchmark</span>
            <div className="text-2xl font-black text-success">
              {stats.avgScore}%
            </div>
            <div className="text-[11px] text-text-muted">
              {stats.totalAssessments} 60-min Tests
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-text-muted font-medium">Roadmap Progress</span>
            <div className="text-2xl font-black text-primary">
              {stats.roadmapPercentage}%
            </div>
            <div className="text-[11px] text-text-muted">
              Active SDE-1 Blueprint
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-text-muted font-medium">Revision Retention</span>
            <div className="text-2xl font-black text-info">
              {stats.revisionsCompleted}
            </div>
            <div className="text-[11px] text-text-muted">
              SM-2 Cards Reviewed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly AI Review Report */}
      <Card className="bg-gradient-to-r from-primary/10 via-surface to-elevated border-primary/20 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-text-primary">
              Weekly AI Review & Placement Strategy
            </h3>
          </div>
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            Performance Analyst
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-surface/80 p-3.5 rounded-xl border border-border space-y-1.5">
            <h4 className="font-bold text-success flex items-center gap-1.5 uppercase text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              What Was Accomplished
            </h4>
            <p className="text-text-secondary leading-relaxed">
              Maintained 100% adherence to daily 3-hour capacity. Cleared foundational Binary Search on Answer spaces and BCNF normalization proofs.
            </p>
          </div>

          <div className="bg-surface/80 p-3.5 rounded-xl border border-border space-y-1.5">
            <h4 className="font-bold text-primary flex items-center gap-1.5 uppercase text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Primary Weakness to Address Next Week
            </h4>
            <p className="text-text-secondary leading-relaxed">
              Dynamic Programming transitions currently score 48%. Focus the upcoming sprint on 1D/2D space optimizations and Unbounded Knapsack recurrence relations.
            </p>
          </div>
        </div>
      </Card>

      {/* Topic Mastery Ranking & Application Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Mastery Leaderboard */}
        <Card className="bg-surface border-border">
          <CardHeader className="p-5 pb-3 border-b border-border">
            <CardTitle className="text-base font-bold text-text-primary flex items-center justify-between">
              <span>Topic Mastery Hierarchy</span>
              <Badge variant="outline" className="text-xs">
                {topicMastery.length} Topics
              </Badge>
            </CardTitle>
            <p className="text-xs text-text-muted">
              Calculated transparently from assessment correctness, difficulty, and revision results.
            </p>
          </CardHeader>

          <CardContent className="p-5 space-y-3.5">
            {topicMastery.map((tm) => {
              const isStrong = tm.score >= 75;
              const isWeak = tm.score < 60;

              return (
                <div key={tm.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-primary truncate max-w-[200px]">
                      {tm.topic}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-[11px]">
                        {tm.questions_correct}/{tm.questions_attempted} correct
                      </span>
                      <span
                        className={`font-bold ${
                          isStrong ? "text-success" : isWeak ? "text-primary" : "text-warning"
                        }`}
                      >
                        {tm.score}%
                      </span>
                    </div>
                  </div>
                  <Progress value={tm.score} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Job Application Funnel */}
        <Card className="bg-surface border-border">
          <CardHeader className="p-5 pb-3 border-b border-border">
            <CardTitle className="text-base font-bold text-text-primary flex items-center justify-between">
              <span>Placement Application Funnel</span>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardTitle>
            <p className="text-xs text-text-muted">
              Conversion rates across your active interview pipelines.
            </p>
          </CardHeader>

          <CardContent className="p-5 space-y-3.5">
            {[
              { label: "1. Saved Opportunities", count: funnel.saved, color: "bg-surface border-border text-text-muted" },
              { label: "2. Submitted Applications", count: funnel.applied, color: "bg-info/10 border-info/30 text-info" },
              { label: "3. Online Assessments (OA)", count: funnel.oa, color: "bg-warning/10 border-warning/30 text-warning" },
              { label: "4. Technical Loops / Interviewing", count: funnel.interviewing, color: "bg-primary/10 border-primary/30 text-primary" },
              { label: "5. Placement Offers", count: funnel.offer, color: "bg-success/10 border-success/30 text-success" },
            ].map((step) => (
              <div
                key={step.label}
                className={`p-3 rounded-xl border flex items-center justify-between ${step.color}`}
              >
                <span className="text-xs font-bold">{step.label}</span>
                <span className="text-lg font-black">{step.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity Consistency Heatmap */}
      <ActivityHeatmap logs={activityLogs} today={new Date().toISOString().slice(0, 10)} />
    </div>
  );
}
