"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Flag,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Code,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { submitAssessmentAction } from "../actions";
import type { Assessment, AssessmentQuestion } from "@/types";

interface TestRunnerClientProps {
  assessment: Assessment;
  questions: AssessmentQuestion[];
}

export function TestRunnerClient({ assessment, questions }: TestRunnerClientProps) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load / save local storage autosave
  useEffect(() => {
    const saved = localStorage.getItem(`forge_eval_${assessment.id}`);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch (e) {}
    }
  }, [assessment.id]);

  const updateAnswer = (val: string) => {
    const updated = { ...answers, [currentIdx]: val };
    setAnswers(updated);
    localStorage.setItem(`forge_eval_${assessment.id}`, JSON.stringify(updated));
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
  };

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    localStorage.removeItem(`forge_eval_${assessment.id}`);
    await submitAssessmentAction(assessment.id, answers);
  };

  const currentQ = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const isFirst = currentIdx === 0;

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[parseInt(k, 10)]?.trim().length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Fixed Exam Banner */}
      <div className="bg-surface border border-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 sticky top-16 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-xs px-2.5 py-1 font-bold">
            60-Min Assessment
          </Badge>
          <span className="text-sm font-bold text-text-primary hidden sm:inline truncate max-w-sm">
            {assessment.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border ${
              timeLeft < 300
                ? "bg-error/10 border-error/30 text-error animate-pulse"
                : "bg-elevated border-border text-text-primary"
            }`}
          >
            <Clock className="h-4 w-4 text-primary" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <Button
            size="sm"
            onClick={() => setShowConfirm(true)}
            className="gap-1.5 font-bold bg-success hover:bg-success/90 text-white"
          >
            <CheckCircle2 className="h-4 w-4" />
            Submit Test ({answeredCount}/{questions.length})
          </Button>
        </div>
      </div>

      {/* Main Runner Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Question area (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {currentQ ? (
            <Card className="bg-surface border-border">
              <CardHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-bold uppercase">
                      Section: {currentQ.section.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      Difficulty: {currentQ.difficulty.toUpperCase()} · Marks: {currentQ.marks}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-text-primary pt-1">
                    Question {currentIdx + 1} of {questions.length}
                  </CardTitle>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFlag}
                  className={`gap-1.5 text-xs ${
                    flagged[currentIdx] ? "border-warning text-warning bg-warning/10" : ""
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {flagged[currentIdx] ? "Flagged" : "Flag"}
                </Button>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Question Prompt */}
                <div className="text-sm sm:text-base font-medium text-text-primary leading-relaxed whitespace-pre-wrap">
                  {currentQ.question_text}
                </div>

                {/* Question Type Input */}
                {currentQ.question_type === "mcq" && currentQ.options && (
                  <div className="space-y-2.5 pt-2">
                    {currentQ.options.map((opt) => {
                      const isSelected = answers[currentIdx] === opt.label;
                      return (
                        <div
                          key={opt.label}
                          onClick={() => updateAnswer(opt.label)}
                          className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? "bg-primary/10 border-primary text-text-primary font-semibold ring-1 ring-primary"
                              : "bg-elevated border-border text-text-secondary hover:border-border-light hover:text-text-primary"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                              isSelected
                                ? "bg-primary text-white border-primary"
                                : "bg-surface border-border text-text-muted"
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQ.question_type === "short_answer" && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs text-text-secondary font-medium">
                      Your Conceptual Explanation (Provide clear reasoning & trade-offs):
                    </label>
                    <Textarea
                      rows={6}
                      value={answers[currentIdx] || ""}
                      onChange={(e) => updateAnswer(e.target.value)}
                      placeholder="Write your explanation in your own words. Emphasize invariants, trade-offs, and boundary conditions..."
                      className="bg-elevated text-sm leading-relaxed"
                    />
                  </div>
                )}

                {currentQ.question_type === "coding" && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Code className="h-4 w-4 text-primary" />
                        Code Editor (C++ / Java / Python / JavaScript)
                      </span>
                      <span className="text-[11px] text-text-muted">Autosaved</span>
                    </div>
                    <Textarea
                      rows={14}
                      value={answers[currentIdx] || ""}
                      onChange={(e) => updateAnswer(e.target.value)}
                      placeholder={`// Write your clean solution here\nint searchRotated(vector<int>& nums, int target) {\n    int low = 0, high = nums.size() - 1;\n    while (low <= high) {\n        // ...\n    }\n    return -1;\n}`}
                      className="bg-elevated font-mono text-xs leading-normal"
                    />
                  </div>
                )}

                {/* Bottom navigation */}
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                    disabled={isFirst}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      if (isLast) setShowConfirm(true);
                      else setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1));
                    }}
                    className="gap-1.5 font-semibold"
                  >
                    {isLast ? "Review & Submit" : "Next Question"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-8 text-center text-text-muted">No questions available.</div>
          )}
        </div>

        {/* Right: Question Navigation Palette (1 col) */}
        <div className="space-y-4">
          <Card className="bg-surface border-border p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Question Navigator
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = currentIdx === idx;
                const hasAnswer = answers[idx]?.trim().length > 0;
                const isFlagged = flagged[idx];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all relative border ${
                      isCurrent
                        ? "border-primary ring-2 ring-primary text-text-primary bg-primary/20"
                        : hasAnswer
                        ? "bg-success/20 border-success/40 text-success"
                        : "bg-elevated border-border text-text-muted hover:border-border-light"
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border/60 space-y-2 text-[11px] text-text-muted">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-success/20 border border-success/40" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-elevated border border-border" />
                <span>Unanswered ({questions.length - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-warning" />
                <span>Flagged for Review</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-surface border-border max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Submit Assessment?
            </h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              You have answered <span className="text-text-primary font-bold">{answeredCount}</span> of{" "}
              <span className="text-text-primary font-bold">{questions.length}</span> questions.
              Once submitted, the AI Examiner will evaluate your answers against strict placement rubrics.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Back to Test
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2 font-bold bg-success hover:bg-success/90 text-white"
              >
                {submitting ? "Grading Answers..." : "Confirm & Submit"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
