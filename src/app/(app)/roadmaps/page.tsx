import { readRoadmaps } from "@/lib/storage/roadmaps";
import Link from "next/link";
export default async function RoadmapsPage() {
  const { roadmaps } = await readRoadmaps();
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My roadmaps</h1>
          <p className="text-text-muted">
            Review learning objectives before scheduling them.
          </p>
        </div>
        <Link className="forge-button" href="/roadmaps/new">
          Create or import roadmap
        </Link>
      </header>
      <Link className="text-primary underline" href="/planner/customize">
        Open weekly routine editor
      </Link>
      {!roadmaps.length && (
        <p className="forge-panel">
          No roadmap yet. Paste your plan, create topics manually, or request an
          AI proposal.
        </p>
      )}
      {roadmaps.map((r) => (
        <Link
          className="forge-panel block"
          href={`/roadmaps/${r.id}`}
          key={r.id}
        >
          <h2 className="font-semibold">{r.title}</h2>
          <p className="text-sm text-text-muted">
            {r.status} · {r.total_tasks ?? 0} learning objectives
          </p>
        </Link>
      ))}
    </div>
  );
}
