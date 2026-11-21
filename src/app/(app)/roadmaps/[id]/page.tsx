import { learningContext } from "@/lib/storage/learning";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopicItemClient } from "./topic-item-client";
export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, userId } = await learningContext();
  const { data: r } = await db
    .from("roadmaps")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!r) notFound();
  const { data: phases } = await db
    .from("roadmap_phases")
    .select("id")
    .eq("roadmap_id", id);
  const { data: milestones } = await db
    .from("roadmap_milestones")
    .select("id")
    .in(
      "phase_id",
      (phases ?? []).map((p: { id: string }) => p.id),
    );
  const { data: topics, error } = await db
    .from("roadmap_topics")
    .select("*")
    .in(
      "milestone_id",
      (milestones ?? []).map((m: { id: string }) => m.id),
    )
    .order("order_index");
  if (error) throw new Error("Could not load roadmap topics.");
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">{r.title}</h1>
      <p className="text-text-muted">
        A completed topic records learning progress; assessments provide
        separate understanding evidence.
      </p>
      <Link href="/planner/customize" className="forge-button inline-block">
        Build and customize weekly routine
      </Link>
      {topics?.map(
        (t: import("@/types").RoadmapTopic & { subject: string }) => (
          <div key={t.id} className="forge-panel">
            <p className="text-sm text-primary">
              {t.subject ?? "Assign a subject in a new reviewed plan"}
            </p>
            <h2 className="font-semibold">{t.title}</h2>
            <p>
              {t.estimated_hours} hours · {t.status}
            </p>
            <TopicItemClient topic={t} />
          </div>
        ),
      )}
    </div>
  );
}
