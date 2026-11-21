"use server";
import { readPlacement } from "@/lib/storage/placement";
export async function getAnalyticsDataAction() {
  return readPlacement();
}
