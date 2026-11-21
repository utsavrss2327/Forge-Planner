import "server-only";
import { learningContext } from "./learning";
import { readProfile } from "./profile";
export async function readSubjects(): Promise<string[]> {
  const profile = await readProfile();
  const { db, demo } = await learningContext();
  if (demo) return [...new Set(profile?.preparation_subjects ?? [])];
  const { data, error } = await db
    .from("roadmap_topics")
    .select(
      "subject,roadmap_milestones!inner(roadmap_phases!inner(roadmaps!inner(status)))",
    )
    .eq("roadmap_milestones.roadmap_phases.roadmaps.status", "active");
  if (error?.code !== "42703" && error)
    throw new Error("Your roadmap subjects could not be loaded.");
  return [
    ...new Set([
      ...(profile?.preparation_subjects ?? []),
      ...(data ?? [])
        .map((t: { subject: string | null }) => t.subject as string)
        .filter(Boolean),
    ]),
  ];
}
