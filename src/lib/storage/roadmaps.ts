import type { Topic } from "@/lib/routine/schema";
import type { Roadmap } from "@/types";
import "server-only";
import { learningContext } from "./learning";
import { getStore } from "./store";
export async function readRoadmaps() {
  const { db, userId, demo } = await learningContext();
  if (demo) return { roadmaps: getStore().roadmaps, topics: [] as Topic[] };
  const [r, t] = await Promise.all([
    db
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    db
      .from("roadmap_topics")
      .select(
        "*,roadmap_milestones!inner(roadmap_phases!inner(roadmaps!inner(status)))",
      )
      .eq("roadmap_milestones.roadmap_phases.roadmaps.status", "active")
      .order("order_index"),
  ]);
  if (r.error || t.error)
    throw new Error(
      "Roadmap data is unavailable. Apply the planning migration and retry.",
    );
  return {
    roadmaps: r.data as Roadmap[],
    topics: t.data.map(
      (t: {
        id: string;
        subject: string | null;
        title: string;
        estimated_hours: number;
        prerequisites: string[];
        resource_url: string | null;
        status: string;
        description: string | null;
      }) => ({
        id: t.id,
        subject: t.subject ?? "Unassigned",
        title: t.title,
        minutes: Math.max(15, Math.round(Number(t.estimated_hours ?? 1) * 60)),
        prerequisites: t.prerequisites ?? [],
        resource: t.resource_url ?? "",
        sourceReference: t.description ?? undefined,
        completed: t.status === "completed",
      }),
    ) as Topic[],
  };
}
