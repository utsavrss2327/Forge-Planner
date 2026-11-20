"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RotateCcw, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateDailyTasksFromRoadmapAction, rebalanceRoadmapAction } from "../actions";

export function RoadmapActionsClient({ roadmapId }: { roadmapId: string }) {
  const router = useRouter();
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingRebalance, setLoadingRebalance] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerateTasks = async () => {
    setLoadingTasks(true);
    setMessage(null);
    const res = await generateDailyTasksFromRoadmapAction(roadmapId);
    setLoadingTasks(false);
    if (res?.success) {
      setMessage(`Scheduled ${res.tasksCreated} roadmap tasks into Daily Planner!`);
      router.refresh();
    }
  };

  const handleRebalance = async () => {
    setLoadingRebalance(true);
    setMessage(null);
    const res = await rebalanceRoadmapAction(roadmapId);
    setLoadingRebalance(false);
    if (res?.success) {
      setMessage(`Roadmap rebalanced! ${res.rebalancedTasks} tasks rescheduled.`);
      router.refresh();
    }
  };

  return (
    <div className="space-y-2 shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={handleGenerateTasks}
          disabled={loadingTasks || loadingRebalance}
          className="gap-1.5 font-semibold text-xs h-9"
        >
          <Calendar className="h-3.5 w-3.5" />
          {loadingTasks ? "Generating Schedule..." : "Generate Daily Tasks"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRebalance}
          disabled={loadingTasks || loadingRebalance}
          className="gap-1.5 font-semibold text-xs h-9 text-primary border-primary/30 hover:bg-primary/10"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {loadingRebalance ? "Rebalancing..." : "Rebalance My Roadmap"}
        </Button>
      </div>

      {message && (
        <div className="text-[11px] text-success font-medium flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {message}
        </div>
      )}
    </div>
  );
}
