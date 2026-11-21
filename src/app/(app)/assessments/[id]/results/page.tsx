import type {
  ExamQuestion,
  Grade,
  LearningSource,
} from "@/lib/assessment/schema";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAssessmentByIdAction } from "../../actions";
export default async function Results({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    data = await getAssessmentByIdAction(id);
  if (!data) notFound();
  if (data.assessment.status !== "evaluated") redirect(`/assessments/${id}`);
  const a = data.assessment;
  const coveredSources = new Set(data.questions.flatMap((q) => q.sourceIds));
  return (
    <div className="space-y-5 max-w-4xl">
      <header className="forge-panel">
        <h1 className="text-3xl font-bold">{a.title}</h1>
        <p className="text-2xl mt-3">
          {a.score}/{a.total_marks} · {a.percentage}%
        </p>
        <p className="text-text-muted">{a.ai_feedback}</p>
      </header>
      <section className="forge-panel">
        <h2 className="font-semibold">Evidence and next steps</h2>
        <p className="text-sm text-text-muted">
          Direct source coverage: {coveredSources.size} of{" "}
          {(a.sources as LearningSource[]).length} learning records referenced
          by questions. A test can cover every subject without testing every
          note.
        </p>
        <p>
          Performed well in this assessment:{" "}
          {a.strengths?.join(", ") || "Not enough evidence yet"}
        </p>
        <p>
          Needs revision:{" "}
          {a.weaknesses?.join(", ") ||
            "No topic below the revision threshold in this test"}
        </p>
        <p className="text-sm text-text-muted">
          Weak questions are queued for revision tomorrow. These scores estimate
          understanding from this sample; they do not certify mastery or hiring
          readiness.
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          <Link className="forge-button-secondary" href="/revision">
            Open revision
          </Link>
          <Link className="forge-button-secondary" href="/assessments/new">
            Generate a fresh retest
          </Link>
        </div>
      </section>
      {(data.questions as ExamQuestion[]).map((q, i) => {
        const answer = data.answers.find((a) => a.question_id === q.id),
          details = answer?.grading_details as Grade | undefined;
        return (
          <section key={q.id} className="forge-panel space-y-3">
            <p className="text-primary">
              {q.subject} · {q.topic} · {answer?.marks_awarded ?? 0}/{q.marks}
            </p>
            <h2 className="font-semibold">
              {i + 1}. {q.question}
            </h2>
            <div>
              <h3 className="font-semibold">Your answer</h3>
              <pre className="whitespace-pre-wrap text-sm">
                {answer?.user_answer || "Not answered"}
              </pre>
            </div>
            <p>{answer?.ai_feedback}</p>
            {details?.criteria?.map((c) => (
              <p key={c.index} className="text-sm">
                {q.rubric[c.index]?.criterion}: {c.points}/
                {q.rubric[c.index]?.points} — {c.reason}
              </p>
            ))}
            {!!details?.missingConcepts?.length && (
              <p>Missing concepts: {details.missingConcepts.join(", ")}</p>
            )}
            <details>
              <summary className="cursor-pointer">
                Expected answer and explanation
              </summary>
              <pre className="text-sm whitespace-pre-wrap mt-2">
                {q.correctAnswer}
              </pre>
              <p className="mt-2 text-sm">{q.explanation}</p>
            </details>
            <details>
              <summary className="cursor-pointer text-sm">
                Learning sources
              </summary>
              {(a.sources as LearningSource[])
                .filter((s) => q.sourceIds.includes(s.id))
                .map((s) => (
                  <p className="text-sm" key={s.id}>
                    {s.title}
                    {s.url && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          className="text-primary underline"
                          href={s.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Review source
                        </a>
                      </>
                    )}
                  </p>
                ))}
            </details>
          </section>
        );
      })}
    </div>
  );
}
