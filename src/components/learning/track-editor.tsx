"use client";
import { useState } from "react";

import {
  updateLearningTrackAction,
  importPlaylistAction,
} from "@/app/(app)/learning/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LearningTrack } from "@/types";

export function TrackEditor({ track }: { track: LearningTrack }) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(track.updated_at);
  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    form.set("trackId", track.id);
    form.set("expectedUpdatedAt", version);
    try {
      const result = await updateLearningTrackAction(form);
      if (result.error) setError(result.error);
      else {
        setOpen(false);
      }
    } catch {
      setError("Could not save this track. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setVersion(track.updated_at);
          setError("");
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Edit track</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-surface">
        <DialogHeader>
          <DialogTitle>Edit learning track</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-3">
          {error && (
            <p role="alert" className="text-primary">
              {error}
            </p>
          )}
          <label className="block text-sm">
            Title
            <Input
              name="title"
              required
              maxLength={200}
              defaultValue={track.title}
            />
          </label>
          <label className="block text-sm">
            Subject
            <Input
              name="subject"
              defaultValue={track.subject ?? ""}
              maxLength={200}
            />
          </label>
          <label className="block text-sm">
            Description
            <Textarea
              name="description"
              defaultValue={track.description ?? ""}
            />
          </label>
          <label className="block text-sm">
            Target outcome
            <Input
              name="targetOutcome"
              defaultValue={track.target_outcome ?? ""}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Status
              <select
                name="status"
                defaultValue={track.status}
                className="block w-full rounded border border-border bg-elevated p-2"
              >
                {["active", "paused", "completed", "archived"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Priority
              <select
                name="priority"
                defaultValue={track.priority}
                className="block w-full rounded border border-border bg-elevated p-2"
              >
                {["low", "medium", "high", "critical"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            Deadline
            <Input
              name="deadline"
              type="date"
              defaultValue={track.deadline ?? ""}
            />
          </label>
          <label className="block text-sm">
            Daily goal
            <Input name="dailyGoal" defaultValue={track.daily_goal ?? ""} />
          </label>
          <label className="block text-sm">
            Weekly goal
            <Input name="weeklyGoal" defaultValue={track.weekly_goal ?? ""} />
          </label>
          <label className="block text-sm">
            Resources (one URL per line)
            <Textarea
              name="resourceLinks"
              defaultValue={track.resource_links.join("\n")}
            />
          </label>
          <label className="block text-sm">
            Personal notes
            <Textarea name="notes" defaultValue={track.notes ?? ""} />
          </label>
          <p className="text-xs text-text-muted">
            Archiving keeps your videos and reflections available. Change status
            to active to restore the track.
          </p>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save track"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ImportPlaylist({ trackId }: { trackId: string }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(form: FormData) {
    setBusy(true);
    setMessage("");
    form.set("trackId", trackId);
    try {
      const result = await importPlaylistAction(form);
      setMessage(result.error ?? "Playlist imported.");
    } catch {
      setMessage("Could not import this playlist. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      action={submit}
      className="space-y-3 rounded-xl border border-border bg-surface p-5"
    >
      <label className="block text-sm font-semibold">
        Add a YouTube playlist
        <Input
          name="playlistUrl"
          required
          placeholder="https://www.youtube.com/playlist?list=…"
          className="mt-2"
        />
      </label>
      <p className="text-xs text-text-muted">
        Import requires a configured YouTube Data API key. Private or deleted
        videos may be unavailable.
      </p>
      <Button type="submit" disabled={busy}>
        {busy ? "Importing…" : "Import playlist"}
      </Button>
      <p role="status" className="text-sm text-text-secondary">
        {message}
      </p>
    </form>
  );
}
