"use server";

import { revalidatePath } from "next/cache";
import { getStore, saveStore } from "@/lib/storage/store";
import type { Difficulty, DSAProblemStatus, DSAPlatform } from "@/types";

export async function getDsaDataAction() {
  const store = getStore();
  return {
    problems: store.dsaProblems,
    topicMastery: store.topicMastery,
  };
}

export async function createDsaProblemAction(formData: FormData) {
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const topic = formData.get("topic") as string;
  const difficulty = (formData.get("difficulty") as Difficulty) || "medium";
  const platform = (formData.get("platform") as DSAPlatform) || "leetcode";
  const status = (formData.get("status") as DSAProblemStatus) || "solved";
  const timeTaken = parseInt((formData.get("timeTaken") as string) || "30", 10);
  const solutionNotes = formData.get("solutionNotes") as string;
  const mistakes = formData.get("mistakes") as string;
  const needsRevision = formData.get("needsRevision") === "true";

  if (!name) return { error: "Problem name is required" };

  const store = getStore();
  const userId = "00000000-0000-0000-0000-000000000001";
  const today = new Date().toISOString().split("T")[0];

  const problemId = `prob-${Date.now()}`;
  store.dsaProblems.unshift({
    id: problemId,
    user_id: userId,
    name,
    url: url || null,
    platform,
    topic: topic || "Arrays",
    difficulty,
    status,
    attempts: 1,
    time_taken_minutes: timeTaken,
    date_solved: status === "solved" ? today : null,
    solution_notes: solutionNotes || null,
    mistakes: mistakes || null,
    needs_revision: needsRevision,
    last_attempted_at: today,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Log activity
  if (status === "solved") {
    store.activityLogs.push({
      id: `log-${Date.now()}`,
      user_id: userId,
      activity_type: "problem_solved",
      activity_date: today,
      count: 1,
      metadata: { problemName: name, topic },
      created_at: new Date().toISOString(),
    });
  }

  saveStore(store);
  revalidatePath("/dsa");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateDsaProblemStatusAction(problemId: string, status: DSAProblemStatus) {
  const store = getStore();
  const prob = store.dsaProblems.find((p) => p.id === problemId);
  if (!prob) return { error: "Problem not found" };

  prob.status = status;
  prob.last_attempted_at = new Date().toISOString();
  if (status === "solved" && !prob.date_solved) {
    prob.date_solved = new Date().toISOString().split("T")[0];
  }

  saveStore(store);
  revalidatePath("/dsa");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleDsaRevisionAction(problemId: string) {
  const store = getStore();
  const prob = store.dsaProblems.find((p) => p.id === problemId);
  if (!prob) return { error: "Problem not found" };

  prob.needs_revision = !prob.needs_revision;
  saveStore(store);
  revalidatePath("/dsa");
  return { success: true, needs_revision: prob.needs_revision };
}
