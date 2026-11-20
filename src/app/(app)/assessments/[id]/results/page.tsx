import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Trophy,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAssessmentByIdAction } from "../../actions";

export const dynamic = "force-dynamic";

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;
  const data = await getAssessmentByIdAction(id);

  if (!data) notFound();

  const { assessment, questions, answers } = data;
  const score = assessment.score || 0;
  const totalMarks = assessment.total_marks || 30;
  const percentage = assessment.percentage || 0;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner Card */}
      <Card className="bg-gradient-to-br from-surface via-elevated to-surface border-border overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="default" className="text-xs px-2.5 py-1 font-bold">
                Assessment Evaluated
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary">
                Performance Diagnostic: {assessment.title}
              </h1>
              <p className="text-xs sm:text-sm text-text-muted">
                Completed on {assessment.submitted_at?.split("T")[0] || "Today"} · 60 Minutes
              </p>
            </div>

            <div className="text-center sm:text-right shrink-0 bg-surface/80 p-4 rounded-2xl border border-border">
              <div className="text-4xl font-black text-primary">{percentage}%</div>
              <div className="text-xs text-text-muted mt-1">
                Score: {score} / {totalMarks} Marks
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-elevated border border-border text-xs text-text-secondary leading-relaxed">
            <span className="font-bold text-text-primary">AI Examiner Summary: </span>
            {assessment.ai_feedback || "Demonstrated solid understanding of core concepts."}
          </div>
        </CardContent>
      </Card>

      {/* AI Growth Report */}
      <Card className="bg-surface border-border">
        <CardHeader className="p-6 pb-3 border-b border-border">
          <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Growth Diagnostic & Next Action Plan
          </CardTitle>
          <p className="text-xs text-text-muted">
            The feedback loop: Learn → Test → Analyze → Revise → Retest → Improve.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-success/5 border border-success/20 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-success flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="h-4 w-4 text-success" />
                What You Mastered Well
              </h4>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                {assessment.strengths && assessment.strengths.length > 0 ? (
                  assessment.strengths.map((s) => <li key={s}>{s}</li>)
                ) : (
                  <li>Fundamental concept recall</li>
                )}
              </ul>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Knowledge Gaps Detected
              </h4>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                {assessment.weaknesses && assessment.weaknesses.length > 0 ? (
                  assessment.weaknesses.map((w) => <li key={w}>{w}</li>)
                ) : (
                  <li>None! Perfect score achieved.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-elevated border border-border space-y-2 text-xs">
            <h4 className="font-bold text-text-primary flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-warning" />
              Adaptive Plan Adjustment: Automatic Revision Queued
            </h4>
            <p className="text-text-muted leading-relaxed">
              We have automatically scheduled spaced repetition flashcards for your identified gaps (
              {assessment.weaknesses?.join(", ") || "Topics"}) into your Revision Center.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/revision">
              <Button size="sm" className="gap-2 font-semibold">
                <RotateCcw className="h-3.5 w-3.5" />
                Start Queued Revision
              </Button>
            </Link>
            <Link href="/assessments/new">
              <Button size="sm" variant="outline" className="gap-2">
                Generate Another Assessment
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="gap-2">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Per-Question Detailed Review */}
      <Card className="bg-surface border-border">
        <CardHeader className="p-6 pb-3 border-b border-border">
          <CardTitle className="text-base font-bold text-text-primary">
            Question-by-Question Rubric Evaluation ({questions.length})
          </CardTitle>
          <p className="text-xs text-text-muted">
            Compare your submitted answers with expected rubrics and explanations.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {questions.map((q, idx) => {
            const answer = answers.find((a) => a.question_id === q.id);
            const isCorrect = answer?.is_correct ?? false;

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-elevated border border-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">
                      Question {idx + 1} ({q.marks} Marks)
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {q.section.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isCorrect ? (
                      <span className="text-success flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Correct (+{answer?.marks_awarded ?? q.marks})
                      </span>
                    ) : (
                      <span className="text-error flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        Incorrect (0/{q.marks})
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-medium text-text-primary leading-relaxed">
                  {q.question_text}
                </p>

                {answer?.user_answer && (
                  <div className="p-2.5 rounded-lg bg-surface text-xs text-text-secondary border border-border">
                    <span className="font-semibold text-text-muted">Your Submitted Answer: </span>
                    <span className="text-text-primary">{answer.user_answer}</span>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-primary/5 text-xs text-text-secondary border border-primary/20 space-y-1">
                  <div>
                    <span className="font-bold text-primary">Ideal Solution: </span>
                    <span className="text-text-primary">{q.correct_answer}</span>
                  </div>
                  {q.explanation && (
                    <div className="text-[11px] text-text-muted">
                      <span className="font-semibold">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
