import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Video as Youtube,
  Play,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  Target,
  Star,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLearningTracksAction } from "../actions";
import { TrackEditor, ImportPlaylist } from "@/components/learning/track-editor";
import { JournalEditor } from "@/components/learning/journal-editor";
import { JournalModal } from "@/components/learning/journal-modal";

export const dynamic = "force-dynamic";

interface TrackPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrackDetailPage({ params }: TrackPageProps) {
  const { id } = await params;
  const store = await getLearningTracksAction();

  const track = store.tracks.find((t) => t.id === id);
  if (!track) {
    notFound();
  }

  const playlists = store.playlists.filter((p) => p.learning_track_id === track.id);
  const playlistIds = new Set(playlists.map((p) => p.id));
  const videos = store.videos.filter((v) => playlistIds.has(v.playlist_id));
  const completedVideos = videos.filter((v) => v.status === "completed").length;
  const percentage =
    videos.length > 0 ? Math.round((completedVideos / videos.length) * 100) : 0;


  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Link href="/learning">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-text-muted hover:text-text-primary">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Learning Hub
          </Button>
        </Link>
      </div>

      {/* Track Header Card */}
      <Card className="bg-surface border-border">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold">
                  {track.subject || "Data Structures"}
                </Badge>
                <span className="text-xs text-text-muted font-bold uppercase">
                  {track.priority} Priority
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary">
                {track.title}
              </h1>
              <p className="text-xs sm:text-sm text-text-muted max-w-3xl leading-relaxed">
                {track.description || "Core placement preparation curriculum."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <TrackEditor track={track} /><JournalModal trackId={track.id} />
            </div>
          </div>

          {track.target_outcome && (
            <div className="bg-elevated p-3 rounded-xl border border-border flex items-start gap-2.5">
              <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="text-text-muted">Target Outcome: </span>
                <span className="text-text-primary font-semibold">{track.target_outcome}</span>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted font-medium">Curriculum Progress</span>
              <span className="text-primary font-bold">
                {completedVideos} of {videos.length} videos completed ({percentage}%)
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <ImportPlaylist trackId={track.id} />
      {track.notes && <section className="rounded-xl border border-border p-5"><h2 className="mb-2 font-semibold">Personal notes</h2><p className="whitespace-pre-wrap text-sm text-text-secondary">{track.notes}</p></section>}
      {track.resource_links.length > 0 && <section className="rounded-xl border border-border p-5"><h2 className="mb-2 font-semibold">Resources</h2>{track.resource_links.filter((url) => /^https?:\/\//.test(url)).map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-primary underline">{url}</a>)}</section>}
      {/* Videos List */}
      <Card className="bg-surface border-border">
        <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
              <Youtube className="h-4 w-4 text-primary" />
              Playlist Curriculum Videos ({videos.length})
            </CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Click any video to open the distraction-free learning environment.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-3">
          {videos.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs">
              No videos linked to this track yet.
            </div>
          ) : (
            videos.map((vid, idx) => {
              const isCompleted = vid.status === "completed";
              const isInProgress = vid.status === "in_progress";
              const durationMin = vid.duration_seconds
                ? Math.round(vid.duration_seconds / 60)
                : null;

              return (
                <div
                  key={vid.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? "bg-surface/60 border-border opacity-70"
                      : isInProgress
                      ? "bg-elevated border-primary/40"
                      : "bg-elevated border-border hover:border-border-light"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xs font-mono text-text-muted mt-1 w-6 shrink-0">
                      #{idx + 1}
                    </span>

                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-success fill-success/10" />
                      ) : (
                        <Circle className="h-5 w-5 text-text-muted" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-semibold text-text-primary">
                        {vid.title}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-[11px] text-text-muted flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {durationMin === null ? "Duration unavailable" : `${durationMin} mins`}
                        </span>

                        {vid.difficulty_rating && (
                          <span className="text-[11px] text-warning flex items-center gap-1">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            Diff: {vid.difficulty_rating}/5
                          </span>
                        )}

                        {vid.topics_learned && vid.topics_learned.length > 0 && (
                          <div className="flex gap-1">
                            {vid.topics_learned.map((topic) => (
                              <Badge key={topic} variant="outline" className="text-[10px] py-0">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {vid.notes && (
                        <p className="text-xs text-text-muted italic line-clamp-1 pt-1">
                          &ldquo;{vid.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <Link href={`/learning/${track.id}/video/${vid.id}`}>
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        className="gap-1.5 text-xs font-semibold h-8"
                      >
                        <Play className="h-3 w-3" />
                        {isCompleted ? "Review" : "Study Video"}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Track reflections</h2>
        {store.journals.filter((j) => j.learning_track_id === track.id).map((j) => <article key={j.id} className="space-y-3 rounded-xl border border-border bg-surface p-5"><div className="flex justify-between gap-3"><p className="text-sm text-text-muted">{j.date}</p><JournalEditor journal={j} /></div><p className="whitespace-pre-wrap text-sm">{j.summary}</p></article>)}
      </section>
    </div>
  );
}
