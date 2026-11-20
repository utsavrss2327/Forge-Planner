import Link from "next/link";
import {
  FlaskConical,
  Sparkles,
  Trophy,
  Clock,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAssessmentsDataAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const data = await getAssessmentsDataAction();

  const evaluated = data.assessments.filter((a) => a.status === "evaluated");
  const inProgress = data.assessments.filter((a) => a.status === "in_progress");

  const avgScore =
    evaluated.length > 0
      ? Math.round(
          evaluated.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / evaluated.length
        )
      : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-2.5">
            <FlaskConical className="h-7 w-7 text-primary" />
            AI Assessment Lab
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Grounded 60-minute active recall tests evaluating your retention and reasoning.
          </p>
        </div>

        <Link href="/assessments/new">
          <Button size="lg" className="gap-2 font-bold shadow-lg shadow-primary/20">
            <Sparkles className="h-4 w-4" />
            Generate My 60-Minute Test
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">Tests Evaluated</span>
            <div className="text-2xl font-black text-text-primary mt-1">
              {evaluated.length}
            </div>
            <span className="text-[11px] text-primary">Active Recall</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">Average Score</span>
            <div className="text-2xl font-black text-text-primary mt-1">
              {avgScore}%
            </div>
            <span className="text-[11px] text-success font-semibold">Placement Ready</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">Duration Standard</span>
            <div className="text-2xl font-black text-text-primary mt-1">
              60 <span className="text-xs font-normal text-text-muted">mins</span>
            </div>
            <span className="text-[11px] text-text-muted">OA Conditions</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">Weakness Feedback</span>
            <div className="text-2xl font-black text-text-primary mt-1">
              100%
            </div>
            <span className="text-[11px] text-info">Growth Reports</span>
          </CardContent>
        </Card>
      </div>

      {/* In-Progress Tests Banner (if any) */}
      {inProgress.length > 0 && (
        <Card className="bg-warning/10 border-warning/30 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-xs font-bold text-text-primary">
                You have {inProgress.length} assessment in progress!
              </p>
              <p className="text-[11px] text-text-muted">{inProgress[0].title}</p>
            </div>
          </div>
          <Link href={`/assessments/${inProgress[0].id}`}>
            <Button size="sm" className="gap-1.5 text-xs font-semibold">
              Resume Test
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      )}

      {/* Past Assessments History */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Assessment History & Diagnostics ({evaluated.length})
        </h2>

        <div className="space-y-3">
          {evaluated.length === 0 ? (
            <Card className="bg-surface border-border p-8 text-center space-y-3">
              <FlaskConical className="h-8 w-8 text-text-muted mx-auto" />
              <p className="text-sm font-semibold text-text-primary">No assessments completed yet</p>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                Generate your first 60-minute test from your studied topics and notes to benchmark your readiness.
              </p>
              <Link href="/assessments/new">
                <Button size="sm" className="gap-1.5 font-bold">
                  <Sparkles className="h-4 w-4" />
                  Generate 60-Min Test
                </Button>
              </Link>
            </Card>
          ) : (
            evaluated.map((evalItem) => (
              <Card
                key={evalItem.id}
                className="bg-surface border-border hover:border-border-light transition-all p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {evalItem.subjects?.join(", ") || "General"}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {evalItem.submitted_at?.split("T")[0] || "Recent"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary truncate">
                    {evalItem.title}
                  </h3>

                  <p className="text-xs text-text-muted line-clamp-1">
                    {evalItem.ai_feedback || "Comprehensive active recall diagnostic."}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    <span className="text-text-muted">
                      Score: <span className="font-bold text-text-primary">{evalItem.score}</span> / {evalItem.total_marks}
                    </span>
                    <span className="text-text-muted">
                      Duration: 60 mins
                    </span>
                    {evalItem.weaknesses && evalItem.weaknesses.length > 0 && (
                      <span className="text-primary text-[11px] font-semibold">
                        Gaps: {evalItem.weaknesses.slice(0, 2).join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-2xl font-black text-primary">
                      {evalItem.percentage}%
                    </div>
                    <span className="text-[10px] text-text-muted">Score</span>
                  </div>

                  <Link href={`/assessments/${evalItem.id}/results`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
                      Growth Report
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
