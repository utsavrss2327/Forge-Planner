import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";
import { getRevisionDataAction } from "./actions";
import { RevisionClient } from "./revision-client";

export const dynamic = "force-dynamic";

export default async function RevisionPage() {
  const data = await getRevisionDataAction();

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-2.5">
          <RotateCcw className="h-7 w-7 text-primary" />
          Spaced Repetition & Revision Center
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Review concepts at algorithmically scheduled intervals (1d, 3d, 7d,
          14d, 30d) to ensure permanent memory.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Due Today
            </span>
            <div className="text-2xl font-black text-primary mt-1">
              {data.dueItems.length}
            </div>
            <span className="text-[11px] text-text-muted">Requires Recall</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Reviewed Today
            </span>
            <div className="text-2xl font-black text-success mt-1">
              {data.completedToday}
            </div>
            <span className="text-[11px] text-text-muted">SM-2 Calibrated</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Upcoming Queue
            </span>
            <div className="text-2xl font-black text-text-primary mt-1">
              {data.upcomingItems.length}
            </div>
            <span className="text-[11px] text-text-muted">
              Future Intervals
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Algorithm
            </span>
            <div className="text-2xl font-black text-text-primary mt-1">
              SM-2
            </div>
            <span className="text-[11px] text-primary">Adaptive Ease</span>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Review Workspace */}
      <RevisionClient
        dueItems={data.dueItems}
        upcomingItems={data.upcomingItems}
      />
    </div>
  );
}
