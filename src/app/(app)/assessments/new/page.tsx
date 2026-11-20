"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  FlaskConical,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateDailyAssessmentAction } from "../actions";

export default function NewAssessmentPage() {
  const [generating, setGenerating] = useState(false);

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div>
        <Link href="/assessments">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-text-muted hover:text-text-primary">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Assessment Lab
          </Button>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-2.5">
          <Sparkles className="h-7 w-7 text-primary" />
          Generate Personalized 60-Minute Test
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Active recall is the proven difference between superficial familiarity and interview mastery.
        </p>
      </div>

      {/* Test Composition Spec Card */}
      <Card className="bg-surface border-border">
        <CardHeader className="p-6 pb-3 border-b border-border">
          <CardTitle className="text-base font-bold text-text-primary flex items-center justify-between">
            <span>Assessment Blueprint (60 Minutes)</span>
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              Exam Mode
            </Badge>
          </CardTitle>
          <p className="text-xs text-text-muted">
            The assessment will be synthesized automatically from your real daily learning material.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-elevated p-4 rounded-xl border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-bold text-primary">Section A</span>
                <span>15 mins</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary">Concept Recall</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                10 Multiple Choice Questions testing definitions, boundary values, invariants, and time complexities.
              </p>
            </div>

            <div className="bg-elevated p-4 rounded-xl border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-bold text-primary">Section B</span>
                <span>15 mins</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary">Conceptual Depth</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                3 Short-Answer Questions testing trade-offs, proofs, and theoretical scenarios (e.g. BCNF vs 3NF).
              </p>
            </div>

            <div className="bg-elevated p-4 rounded-xl border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-bold text-primary">Section C</span>
                <span>30 mins</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary">Practical Challenge</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                2 Coding or Scenario Problems. Implement algorithms with clean time/space bounds.
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Grounded in Your Real Activity
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              We gather your completed YouTube videos, daily learning reflections, and previously detected weak concepts. Questions are tailored specifically to stress-test your retention.
            </p>
          </div>

          <form action={generateDailyAssessmentAction} onSubmit={() => setGenerating(true)} className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={generating}
              className="w-full gap-2 font-black text-sm h-12 shadow-lg shadow-primary/20"
            >
              {generating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Generating 60-Minute Assessment via AI Examiner...
                </>
              ) : (
                <>
                  Launch 60-Minute Assessment Now
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
