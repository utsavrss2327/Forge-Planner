import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Map,
  Sparkles,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Target,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getRoadmapByIdAction } from "../actions";
import { RoadmapActionsClient } from "./roadmap-actions-client";
import { TopicItemClient } from "./topic-item-client";

export const dynamic = "force-dynamic";

interface RoadmapDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoadmapDetailPage({ params }: RoadmapDetailPageProps) {
  const { id } = await params;
  const data = await getRoadmapByIdAction(id);

  if (!data) notFound();

  const { roadmap, phases, milestones, topics } = data;
  const progress = Math.round(
    (roadmap.completed_tasks / Math.max(roadmap.total_tasks, 1)) * 100
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Link href="/roadmaps">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-text-muted hover:text-text-primary">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Roadmaps
          </Button>
        </Link>
      </div>

      {/* Roadmap Master Header */}
      <Card className="bg-surface border-border">
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={roadmap.status === "active" ? "default" : "secondary"} className="text-xs">
                  {roadmap.status.toUpperCase()}
                </Badge>
                <span className="text-xs text-text-muted">|</span>
                <span className="text-xs text-text-secondary font-medium">
                  Role: <span className="text-text-primary font-bold">{roadmap.target_role}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-text-primary">
                {roadmap.title}
              </h1>

              <p className="text-xs sm:text-sm text-text-muted max-w-3xl leading-relaxed">
                {roadmap.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {roadmap.duration_days} Days
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  {roadmap.daily_hours}h Daily Commitment
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-info" />
                  {phases.length} Phases · {topics.length} Total Topics
                </span>
              </div>
            </div>

            {/* Actions: Generate Daily Tasks & Rebalance */}
            <RoadmapActionsClient roadmapId={roadmap.id} />
          </div>

          {/* Overall Progress */}
          <div className="space-y-1.5 pt-3 border-t border-border/60">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted font-medium">Total Mastery Progress</span>
              <span className="text-primary font-bold">
                {roadmap.completed_tasks} / {roadmap.total_tasks} Topics Completed ({progress}%)
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Phases & Milestones Hierarchy */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Curriculum Milestone Breakdown ({phases.length} Phases)
        </h2>

        {phases.map((phase, pIdx) => {
          const phaseMilestones = milestones.filter((m) => m.phase_id === phase.id);

          return (
            <Card key={phase.id} className="bg-surface border-border overflow-hidden">
              <CardHeader className="p-5 pb-3 bg-elevated/40 border-b border-border flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      Phase {pIdx + 1}
                    </Badge>
                    <span className="text-xs text-text-muted uppercase font-semibold">
                      {phase.status.replace("_", " ")}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-text-primary">
                    {phase.title}
                  </CardTitle>
                  {phase.description && (
                    <p className="text-xs text-text-muted mt-0.5">{phase.description}</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {phaseMilestones.map((milestone) => {
                  const milestoneTopics = topics.filter((t) => t.milestone_id === milestone.id);

                  return (
                    <div key={milestone.id} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5 text-primary" />
                          Milestone: {milestone.title}
                        </h4>
                        <span className="text-[11px] text-text-muted">
                          {milestoneTopics.filter((t) => t.status === "completed").length} / {milestoneTopics.length} done
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {milestoneTopics.map((topic) => (
                          <TopicItemClient key={topic.id} topic={topic} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
