import { Code2, Target, CheckCircle2, Clock, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDsaDataAction } from "./actions";
import { AddProblemDialog } from "@/components/dsa/add-problem-dialog";
import { DsaClient } from "./dsa-client";

export const dynamic = "force-dynamic";

export default async function DsaPage() {
  const data = await getDsaDataAction();
  const problems = data.problems;

  const totalSolved = problems.filter((p) => p.status === "solved").length;
  const easySolved = problems.filter((p) => p.difficulty === "easy" && p.status === "solved").length;
  const medSolved = problems.filter((p) => p.difficulty === "medium" && p.status === "solved").length;
  const hardSolved = problems.filter((p) => p.difficulty === "hard" && p.status === "solved").length;
  const needsRevision = problems.filter((p) => p.needs_revision).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-2.5">
            <Code2 className="h-7 w-7 text-primary" />
            DSA Interview Practice Tracker
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Track high-frequency LeetCode & interview problems, solutions, invariants, and revision queues.
          </p>
        </div>

        <AddProblemDialog />
      </div>

      {/* Difficulty Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">Total Solved</span>
            <div className="text-2xl font-black text-text-primary mt-1">
              {totalSolved} <span className="text-xs font-normal text-text-muted">/ {problems.length}</span>
            </div>
            <span className="text-[11px] text-primary">Target: 450+ SDE-1</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">Easy Problems</span>
            <div className="text-2xl font-black text-success mt-1">{easySolved}</div>
            <span className="text-[11px] text-text-muted">Fundamentals</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">Medium Problems</span>
            <div className="text-2xl font-black text-warning mt-1">{medSolved}</div>
            <span className="text-[11px] text-text-muted">High Frequency OA/Loop</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">Hard & Revisions</span>
            <div className="text-2xl font-black text-primary mt-1">
              {hardSolved} <span className="text-xs font-normal text-warning">({needsRevision} review)</span>
            </div>
            <span className="text-[11px] text-text-muted">Google / Meta Benchmark</span>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Problems Workspace */}
      <DsaClient problems={problems} />
    </div>
  );
}
