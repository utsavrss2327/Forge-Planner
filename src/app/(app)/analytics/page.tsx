import { readPlacement } from "@/lib/storage/placement";
export default async function AnalyticsPage() {
  const r = await readPlacement(),
    evaluated = r.assessments.filter((a) => a.status === "evaluated"),
    solved = r.problems.filter((p) => p.status === "solved");
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Preparation evidence</h1>
      <p className="text-text-muted">
        Completion is separate from understanding. There is no single
        hiring-readiness percentage.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="forge-panel">
          <h2 className="font-semibold">DSA practice</h2>
          <p>
            {solved.length} self-reported solved / {r.problems.length} recorded
            problems
          </p>
          <p className="text-sm text-text-muted">
            Code execution and external platform verification are not enabled.
          </p>
        </div>
        <div className="forge-panel">
          <h2 className="font-semibold">Assessment evidence</h2>
          <p>{evaluated.length} evaluated tests</p>
          <p>
            {evaluated.length
              ? `${Math.round(evaluated.reduce((n, a) => n + Number(a.percentage ?? 0), 0) / evaluated.length)}% mean score`
              : "Insufficient evidence"}
          </p>
        </div>
        <div className="forge-panel">
          <h2 className="font-semibold">Revision</h2>
          <p>
            {r.revisions.filter((i) => i.status === "active").length} active
            review items
          </p>
          <p>
            {r.revisions.filter((i) => i.repetitions > 0).length} reviewed at
            least once
          </p>
        </div>
      </div>
      <section className="forge-panel space-y-3">
        <h2 className="text-xl font-semibold">Topic evidence</h2>
        {!r.mastery.length && (
          <p>Take a sourced assessment to build evidence.</p>
        )}
        {r.mastery.map((m) => (
          <div key={m.id} className="border-t border-border pt-3">
            <h3>
              {m.subject} · {m.topic}
            </h3>
            <p>
              {m.score}% mean rubric score · {m.questions_attempted} question
              samples · last assessed{" "}
              {m.last_assessed_at?.slice(0, 10) ?? "never"}
            </p>
            <p className="text-sm text-text-muted">
              {m.questions_attempted < 3
                ? "Limited sample — retest before drawing conclusions."
                : m.score < 60
                  ? "Repeated assessment evidence suggests revision."
                  : "Continue retesting after a delay."}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
