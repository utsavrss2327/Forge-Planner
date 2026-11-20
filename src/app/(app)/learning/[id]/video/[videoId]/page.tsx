import Link from "next/link";
import { notFound } from "next/navigation";
import { getLearningTracksAction } from "../../../actions";
import { VideoWorkspace } from "@/components/learning/video-workspace";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string; videoId: string }> }) {
  const { id, videoId } = await params;
  const data = await getLearningTracksAction();
  const track = data.tracks.find((t) => t.id === id);
  const playlists = new Set(data.playlists.filter((p) => p.learning_track_id === id).map((p) => p.id));
  const video = data.videos.find((v) => v.id === videoId && playlists.has(v.playlist_id));
  if (!track || !video) notFound();
  return <div className="space-y-6 pb-12">
    <Link href={`/learning/${id}`} className="text-sm text-text-muted hover:text-primary">← {track.title}</Link>
    <h1 className="text-2xl font-bold">{video.title}</h1>
    <VideoWorkspace video={video} trackId={track.id} />
  </div>;
}
