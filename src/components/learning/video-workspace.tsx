"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateVideoProgressAction } from "@/app/(app)/learning/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { JournalModal } from "./journal-modal";
import type { PlaylistVideo, VideoStatus } from "@/types";

export function VideoWorkspace({ video, trackId }: { video: PlaylistVideo; trackId: string }) {
  const router = useRouter();
  const [version, setVersion] = useState(video.updated_at);
  const [notes, setNotes] = useState(video.notes ?? "");
  const [topics, setTopics] = useState(video.topics_learned.join(", "));
  const [difficulty, setDifficulty] = useState(video.difficulty_rating?.toString() ?? "");
  const [status, setStatus] = useState<VideoStatus>(video.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await updateVideoProgressAction({
        videoId: video.id, status, notes, expectedUpdatedAt: version,
        topicsLearned: topics.split(",").map((s) => s.trim()).filter(Boolean),
        difficultyRating: difficulty ? Number(difficulty) : null,
      });
      if (result.error) setMessage(result.error);
      else { if (result.updatedAt) setVersion(result.updatedAt); setMessage("Progress and notes saved."); router.refresh(); }
    } catch { setMessage("Unable to save. Your notes are still here; please retry."); }
    finally { setBusy(false); }
  }

  return <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
    <section className="space-y-4">
      <iframe className="aspect-video w-full rounded-xl border border-border" title={video.title}
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.video_id)}`}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      <p className="text-sm text-text-muted">Completion is your confirmation of study. FORGE does not infer watched time from playback.</p>
      <a className="text-primary underline" href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id)}`} target="_blank" rel="noopener noreferrer">Open on YouTube if embedding is unavailable</a>
      <div><JournalModal trackId={trackId} /></div>
    </section>
    <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <label className="block text-sm">Study status
        <select value={status} onChange={(e) => setStatus(e.target.value as VideoStatus)} className="mt-2 block w-full rounded border border-border bg-elevated p-2">
          <option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
        </select>
      </label>
      <label className="block text-sm">Notes and questions
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={10} maxLength={50000} className="mt-2" placeholder="Explain the concept in your own words. What remains confusing?" />
      </label>
      <label className="block text-sm">Topics learned, separated by commas
        <Textarea value={topics} onChange={(e) => setTopics(e.target.value)} rows={2} className="mt-2" />
      </label>
      <label className="block text-sm">Difficulty
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-2 block w-full rounded border border-border bg-elevated p-2">
          <option value="">Unrated</option>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
        </select>
      </label>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save progress and notes"}</Button>
      <p role="status" className="text-sm text-text-secondary">{message}</p>
    </form>
  </div>;
}
