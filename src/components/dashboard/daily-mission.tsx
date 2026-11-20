"use client";

import Link from "next/link";
import {
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Profile } from "@/types";

interface DailyMissionProps {
  profile: Profile | null;
  stats: {
    dailyStudyHours: number;
    todayTasksCount: number;
    todayCompletedCount: number;
    dailyCompletionPercentage: number;
    currentStreak: number;
  };
}

export function DailyMission({ profile, stats }: DailyMissionProps) {
  const todayFormatted = new Intl.DateTimeFormat("en", { timeZone: profile?.timezone ?? "Asia/Kolkata", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());

  return (
    <Card className="bg-gradient-to-br from-surface via-elevated to-surface border-border overflow-hidden relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Mission details */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary font-semibold">
                <Calendar className="h-3 w-3 mr-1" />
                {todayFormatted}
              </Badge>
              <span className="text-xs text-text-muted">|</span>
              <span className="text-xs text-text-secondary font-medium">
                Goal: <span className="text-text-primary font-semibold">{profile?.target_role || "SDE-1"}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
              Today&apos;s Mission:{" "}
              <span className="text-primary">
                {stats.todayCompletedCount >= stats.todayTasksCount && stats.todayTasksCount > 0
                  ? "Mission Accomplished!"
                  : "Learn, Reflect, and Recall"}
              </span>
            </h1>

            <p className="text-sm text-text-muted leading-relaxed">
              Daily capacity: <span className="text-text-secondary font-medium">{stats.dailyStudyHours} study hours</span>. Focus on active recall, boundary condition edge-cases, and spaced retention.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link href="/learning">
                <Button size="sm" className="gap-2 font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  Record Learning Notes
                </Button>
              </Link>
              <Link href="/learning">
                <Button size="sm" variant="outline" className="gap-2">
                  Continue Learning Track
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Key metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-[280px]">
            {/* Streak */}
            <div className="bg-surface/80 p-3.5 rounded-xl border border-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-xs font-medium">Streak</span>
                <Flame className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-text-primary">
                  {stats.currentStreak} <span className="text-xs font-normal text-text-muted">days</span>
                </div>
                <div className="text-[10px] text-primary font-medium mt-0.5">Keep momentum</div>
              </div>
            </div>

            {/* Daily tasks */}
            <div className="bg-surface/80 p-3.5 rounded-xl border border-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-xs font-medium">Tasks</span>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-text-primary">
                  {stats.todayCompletedCount}/{stats.todayTasksCount}
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">{stats.dailyCompletionPercentage}% done</div>
              </div>
            </div>

            {/* Target Hours */}
            <div className="bg-surface/80 p-3.5 rounded-xl border border-border flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-xs font-medium">Daily Capacity</span>
                <Clock className="h-4 w-4 text-info" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-text-primary">
                  {stats.dailyStudyHours}h
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">Daily study preference</div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily completion progress bar */}
        <div className="mt-6 pt-4 border-t border-border/60">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-text-muted font-medium">Today&apos;s Progress</span>
            <span className="text-primary font-bold">{stats.dailyCompletionPercentage}%</span>
          </div>
          <Progress value={stats.dailyCompletionPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
