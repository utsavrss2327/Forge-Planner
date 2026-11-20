"use client";

import Link from "next/link";
import {
  Map,
  Code2,
  Clock,
  FlaskConical,
  Trophy,
  RotateCcw,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatsGridProps {
  stats: {
    roadmapCompletion: number;
    totalDsaSolved: number;
    learningHours: string;
    assessmentsCompleted: number;
    avgAssessmentScore: number;
    upcomingRevisionsCount: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    {
      title: "Roadmap Completion",
      value: `${stats.roadmapCompletion}%`,
      subtitle: "Active 365-day SDE-1 Blueprint",
      icon: Map,
      href: "/roadmaps",
      progress: stats.roadmapCompletion,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "DSA Solved",
      value: stats.totalDsaSolved.toString(),
      subtitle: "Target: 450+ interview problems",
      icon: Code2,
      href: "/dsa",
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Learning Time",
      value: `${stats.learningHours}h`,
      subtitle: "Focused preparation logged",
      icon: Clock,
      href: "/learning",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Assessments Taken",
      value: stats.assessmentsCompleted.toString(),
      subtitle: "60-min active recall tests",
      icon: FlaskConical,
      href: "/assessments",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Average Score",
      value: `${stats.avgAssessmentScore}%`,
      subtitle: "Interview readiness benchmark",
      icon: Trophy,
      href: "/analytics",
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Due Revisions",
      value: stats.upcomingRevisionsCount.toString(),
      subtitle: "Spaced repetition queue",
      icon: RotateCcw,
      href: "/revision",
      color: stats.upcomingRevisionsCount > 0 ? "text-warning" : "text-text-muted",
      bg: stats.upcomingRevisionsCount > 0 ? "bg-warning/10" : "bg-elevated",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.title} href={item.href} className="group">
            <Card className="bg-surface border-border hover:border-border-light hover:bg-elevated transition-all duration-200 h-full">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted">{item.title}</span>
                  <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                      {item.value}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 truncate">{item.subtitle}</p>

                  {item.progress !== undefined && (
                    <div className="mt-2.5">
                      <Progress value={item.progress} className="h-1.5" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
