"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ExternalLink,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateApplicationStatusAction } from "./actions";
import { APPLICATION_STATUSES } from "@/lib/constants";
import type { JobApplication, ApplicationStatus } from "@/types";

interface ApplicationsClientProps {
  applications: JobApplication[];
}

const statusColors: Record<ApplicationStatus, string> = {
  saved: "border-border text-text-muted bg-surface",
  applied: "border-info/30 text-info bg-info/10",
  online_assessment: "border-warning/30 text-warning bg-warning/10",
  interview_scheduled: "border-primary/40 text-primary bg-primary/10 font-bold",
  interviewing: "border-primary/40 text-primary bg-primary/10 font-bold",
  offer: "border-success/40 text-success bg-success/10 font-black",
  rejected: "border-border text-text-muted bg-surface/40",
  withdrawn: "border-border text-text-muted bg-surface/40",
};

export function ApplicationsClient({ applications }: ApplicationsClientProps) {
  const router = useRouter();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setLoadingId(appId);
    await updateApplicationStatusAction(appId, newStatus);
    setLoadingId(null);
    router.refresh();
  };

  const columns: { label: string; status: ApplicationStatus }[] = [
    { label: "Saved", status: "saved" },
    { label: "Applied", status: "applied" },
    { label: "Online Assessment", status: "online_assessment" },
    { label: "Interviewing", status: "interview_scheduled" },
    { label: "Offer", status: "offer" },
    { label: "Archived / Rejected", status: "rejected" },
  ];

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "table")}>
          <TabsList className="bg-surface border border-border">
            <TabsTrigger value="kanban" className="text-xs">
              Kanban Pipeline
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs">
              Table Overview
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <span className="text-xs text-text-muted">
          {applications.length} Active Target Opportunities
        </span>
      </div>

      {/* KANBAN BOARD */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-start">
          {columns.map((col) => {
            const colApps = applications.filter((a) => {
              if (col.status === "interview_scheduled") {
                return a.status === "interview_scheduled" || a.status === "interviewing";
              }
              if (col.status === "rejected") {
                return a.status === "rejected" || a.status === "withdrawn";
              }
              return a.status === col.status;
            });

            return (
              <div
                key={col.status}
                className="bg-surface border border-border rounded-xl p-3 space-y-3 min-h-[360px]"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide truncate">
                    {col.label}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                    {colApps.length}
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {colApps.map((app) => (
                    <Card
                      key={app.id}
                      className="bg-elevated border-border hover:border-primary/40 transition-all p-3.5 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-text-primary truncate">
                            {app.company}
                          </h4>
                          <p className="text-xs text-text-secondary truncate font-medium">
                            {app.role}
                          </p>
                        </div>
                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-muted hover:text-primary transition-colors shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      {app.salary_range && (
                        <div className="text-[11px] font-semibold text-primary">
                          {app.salary_range}
                        </div>
                      )}

                      {app.location && (
                        <div className="text-[11px] text-text-muted flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{app.location}</span>
                        </div>
                      )}

                      {app.referral_status && (
                        <div className="text-[10px] bg-surface px-2 py-0.5 rounded border border-border text-text-secondary truncate">
                          Ref: {app.referral_status}
                        </div>
                      )}

                      {/* Quick Move Dropdown */}
                      <div className="pt-2 border-t border-border/60">
                        <select
                          value={app.status}
                          disabled={loadingId === app.id}
                          onChange={(e) =>
                            handleStatusChange(app.id, e.target.value as ApplicationStatus)
                          }
                          className="w-full text-[11px] h-7 rounded bg-surface border border-border px-2 text-text-muted focus:outline-none focus:ring-1 focus:ring-primary capitalize"
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              Move to {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <Card className="bg-surface border-border overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-elevated border-b border-border text-text-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5 pl-5">Company & Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Compensation</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Referral</th>
                  <th className="p-3.5">Deadline</th>
                  <th className="p-3.5 pr-5">Quick Move</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-elevated/40 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="font-bold text-text-primary">{app.company}</div>
                      <div className="text-text-muted text-[11px]">{app.role}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          statusColors[app.status]
                        }`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-primary">
                      {app.salary_range || "—"}
                    </td>
                    <td className="p-3.5 text-text-muted">{app.location || "—"}</td>
                    <td className="p-3.5 text-text-muted">{app.referral_status || "Direct"}</td>
                    <td className="p-3.5 text-text-muted">{app.deadline || "Open"}</td>
                    <td className="p-3.5 pr-5">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value as ApplicationStatus)
                        }
                        className="text-xs h-8 rounded bg-elevated border border-border px-2 text-text-primary"
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
