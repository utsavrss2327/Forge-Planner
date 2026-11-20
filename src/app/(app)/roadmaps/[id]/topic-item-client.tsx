"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, Play } from "lucide-react";
import { updateTopicStatusAction } from "../actions";
import type { RoadmapTopic } from "@/types";

export function TopicItemClient({ topic }: { topic: RoadmapTopic }) {
  const router = useRouter();
  const [status, setStatus] = useState(topic.status);
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    let nextStatus: "pending" | "in_progress" | "completed" = "in_progress";
    if (status === "pending") nextStatus = "in_progress";
    else if (status === "in_progress") nextStatus = "completed";
    else nextStatus = "pending";

    setStatus(nextStatus);
    await updateTopicStatusAction(topic.id, nextStatus);
    setLoading(false);
    router.refresh();
  };

  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";

  return (
    <div
      onClick={toggleStatus}
      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-3 ${
        isCompleted
          ? "bg-surface/50 border-border/50 opacity-60"
          : isInProgress
          ? "bg-elevated border-primary/40 shadow-sm shadow-primary/5"
          : "bg-elevated border-border hover:border-border-light"
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <button
          type="button"
          disabled={loading}
          className="mt-0.5 text-text-muted shrink-0 transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-success fill-success/10" />
          ) : isInProgress ? (
            <Play className="h-4 w-4 text-primary fill-primary/10" />
          ) : (
            <Circle className="h-4 w-4 text-text-muted" />
          )}
        </button>

        <div className="space-y-0.5 min-w-0">
          <p
            className={`text-xs font-semibold truncate ${
              isCompleted ? "line-through text-text-muted" : "text-text-primary"
            }`}
          >
            {topic.title}
          </p>
          {topic.description && (
            <p className="text-[11px] text-text-muted line-clamp-1">{topic.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-text-muted">
        <Clock className="h-3 w-3" />
        <span>{topic.estimated_hours}h</span>
      </div>
    </div>
  );
}
