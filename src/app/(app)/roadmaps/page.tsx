import Link from "next/link";
import {
  Map,
  Plus,
  Sparkles,
  ChevronRight,
  Clock,
  Target,
  Layers,
  CheckCircle2,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getRoadmapsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function RoadmapsPage() {
  const data = await getRoadmapsAction();
  const activeRoadmap = data.roadmaps.find((r) => r.status === "active") || data.roadmaps[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-2.5">
            <Map className="h-7 w-7 text-primary" />
            Career Preparation Roadmaps
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Structured milestone pathways designed for SDE-1 placement readiness.
          </p>
        </div>

        <Link href="/roadmaps/new">
          <Button className="gap-2 font-semibold">
            <Plus className="h-4 w-4" />
            Create or Generate Roadmap
          </Button>
        </Link>
      </div>

      {/* Active Roadmap Hero Card */}
      {activeRoadmap && (
        <Card className="bg-gradient-to-br from-surface via-elevated to-surface border-border overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs font-semibold px-2 py-0.5">
                    Active Blueprint
                  </Badge>
                  <span className="text-xs text-text-muted">|</span>
                  <span className="text-xs text-text-secondary">
                    Role: <span className="text-text-primary font-semibold">{activeRoadmap.target_role}</span>
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-text-primary">
                  {activeRoadmap.title}
                </h2>

                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  {activeRoadmap.description || "Comprehensive software engineering career blueprint."}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {activeRoadmap.duration_days} Days Duration
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-warning" />
                    {activeRoadmap.daily_hours}h / day committed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-info" />
                    {activeRoadmap.completed_tasks} / {activeRoadmap.total_tasks} Topics Mastered
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link href={`/roadmaps/${activeRoadmap.id}`}>
                  <Button size="lg" className="w-full gap-2 font-bold">
                    View Full Roadmap
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/planner">
                  <Button size="lg" variant="outline" className="w-full gap-2">
                    Open Daily Planner
                  </Button>
                </Link>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5 pt-4 border-t border-border/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted font-medium">Overall Roadmap Progress</span>
                <span className="text-primary font-bold">
                  {Math.round(
                    (activeRoadmap.completed_tasks / Math.max(activeRoadmap.total_tasks, 1)) * 100
                  )}
                  % Completed
                </span>
              </div>
              <Progress
                value={Math.round(
                  (activeRoadmap.completed_tasks / Math.max(activeRoadmap.total_tasks, 1)) * 100
                )}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Roadmaps List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Your Placement Roadmaps ({data.roadmaps.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.roadmaps.map((r) => {
            const phases = data.phases.filter((p) => p.roadmap_id === r.id);
            const progress = Math.round(
              (r.completed_tasks / Math.max(r.total_tasks, 1)) * 100
            );

            return (
              <Card
                key={r.id}
                className="bg-surface border-border hover:border-border-light transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-[11px]">
                      {r.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-text-muted font-medium">
                      Source: {r.source.toUpperCase()}
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold text-text-primary">
                    <Link
                      href={`/roadmaps/${r.id}`}
                      className="hover:text-primary transition-colors flex items-center justify-between"
                    >
                      <span>{r.title}</span>
                      <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                    </Link>
                  </CardTitle>

                  <p className="text-xs text-text-muted line-clamp-2">
                    {r.description}
                  </p>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Milestones: {phases.length} Phases</span>
                      <span className="text-primary font-bold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-border/60">
                    <span className="text-xs text-text-muted">
                      {r.duration_days} days · {r.daily_hours}h daily
                    </span>
                    <Link href={`/roadmaps/${r.id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        View Phases
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
