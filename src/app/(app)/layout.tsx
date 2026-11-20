import { learningContext } from "@/lib/storage/learning";
import { readProfile } from "@/lib/storage/profile";
import { getStore } from "@/lib/storage/store";
import { studyDate } from "@/lib/dates";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { db, userId, demo } = await learningContext();
  const profile = await readProfile();
  const today = studyDate(profile?.timezone);
  const result = demo
    ? { data: getStore().dailyTasks.filter((t) => t.scheduled_date === today), error: null }
    : await db.from("daily_tasks").select("status").eq("user_id", userId).eq("scheduled_date", today);
  if (result.error) throw new Error("Today's progress could not be loaded. Please retry.");
  const tasks = result.data as { status: string }[];
  const dailyProgress = tasks.length ? Math.round(tasks.filter((t) => t.status === "completed").length / tasks.length * 100) : 0;
  return <AppShell user={{ full_name: profile?.full_name ?? undefined }} dailyProgress={dailyProgress} timezone={profile?.timezone ?? "Asia/Kolkata"}>
    {demo && <p role="status" className="mb-4 rounded-lg border border-primary/40 p-3 text-sm text-primary">Demo mode — single-user sample data stored locally. This is not a production account.</p>}
    {children}
  </AppShell>;
}
