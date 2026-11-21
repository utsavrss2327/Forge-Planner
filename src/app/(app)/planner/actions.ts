"use server";
import { isDateKey } from "@/lib/dates";
import { capacityWarning, transitionTask } from "@/lib/planner";
import { learningContext } from "@/lib/storage/learning";
import { readProfile } from "@/lib/storage/profile";
import { getStore, saveStore } from "@/lib/storage/store";
import { field, taskSchema } from "@/lib/validation";
import type { DailyTask, StudySession, TaskStatus } from "@/types";
import { revalidatePath } from "next/cache";

function refresh() {
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}
export async function getPlannerData() {
  const { db, userId, demo } = await learningContext();
  const profile = await readProfile();
  if (demo) {
    const store = getStore();
    return {
      tasks: store.dailyTasks,
      sessions: store.studySessions,
      tracks: store.learningTracks,
      profile,
    };
  }
  const [tasks, sessions, tracks] = await Promise.all([
    db
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_date"),
    db
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false }),
    db.from("learning_tracks").select("*").eq("user_id", userId),
  ]);
  if (tasks.error || sessions.error || tracks.error)
    throw new Error("Your planner could not be loaded. Please retry.");
  return {
    tasks: tasks.data as DailyTask[],
    sessions: sessions.data as StudySession[],
    tracks: tracks.data as ReturnType<typeof getStore>["learningTracks"],
    profile,
  };
}

export async function saveDailyTaskAction(form: FormData) {
  const parsed = taskSchema.safeParse({
    title: field(form, "title"),
    description: field(form, "description"),
    subject: field(form, "subject"),
    scheduled_date: field(form, "scheduledDate"),
    estimated_minutes: Number(field(form, "estimatedMinutes")),
    priority: field(form, "priority"),
    source_url: field(form, "sourceUrl"),
    learning_track_id: field(form, "trackId") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { db, userId, demo } = await learningContext();
  const data = await getPlannerData();
  const id = field(form, "taskId");
  const existing = data.tasks.find((t) => t.id === id && t.user_id === userId);
  if (id && !existing) return { error: "Task not found." };
  if (existing && existing.updated_at !== field(form, "expectedUpdatedAt"))
    return { error: "This task changed elsewhere. Reload before saving." };
  if (
    existing &&
    data.sessions.some((s) => s.task_id === id && !s.ended_at) &&
    existing.scheduled_date !== parsed.data.scheduled_date
  )
    return { error: "Pause the active session before moving this task." };
  if (
    parsed.data.learning_track_id &&
    !data.tracks.some(
      (t) => t.id === parsed.data.learning_track_id && t.user_id === userId,
    )
  )
    return { error: "Learning track not found." };
  const warning = capacityWarning(
    data.tasks,
    data.profile,
    parsed.data.scheduled_date,
    parsed.data.estimated_minutes,
    id,
  );
  if (warning && field(form, "allowOverCapacity") !== "on")
    return { error: warning };
  const now = new Date().toISOString();
  const changes = {
    ...parsed.data,
    source_url: parsed.data.source_url || null,
  };
  if (demo) {
    const store = getStore();
    const current = store.dailyTasks.find((t) => t.id === id);
    if (
      existing &&
      (!current || current.updated_at !== field(form, "expectedUpdatedAt"))
    )
      return { error: "This task changed elsewhere. Reload before saving." };
    const freshWarning = capacityWarning(
      store.dailyTasks,
      data.profile,
      parsed.data.scheduled_date,
      parsed.data.estimated_minutes,
      id,
    );
    if (freshWarning && field(form, "allowOverCapacity") !== "on")
      return { error: freshWarning };
    if (existing) Object.assign(current!, changes, { updated_at: now });
    else
      store.dailyTasks.push({
        ...changes,
        id: crypto.randomUUID(),
        user_id: userId,
        roadmap_id: null,
        source: "manual",
        status: "pending",
        actual_minutes: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
      });
    saveStore(store);
  } else {
    // RPC rechecks capacity and ownership under a per-user lock to prevent races.
    const { error } = await db.rpc("save_daily_task", {
      target_task: id || null,
      expected_version: field(form, "expectedUpdatedAt") || null,
      task_data: changes,
      allow_over_capacity: field(form, "allowOverCapacity") === "on",
    });
    if (error)
      return {
        error: error.message?.includes("Locked routine task")
          ? error.message
          : "Task could not be saved. Refresh to check capacity and concurrent changes.",
      };
  }
  refresh();
  return { success: true };
}

export async function transitionTaskAction(taskId: string, status: TaskStatus) {
  if (!["pending", "in_progress", "completed", "skipped"].includes(status))
    return { error: "Invalid task status." };
  const { db, userId, demo } = await learningContext();
  if (demo) {
    const store = getStore();
    const task = store.dailyTasks.find(
      (t) => t.id === taskId && t.user_id === userId,
    );
    if (!task) return { error: "Task not found." };
    try {
      transitionTask(
        task,
        store.studySessions,
        userId,
        status,
        new Date(),
        crypto.randomUUID(),
      );
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Session could not be updated.",
      };
    }
    saveStore(store);
  } else {
    const { error } = await db.rpc("transition_study_task", {
      target_task: taskId,
      next_status: status,
    });
    if (error)
      return {
        error:
          "Could not update this session. Pause any other running task, refresh, and retry.",
      };
  }
  refresh();
  return { success: true };
}

export async function moveTaskAction(
  taskId: string,
  date: string,
  allowOverCapacity = false,
) {
  if (!isDateKey(date)) return { error: "Enter a valid calendar date." };
  const { db, userId, demo } = await learningContext();
  const data = await getPlannerData();
  const task = data.tasks.find((t) => t.id === taskId && t.user_id === userId);
  if (!task) return { error: "Task not found." };
  if (task.status === "completed")
    return { error: "Reopen completed tasks before rescheduling." };
  const warning = capacityWarning(
    data.tasks,
    data.profile,
    date,
    task.estimated_minutes,
    taskId,
  );
  if (warning && !allowOverCapacity) return { error: warning };
  if (demo) {
    const store = getStore();
    const current = store.dailyTasks.find((t) => t.id === taskId);
    if (
      !current ||
      current.updated_at !== task.updated_at ||
      current.status === "completed"
    )
      return {
        error: "This task changed elsewhere. Reload before rescheduling.",
      };
    transitionTask(
      current,
      store.studySessions,
      userId,
      "rescheduled",
      new Date(),
      crypto.randomUUID(),
    );
    current.scheduled_date = date;
    saveStore(store);
  } else {
    const { error } = await db.rpc("move_study_task", {
      target_task: taskId,
      target_date: date,
      allow_over_capacity: allowOverCapacity,
    });
    if (error)
      return {
        error: error.message?.includes("Locked routine task")
          ? error.message
          : "Could not move this task. Refresh to check capacity and concurrent changes.",
      };
  }
  refresh();
  return { success: true };
}

export async function deleteDailyTaskAction(
  taskId: string,
  expectedUpdatedAt: string,
) {
  const { db, userId, demo } = await learningContext();
  if (demo) {
    const store = getStore();
    const index = store.dailyTasks.findIndex(
      (t) =>
        t.id === taskId &&
        t.user_id === userId &&
        t.updated_at === expectedUpdatedAt,
    );
    if (index < 0)
      return { error: "Task changed elsewhere. Reload before deleting." };
    if (store.studySessions.some((s) => s.task_id === taskId && !s.ended_at))
      return { error: "Pause this task before deleting it." };
    store.dailyTasks.splice(index, 1);
    store.studySessions
      .filter((s) => s.task_id === taskId)
      .forEach((s) => {
        s.task_id = null;
      });
    saveStore(store);
  } else {
    const { error } = await db.rpc("delete_study_task", {
      target_task: taskId,
      expected_version: expectedUpdatedAt,
    });
    if (error)
      return {
        error: error.message?.includes("Locked routine task")
          ? error.message
          : "Pause the task and refresh before deleting it. Recorded sessions are retained.",
      };
  }
  refresh();
  return { success: true };
}
