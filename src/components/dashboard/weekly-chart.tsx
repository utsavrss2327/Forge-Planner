"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function WeeklyChart({ data }: { data: { day: string; plannedHours: number; actualHours: number }[] }) {

  return (
    <Card className="bg-surface border-border">
      <CardHeader className="p-5 pb-2 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-text-primary">
            Weekly Study Consistency
          </CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Task estimates vs. recorded time (hours), grouped by session start date. Running time is excluded.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="day"
                stroke="#71717A"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717A"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141417",
                  border: "1px solid #27272A",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#FAFAFA",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                formatter={(value) => (value === "actualHours" ? "Actual Hours" : "Planned Hours")}
              />
              <Bar dataKey="plannedHours" fill="#27272A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actualHours" fill="#E11D48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
