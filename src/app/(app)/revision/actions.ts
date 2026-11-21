"use server";
import { studyDate } from "@/lib/dates";
import { learningContext } from "@/lib/storage/learning";
import { readPlacement } from "@/lib/storage/placement";
import { readProfile } from "@/lib/storage/profile";
import { revalidatePath } from "next/cache";
export async function getRevisionDataAction() {
  const r = await readPlacement(),
    p = await readProfile(),
    today = studyDate(p?.timezone);
  return {
    dueItems: r.revisions.filter(
      (i) => i.status === "active" && i.next_review_date <= today,
    ),
    upcomingItems: r.revisions.filter(
      (i) => i.status === "active" && i.next_review_date > today,
    ),
    allCount: r.revisions.length,
    completedToday: r.revisions.filter(
      (i) =>
        studyDate(p?.timezone, new Date(i.updated_at)) === today &&
        i.repetitions > 0,
    ).length,
  };
}
export async function rateRevisionItemAction(id: string, quality: number) {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5)
    return { error: "Rate recall from 0 to 5." };
  const { db } = await learningContext();
  const { data, error } = await db.rpc("rate_revision", {
    target: id,
    quality,
  });
  if (error) return { error: "Review not saved. Reload and retry." };
  revalidatePath("/revision");
  return { success: true, nextDate: data as string };
}
