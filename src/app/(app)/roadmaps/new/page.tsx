export const maxDuration = 120;
import { RoadmapEditor } from "@/components/routine/roadmap-editor";
import { readProfile } from "@/lib/storage/profile";
export default async function NewRoadmapPage() {
  const profile = await readProfile();
  return <RoadmapEditor subjects={profile?.preparation_subjects ?? []} />;
}
