import { readSubjects } from "@/lib/storage/subjects";
import Link from "next/link";
import {
  BookOpen,
  Video as Youtube,
  Play,
  Target,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLearningTracksAction } from "./actions";
import { CreateTrackDialog } from "@/components/learning/create-track-dialog";
import { JournalEditor } from "@/components/learning/journal-editor";
import { JournalModal } from "@/components/learning/journal-modal";

export const dynamic = "force-dynamic";

export default async function LearningHubPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const data = await getLearningTracksAction();
  const subjects = await readSubjects();
  const query = ((await searchParams).q ?? "").trim().toLowerCase();
  const matchingJournals = data.journals.filter((j) =>
    [j.summary, ...j.concepts, ...j.confusing_topics, ...j.questions]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
  const matchingVideoTracks = new Set(
    data.videos
      .filter((v) =>
        [v.title, v.notes, ...v.topics_learned]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .map(
        (v) =>
          data.playlists.find((p) => p.id === v.playlist_id)?.learning_track_id,
      ),
  );
  const matchingTracks = data.tracks.filter(
    (t) =>
      matchingVideoTracks.has(t.id) ||
      [t.title, t.description, t.subject, t.notes]
        .join(" ")
        .toLowerCase()
        .includes(query) ||
      (query && matchingJournals.some((j) => j.learning_track_id === t.id)),
  );

  const totalVideos = data.videos.length;
  const completedVideos = data.videos.filter(
    (v) => v.status === "completed",
  ).length;
  const overallPercentage =
    totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-primary" />
            Learning Hub & YouTube Playlists
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Curate SDE playlists, track video progression, and record daily
            active-recall notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <JournalModal tracks={data.tracks} />
          <CreateTrackDialog subjects={subjects} />
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Active Tracks
            </span>
            <div className="text-2xl font-black text-text-primary mt-1">
              {data.tracks.filter((t) => t.status === "active").length}
            </div>
            <span className="text-[11px] text-primary">SDE Curriculum</span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Videos Completed
            </span>
            <div className="text-2xl font-black text-text-primary mt-1">
              {completedVideos}{" "}
              <span className="text-xs font-normal text-text-muted">
                / {totalVideos}
              </span>
            </div>
            <span className="text-[11px] text-success font-semibold">
              {overallPercentage}% overall
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Playlists Linked
            </span>
            <div className="text-2xl font-black text-text-primary mt-1">
              {data.playlists.length}
            </div>
            <span className="text-[11px] text-text-muted">
              YouTube Data API
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <span className="text-xs text-text-muted font-medium">
              Journal Entries
            </span>
            <div className="text-2xl font-black text-text-primary mt-1">
              {data.journals.length}
            </div>
            <span className="text-[11px] text-primary">Grounded for AI</span>
          </CardContent>
        </Card>
      </div>

      {query && (
        <p role="status" className="text-sm text-text-muted">
          Search: {query} — {matchingTracks.length} tracks and{" "}
          {matchingJournals.length} reflections.{" "}
          <Link href="/learning" className="text-primary underline">
            Clear search
          </Link>
        </p>
      )}
      {matchingTracks.length === 0 && (
        <p className="rounded-xl border border-border p-6 text-text-muted">
          No matching learning tracks. Create a track to start learning, or
          clear your search.
        </p>
      )}
      {/* Learning Tracks Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Learning Tracks ({data.tracks.length})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {matchingTracks.map((track) => {
            const playlists = data.playlists.filter(
              (p) => p.learning_track_id === track.id,
            );
            const playlist = playlists[0];
            const playlistIds = new Set(playlists.map((p) => p.id));
            const trackVideos = data.videos.filter((v) =>
              playlistIds.has(v.playlist_id),
            );
            const trackCompleted = trackVideos.filter(
              (v) => v.status === "completed",
            ).length;
            const percentage =
              trackVideos.length > 0
                ? Math.round((trackCompleted / trackVideos.length) * 100)
                : 0;
            const nextVideo =
              trackVideos.find((v) => v.status !== "completed") ||
              trackVideos[0];

            return (
              <Card
                key={track.id}
                className="bg-surface border-border hover:border-border-light transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {track.subject || "General"} · {track.status}
                    </Badge>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        track.priority === "critical"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-elevated border-border text-text-secondary"
                      }`}
                    >
                      {track.priority} Priority
                    </span>
                  </div>

                  <CardTitle className="text-lg font-bold text-text-primary">
                    <Link
                      href={`/learning/${track.id}`}
                      className="hover:text-primary transition-colors flex items-center justify-between"
                    >
                      <span>{track.title}</span>
                      <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                    </Link>
                  </CardTitle>

                  <p className="text-xs text-text-muted line-clamp-2">
                    {track.description ||
                      "Comprehensive placement preparation course."}
                  </p>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {track.target_outcome && (
                    <div className="text-xs bg-elevated p-2.5 rounded-lg border border-border flex items-start gap-2">
                      <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-text-secondary font-medium">
                        Target:{" "}
                        <span className="text-text-primary">
                          {track.target_outcome}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Playlist progress bar */}
                  {playlist && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted flex items-center gap-1.5">
                          <Youtube className="h-3.5 w-3.5 text-primary" />
                          {playlist.title}
                        </span>
                        <span className="text-text-primary font-bold">
                          {trackCompleted} / {trackVideos.length} ({percentage}
                          %)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="pt-2 flex items-center justify-between border-t border-border/60">
                    <span className="text-xs text-text-muted">
                      Goal: {track.daily_goal || "1 lecture daily"}
                    </span>

                    <div className="flex items-center gap-2">
                      {nextVideo && (
                        <Link
                          href={`/learning/${track.id}/video/${nextVideo.id}`}
                        >
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs font-semibold h-8"
                          >
                            <Play className="h-3 w-3" />
                            {trackCompleted === 0 ? "Start" : "Resume"}
                          </Button>
                        </Link>
                      )}
                      <Link href={`/learning/${track.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                        >
                          View All
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Daily Learning Journal Timeline */}
      <Card className="bg-surface border-border">
        <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Recent Daily Concept Journals
            </CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Reflections recorded at the end of each study session. Grounding
              for assessments.
            </p>
          </div>
          <JournalModal
            triggerButton={
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Add Reflection
              </Button>
            }
          />
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {matchingJournals.length === 0 ? (
            <div className="text-center py-6 text-text-muted text-xs">
              No matching journal reflections. Add a reflection to record what
              you learned.
            </div>
          ) : (
            matchingJournals.map((journal) => (
              <div
                key={journal.id}
                className="p-4 rounded-xl bg-elevated border border-border space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">
                    Study Date: {journal.date}
                  </span>
                  <JournalEditor journal={journal} />
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {journal.summary}
                </p>

                {journal.concepts && journal.concepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {journal.concepts.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {journal.code_snippets && journal.code_snippets.length > 0 && (
                  <div className="pt-2">
                    <pre className="p-3 rounded-lg bg-surface border border-border font-mono text-[11px] text-text-primary overflow-x-auto">
                      <code>{journal.code_snippets[0].code}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
