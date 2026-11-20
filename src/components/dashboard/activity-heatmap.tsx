"use client";

import { useMemo } from "react";
import { shiftDate } from "@/lib/dates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ActivityLog } from "@/types";

interface ActivityHeatmapProps {
  logs: ActivityLog[];
  today: string;
}

export function ActivityHeatmap({ logs, today }: ActivityHeatmapProps) {
  const { days, activityCountByDate, maxCount } = useMemo(() => {
    const dateRange = Array.from({ length: 112 }, (_, i) => shiftDate(today, i - 111));

    const counts: Record<string, number> = {};
    let max = 1;

    for (const log of logs) {
      counts[log.activity_date] = (counts[log.activity_date] || 0) + log.count;
      if (counts[log.activity_date] > max) {
        max = counts[log.activity_date];
      }
    }

    return {
      days: dateRange,
      activityCountByDate: counts,
      maxCount: max,
    };
  }, [logs, today]);

  // Color intensity calculator with red shades
  const getColor = (count: number) => {
    if (count === 0) return "bg-elevated border-border/40";
    const ratio = count / Math.max(maxCount, 4);
    if (ratio < 0.25) return "bg-[#991B1B]/40 border-[#991B1B]/60";
    if (ratio < 0.5) return "bg-[#991B1B] border-[#E11D48]/50";
    if (ratio < 0.75) return "bg-[#E11D48] border-[#FB7185]";
    return "bg-[#FB7185] border-white shadow-sm shadow-primary/30";
  };

  return (
    <Card className="bg-surface border-border">
      <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-text-primary">
            Consistency Heatmap
          </CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Real tracked preparation activities across the past 16 weeks.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-elevated border border-border" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#991B1B]/50" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#E11D48]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#FB7185]" />
          <span>More</span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5">
            {days.map((date) => {
              const dateKey = date;
              const count = activityCountByDate[dateKey] || 0;
              const formattedDate = new Intl.DateTimeFormat("en", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(new Date(date + "T12:00:00Z"));

              return (
                <div
                  key={dateKey}
                  title={`${formattedDate}: ${count} learning activities`}
                  className={`w-3.5 h-3.5 rounded-sm border transition-transform hover:scale-125 cursor-pointer ${getColor(
                    count
                  )}`}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-text-muted mt-3 pt-2 border-t border-border/40">
            <span>16 Weeks Ago</span>
            <span>8 Weeks Ago</span>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
