import Link from "next/link";
import { getAssessmentsDataAction } from "./actions";
export default async function AssessmentsPage() {
  const assessments = await getAssessmentsDataAction();
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">AI Assessment Lab</h1>
      <p className="text-text-muted">
        Test understanding across your studied subjects. Scores are learning
        evidence, not a placement-readiness guarantee.
      </p>
      <Link className="forge-button inline-block" href="/assessments/new">
        Build a sourced 60-minute assessment
      </Link>
      {!assessments.length && (
        <p className="forge-panel">
          No assessments yet. Save notes and topics from your learning first.
        </p>
      )}
      {assessments.map((a) => (
        <Link
          key={a.id}
          href={
            a.status === "evaluated"
              ? `/assessments/${a.id}/results`
              : `/assessments/${a.id}`
          }
          className="forge-panel block"
        >
          <h2 className="font-semibold">{a.title}</h2>
          <p className="text-sm text-text-muted">
            {a.subjects.join(" · ")} · {a.status}
            {a.status === "evaluated" ? ` · ${a.percentage}%` : ""}
          </p>
        </Link>
      ))}
    </div>
  );
}
