"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Code2,
  CheckCircle2,
  Circle,
  ExternalLink,
  RotateCcw,
  Clock,
  Search,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateDsaProblemStatusAction, toggleDsaRevisionAction } from "./actions";
import type { DSAProblem, Difficulty, DSAProblemStatus } from "@/types";

interface DsaClientProps {
  problems: DSAProblem[];
}

const difficultyBadge: Record<Difficulty, string> = {
  easy: "bg-success/10 border-success/30 text-success",
  medium: "bg-warning/10 border-warning/30 text-warning",
  hard: "bg-primary/10 border-primary/30 text-primary font-bold",
};

export function DsaClient({ problems }: DsaClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDiff, setSelectedDiff] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Extract all distinct topics
  const allTopics = Array.from(new Set(problems.map((p) => p.topic).filter(Boolean))) as string[];

  const filtered = problems.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.topic && p.topic.toLowerCase().includes(search.toLowerCase()));
    const matchesTopic = selectedTopic === "all" || p.topic === selectedTopic;
    const matchesDiff = selectedDiff === "all" || p.difficulty === selectedDiff;
    return matchesSearch && matchesTopic && matchesDiff;
  });

  const handleToggleStatus = async (p: DSAProblem) => {
    setLoadingId(p.id);
    const nextStatus: DSAProblemStatus = p.status === "solved" ? "attempted" : "solved";
    await updateDsaProblemStatusAction(p.id, nextStatus);
    setLoadingId(null);
    router.refresh();
  };

  const handleToggleRevision = async (p: DSAProblem) => {
    setLoadingId(p.id);
    await toggleDsaRevisionAction(p.id);
    setLoadingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <Card className="bg-surface border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problem name or topic..."
              className="pl-9 h-9 text-xs bg-elevated"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="h-9 rounded-md bg-elevated border border-border px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-44"
            >
              <option value="all">All Topics ({problems.length})</option>
              {allTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={selectedDiff}
              onChange={(e) => setSelectedDiff(e.target.value)}
              className="h-9 rounded-md bg-elevated border border-border px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-32"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Problems List */}
      <Card className="bg-surface border-border">
        <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-text-primary">
            Problem Log ({filtered.length})
          </CardTitle>
          <span className="text-xs text-text-muted">
            {problems.filter((p) => p.status === "solved").length} of {problems.length} Solved
          </span>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs">
              No problems match your current search/filter.
            </div>
          ) : (
            filtered.map((prob) => {
              const isSolved = prob.status === "solved";
              const isAttempted = prob.status === "attempted";

              return (
                <div
                  key={prob.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSolved
                      ? "bg-surface/50 border-border/60"
                      : isAttempted
                      ? "bg-elevated border-warning/30"
                      : "bg-elevated border-border"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(prob)}
                      disabled={loadingId === prob.id}
                      className="mt-0.5 text-text-muted hover:text-success transition-colors shrink-0"
                    >
                      {isSolved ? (
                        <CheckCircle2 className="h-5 w-5 text-success fill-success/10" />
                      ) : (
                        <Circle className="h-5 w-5 text-text-muted" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            isSolved ? "text-text-primary" : "text-text-primary"
                          }`}
                        >
                          {prob.name}
                        </span>

                        {prob.url && (
                          <a
                            href={prob.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-muted hover:text-primary transition-colors shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            difficultyBadge[prob.difficulty]
                          }`}
                        >
                          {prob.difficulty}
                        </span>

                        {prob.needs_revision && (
                          <Badge variant="outline" className="text-[10px] text-warning border-warning/40">
                            Needs Revision
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted pt-0.5">
                        <span className="font-medium text-text-secondary">
                          Topic: {prob.topic || "General"}
                        </span>
                        {prob.time_taken_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {prob.time_taken_minutes} mins
                          </span>
                        )}
                        <span>Attempts: {prob.attempts}</span>
                        {prob.date_solved && <span>Solved: {prob.date_solved}</span>}
                      </div>

                      {prob.solution_notes && (
                        <p className="text-xs text-text-secondary pt-1 font-mono text-[11px] bg-surface p-2 rounded border border-border/50">
                          <span className="font-sans font-bold text-text-muted">Approach: </span>
                          {prob.solution_notes}
                        </p>
                      )}

                      {prob.mistakes && (
                        <p className="text-xs text-error/90 pt-0.5 text-[11px]">
                          <span className="font-bold">Tricky Mistake: </span>
                          {prob.mistakes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleRevision(prob)}
                      disabled={loadingId === prob.id}
                      className={`text-xs h-8 gap-1 ${
                        prob.needs_revision ? "border-warning text-warning bg-warning/10" : ""
                      }`}
                    >
                      <RotateCcw className="h-3 w-3" />
                      {prob.needs_revision ? "In Revision Queue" : "Mark for Revision"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
