import { AddApplicationDialog } from "@/components/applications/add-application-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { getApplicationsAction } from "./actions";
import { ApplicationsClient } from "./applications-client";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const data = await getApplicationsAction();
  const applications = data.applications;

  const total = applications.length;
  const interviewing = applications.filter(
    (a) => a.status === "interview_scheduled" || a.status === "interviewing",
  ).length;
  const oa = applications.filter(
    (a) => a.status === "online_assessment",
  ).length;
  const offers = applications.filter((a) => a.status === "offer").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-2.5">
            <Briefcase className="h-7 w-7 text-primary" />
            Job Applications CRM
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Track interview rounds, deadlines, online assessments, and referral
            pipelines for target SDE roles.
          </p>
        </div>

        <AddApplicationDialog />
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Total Tracked
            </span>
            <div className="text-2xl font-black text-text-primary mt-1">
              {total}
            </div>
            <span className="text-[11px] text-primary">Applications</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Online Assessments
            </span>
            <div className="text-2xl font-black text-warning mt-1">{oa}</div>
            <span className="text-[11px] text-text-muted">
              Coding Tests Due
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Active Interview Loops
            </span>
            <div className="text-2xl font-black text-primary mt-1">
              {interviewing}
            </div>
            <span className="text-[11px] text-text-muted">Tech Screens</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Offers Received
            </span>
            <div className="text-2xl font-black text-success mt-1">
              {offers}
            </div>
            <span className="text-[11px] text-success font-semibold">
              Accepted / Pending
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Kanban & Table Client */}
      <ApplicationsClient applications={applications} />
    </div>
  );
}
