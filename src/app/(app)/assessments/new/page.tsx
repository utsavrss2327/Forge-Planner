export const maxDuration = 120;
import { AssessmentBuilder } from "@/components/assessment/builder";
import { studyDate } from "@/lib/dates";
import { readProfile } from "@/lib/storage/profile";
export default async function NewAssessmentPage() {
  const profile = await readProfile();
  return <AssessmentBuilder today={studyDate(profile?.timezone)} />;
}
