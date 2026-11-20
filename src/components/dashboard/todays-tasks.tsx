"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shiftDate, studyDate } from "@/lib/dates";
import { updateTaskStatusAction, rescheduleTaskAction } from "@/app/(app)/dashboard/actions";
import type { DailyTask, TaskPriority, TaskStatus } from "@/types";

interface TodaysTasksProps {
  tasks: DailyTask[];
  today?: string;
  title?: string;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-surface border-border text-text-muted",
  medium: "bg-elevated border-border-light text-text-secondary",
  high: "bg-warning/10 border-warning/30 text-warning",
  critical: "bg-primary/10 border-primary/30 text-primary font-bold",
};

export function TodaysTasks({ tasks, today, title }: TodaysTasksProps) {
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setLoadingId(taskId);
    setError("");
    try { const result = await updateTaskStatusAction(taskId, newStatus); if (result.error) setError(result.error); }
    catch { setError("Task could not be updated. Please retry."); } finally { setLoadingId(null); }
  };

  const handleRescheduleTomorrow = async (taskId: string) => {
    setLoadingId(taskId); setError("");
    try { const result = await rescheduleTaskAction(taskId, shiftDate(today ?? studyDate(), 1)); if (result.error) setError(result.error); }
    catch { setError("Task could not be moved. Please retry."); } finally { setLoadingId(null); }
  };

  return (
    <Card className="bg-surface border-border">
      <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
            {title ?? "Today’s actionable tasks"}
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Complete sequentially to maintain study discipline.
          </p>
        </div>
        <Link href="/planner">
          <Button variant="ghost" size="sm" className="text-xs text-text-secondary hover:text-text-primary">
            Open Planner
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-3 sm:p-5 space-y-2.5">
        {error && <p role="alert" className="rounded border border-primary p-3 text-sm text-primary">{error}</p>}
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-xs">
            No tasks scheduled for today. Generate roadmap tasks or create new study items in Planner.
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === "completed";
            const isInProgress = task.status === "in_progress";
            const isLoading = loadingId === task.id;

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted
                    ? "bg-surface/50 border-border/50 opacity-60"
                    : isInProgress
                    ? "bg-elevated border-primary/40 shadow-sm shadow-primary/5"
                    : "bg-elevated border-border hover:border-border-light"
                }`}
              >
                {/* Left: Task info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() =>
                      handleStatusChange(task.id, isCompleted ? "pending" : "completed")
                    }
                    disabled={isLoading}
                    aria-label={`${isCompleted ? "Reopen" : "Complete"} ${task.title}`}
                    className="mt-0.5 text-text-muted hover:text-primary transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-success fill-success/10" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isCompleted ? "line-through text-text-muted" : "text-text-primary"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.source_url && (
                        <a
                          href={task.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-primary transition-colors shrink-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-text-muted line-clamp-1">
                      {task.description || "Core placement requirement"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {task.subject && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0">
                          {task.subject}
                        </Badge>
                      )}
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.estimated_minutes} mins planned · {task.actual_minutes ?? 0} recorded
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          priorityColors[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {!isCompleted && !isInProgress && task.status !== "skipped" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(task.id, "in_progress")}
                      disabled={isLoading}
                      className="h-8 text-xs gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Start
                    </Button>
                  )}

                  {isInProgress && <Button size="sm" variant="outline" disabled={isLoading} onClick={() => handleStatusChange(task.id, "pending")} className="h-8 text-xs gap-1"><Pause className="h-3 w-3" />Pause</Button>}
                  {isInProgress && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(task.id, "completed")}
                      disabled={isLoading}
                      className="h-8 text-xs gap-1 bg-success hover:bg-success/90 text-white"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Complete
                    </Button>
                  )}

                  {!isCompleted && <Button size="sm" variant="ghost" disabled={isLoading} onClick={() => handleStatusChange(task.id, task.status === "skipped" ? "pending" : "skipped")} className="h-8 text-xs">{task.status === "skipped" ? "Reopen" : "Skip"}</Button>}
                  {!isCompleted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRescheduleTomorrow(task.id)}
                      disabled={isLoading}
                      className="h-8 text-xs text-text-muted hover:text-text-primary"
                      title="Reschedule for tomorrow"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
