"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDailyTaskAction, deleteDailyTaskAction } from "@/app/(app)/planner/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DailyTask, LearningTrack } from "@/types";

export function TaskEditor({ task, date, tracks }: { task?: DailyTask; date: string; tracks: LearningTrack[] }) {
  const router = useRouter(); const [open, setOpen] = useState(false), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(task?.updated_at ?? "");
  async function save(form: FormData) {
    setBusy(true); setError("");
    if (task) { form.set("taskId", task.id); form.set("expectedUpdatedAt", version); }
    try { const result = await saveDailyTaskAction(form); if (result.error) setError(result.error); else { setOpen(false); router.refresh(); } }
    catch { setError("Unable to save this task. Please retry."); } finally { setBusy(false); }
  }
  async function remove() {
    if (!task || !window.confirm("Delete this task? Recorded study sessions will be kept.")) return;
    setBusy(true); setError("");
    try { const result = await deleteDailyTaskAction(task.id, version); if (result.error) setError(result.error); else { setOpen(false); router.refresh(); } }
    catch { setError("Could not delete this task. Please retry."); } finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={(next) => { if (next) { setVersion(task?.updated_at ?? ""); setError(""); } setOpen(next); }}>
    <DialogTrigger asChild><Button size="sm" variant={task ? "outline" : "default"}>{task ? "Edit task" : "Add study task"}</Button></DialogTrigger>
    <DialogContent className="max-h-[90vh] overflow-y-auto bg-surface"><DialogHeader><DialogTitle>{task ? "Edit study task" : "Plan a study task"}</DialogTitle></DialogHeader>
      <form action={save} className="space-y-3">
        {error && <p role="alert" className="rounded border border-primary p-3 text-sm text-primary">{error}</p>}
        <label className="block text-sm">Task title<Input name="title" required maxLength={200} defaultValue={task?.title} /></label>
        <label className="block text-sm">Description<Textarea name="description" defaultValue={task?.description ?? ""} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Study date<Input name="scheduledDate" type="date" required defaultValue={task?.scheduled_date ?? date} /></label>
          <label className="block text-sm">Estimated minutes<Input name="estimatedMinutes" type="number" required min={1} max={960} defaultValue={task?.estimated_minutes ?? 30} /></label>
        </div>
        <label className="block text-sm">Subject<Input name="subject" defaultValue={task?.subject ?? ""} /></label>
        <label className="block text-sm">Priority<select name="priority" defaultValue={task?.priority ?? "medium"} className="block w-full rounded border border-border bg-elevated p-2">{["low", "medium", "high", "critical"].map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="block text-sm">Learning track<select name="trackId" defaultValue={task?.learning_track_id ?? ""} className="block w-full rounded border border-border bg-elevated p-2"><option value="">Independent task</option>{tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
        <label className="block text-sm">Resource URL<Input name="sourceUrl" type="url" defaultValue={task?.source_url ?? ""} /></label>
        <label className="flex items-start gap-2 text-sm text-text-secondary"><input name="allowOverCapacity" type="checkbox" className="mt-1" />Allow exceeding configured capacity or using a rest day for this task.</label>
        <div className="flex justify-between"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save task"}</Button>{task && <Button type="button" variant="outline" disabled={busy} onClick={remove}>Delete task</Button>}</div>
      </form>
    </DialogContent>
  </Dialog>;
}
