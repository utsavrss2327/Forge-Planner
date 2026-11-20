"use server";

import { revalidatePath } from "next/cache";
import { getStore, saveStore } from "@/lib/storage/store";
import { performanceAnalyst } from "@/lib/ai";
import type { RevisionItem } from "@/types";

export async function getRevisionDataAction() {
  const store = getStore();
  const today = new Date().toISOString().split("T")[0];

  const dueItems = store.revisionItems.filter(
    (item) => item.next_review_date <= today && item.status === "active"
  );
  const upcomingItems = store.revisionItems.filter(
    (item) => item.next_review_date > today && item.status === "active"
  );

  return {
    dueItems,
    upcomingItems,
    allCount: store.revisionItems.length,
    completedToday: store.revisionItems.filter((i) => i.updated_at.startsWith(today) && i.repetitions > 0).length,
  };
}

export async function rateRevisionItemAction(itemId: string, quality: number) {
  const store = getStore();
  const item = store.revisionItems.find((r) => r.id === itemId);
  if (!item) return { error: "Item not found" };

  const { newInterval, newEaseFactor } = performanceAnalyst.calculateSpacedRepetitionInterval(
    item.interval_days,
    quality,
    item.ease_factor
  );

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  item.interval_days = newInterval;
  item.ease_factor = newEaseFactor;
  item.repetitions += 1;
  item.last_quality = quality;
  item.next_review_date = nextDate.toISOString().split("T")[0];
  item.updated_at = new Date().toISOString();

  // Log activity
  store.activityLogs.push({
    id: `log-${Date.now()}`,
    user_id: item.user_id,
    activity_type: "revision_completed",
    activity_date: new Date().toISOString().split("T")[0],
    count: 1,
    metadata: { topic: item.topic, quality },
    created_at: new Date().toISOString(),
  });

  saveStore(store);
  revalidatePath("/revision");
  revalidatePath("/dashboard");
  return { success: true, nextDate: item.next_review_date, newInterval };
}
