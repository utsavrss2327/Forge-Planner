import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/middleware";
import { getStore } from "./store";
import type { LearningTrack, YoutubePlaylist, PlaylistVideo, JournalEntry } from "@/types";

export async function learningContext() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  if (!isSupabaseConfigured() && process.env.FORGE_DEMO_MODE !== "true") {
    throw new Error("Configure Supabase or explicitly enable FORGE_DEMO_MODE=true for a local demonstration.");
  }
  return { db, userId: user.id as string, demo: !isSupabaseConfigured() };
}

export async function readLearning() {
  const { db, userId, demo } = await learningContext();
  if (demo) {
    const store = getStore();
    return { tracks: store.learningTracks, playlists: store.youtubePlaylists, videos: store.playlistVideos, journals: store.journalEntries };
  }
  const results = await Promise.all([
    db.from("learning_tracks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    db.from("youtube_playlists").select("*").eq("user_id", userId),
    db.from("playlist_videos").select("*").order("order_index"),
    db.from("journal_entries").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  if (results.some((r) => r.error)) throw new Error("Unable to load learning data. Check your database migrations and connection.");
  return { tracks: results[0].data as LearningTrack[], playlists: results[1].data as YoutubePlaylist[], videos: results[2].data as PlaylistVideo[], journals: results[3].data as JournalEntry[] };
}
