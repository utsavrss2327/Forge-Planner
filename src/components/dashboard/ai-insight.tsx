"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Zap, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TopicMastery } from "@/types";

interface AIInsightProps {
  weakTopics?: TopicMastery[];
  streak?: number;
}

export function AIInsight({ weakTopics = [] }: AIInsightProps) {
  const primaryWeakness = weakTopics.filter((t) => t.questions_attempted > 0 && t.score < 60).sort((a, b) => a.score - b.score)[0];

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-surface to-elevated border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Zap className="h-32 w-32 text-primary" fill="currentColor" />
      </div>

      <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="h-3 w-3" />
              Daily Performance Diagnostic
            </span>
            <span className="text-xs text-text-muted">| Based on recorded topic evidence</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-text-primary">
            {primaryWeakness ? `Review ${primaryWeakness.topic}` : "Build evidence of understanding"}
          </h3>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {primaryWeakness
              ? `Your estimated mastery is ${primaryWeakness.score}% across ${primaryWeakness.questions_attempted} questions. Review your mistakes, explain the concept without notes, then retest.`
              : "Save a learning reflection with concepts and confusing topics. Completed videos alone do not establish interview readiness."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/learning">
            <Button size="sm" className="gap-2 font-semibold shadow-md shadow-primary/20">
              <Target className="h-4 w-4" />
              Review Learning Notes
            </Button>
          </Link>
          <Link href="/learning">
            <Button size="sm" variant="outline" className="gap-2">
              Open Learning Hub
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
