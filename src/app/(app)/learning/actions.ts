"use server";

import { revalidatePath } from "next/cache";
import { getStore, saveStore } from "@/lib/storage/store";
import { z } from "zod";
import { field, tags, trackSchema, journalSchema } from "@/lib/validation";
import { readProfile } from "@/lib/storage/profile";
import { studyDate } from "@/lib/dates";
import { learningContext, readLearning } from "@/lib/storage/learning";
import { extractPlaylistId, fetchPlaylistInfo, fetchPlaylistVideos } from "@/lib/youtube";
import type { TaskPriority, VideoStatus } from "@/types";

export async function getLearningTracksAction() {
  return readLearning();
}

export async function createLearningTrackAction(formData: FormData) {
  const validatedTrack = trackSchema.safeParse(trackFields(formData));
  if (!validatedTrack.success) return { error: validatedTrack.error.issues[0].message };
  const title = validatedTrack.data.title;
  const description = field(formData, "description");
  const subject = field(formData, "subject");
  const targetOutcome = field(formData, "targetOutcome");
  const priority: TaskPriority = validatedTrack.data.priority;
  const dailyGoal = field(formData, "dailyGoal");
  const weeklyGoal = field(formData, "weeklyGoal");
  const deadline = field(formData, "deadline");
  const playlistUrl = field(formData, "playlistUrl");

  if (!title?.trim() || title.length > 200) {
    return { error: "Title is required" };
  }

  if (!z.enum(["low", "medium", "high", "critical"]).safeParse(priority).success) {
    return { error: "Invalid priority." };
  }
  if (playlistUrl && !extractPlaylistId(playlistUrl)) {
    return { error: "Enter a valid YouTube playlist URL or playlist ID." };
  }
  const { db, userId, demo } = await learningContext();
  const store = demo ? getStore() : { learningTracks: [], youtubePlaylists: [], playlistVideos: [] } as Pick<ReturnType<typeof getStore>, "learningTracks" | "youtubePlaylists" | "playlistVideos">;
  const trackId = crypto.randomUUID();
  const profile = await readProfile();

  const newTrack = {
    id: trackId,
    user_id: userId,
    title,
    description: description || null,
    subject: subject || "Data Structures & Algorithms",
    target_outcome: targetOutcome || null,
    start_date: studyDate(profile?.timezone),
    deadline: deadline || null,
    priority,
    daily_goal: dailyGoal || null,
    weekly_goal: weeklyGoal || null,
    resource_links: validatedTrack.data.resource_links,
    status: "active" as const,
    notes: validatedTrack.data.notes || null,
    total_items: 0,
    completed_items: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.learningTracks.unshift(newTrack);

  // If YouTube playlist URL was provided, import it
  if (playlistUrl) {
    const playlistId = extractPlaylistId(playlistUrl);
    if (playlistId) {
      try {
        const info = await fetchPlaylistInfo(playlistId);
        const vids = await fetchPlaylistVideos(playlistId);

        const ytPlaylistId = crypto.randomUUID();
        store.youtubePlaylists.push({
          id: ytPlaylistId,
          user_id: userId,
          learning_track_id: trackId,
          playlist_id: playlistId,
          title: info.title,
          description: info.description || null,
          thumbnail_url: info.thumbnailUrl || null,
          total_videos: vids.length,
          completed_videos: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        for (let i = 0; i < vids.length; i++) {
          const v = vids[i];
          store.playlistVideos.push({
            id: crypto.randomUUID(),
            playlist_id: ytPlaylistId,
            video_id: v.videoId,
            title: v.title,
            thumbnail_url: v.thumbnailUrl || null,
            duration_seconds: v.durationSeconds,
            order_index: v.position ?? i,
            status: "not_started",
            difficulty_rating: null,
            topics_learned: [],
            notes: null,
            last_studied_at: null,
            completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        newTrack.total_items = vids.length;
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Playlist import failed. Please retry." };
      }
    }
  }

  if (demo) {
    const latest = getStore();
    latest.learningTracks.unshift(newTrack);
    const added = store.youtubePlaylists.filter((p) => p.learning_track_id === trackId);
    latest.youtubePlaylists.push(...added);
    latest.playlistVideos.push(...store.playlistVideos.filter((v) => added.some((p) => p.id === v.playlist_id)));
    saveStore(latest);
  }
  else {
    const { error } = await db.rpc("create_learning_track", {
      track_data: newTrack,
      playlist_data: store.youtubePlaylists[0] ?? null,
      video_data: store.playlistVideos,
    });
    if (error) return { error: "Could not save your track. Check database setup and retry." };
  }
  revalidatePath("/learning");
  return { success: true, trackId };
}

export async function updateVideoProgressAction(params: {
  videoId: string;
  status: VideoStatus;
  difficultyRating?: number | null;
  expectedUpdatedAt?: string;
  notes?: string;
  topicsLearned?: string[];
}) {
  const validated = z.object({
    videoId: z.string().min(1),
    status: z.enum(["not_started", "in_progress", "completed"]),
    difficultyRating: z.number().int().min(1).max(5).nullable().optional(),
    expectedUpdatedAt: z.string().optional(),
    notes: z.string().max(50000).optional(),
    topicsLearned: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
  }).safeParse(params);
  if (!validated.success) return { error: "Invalid video progress data." };
  const { db, demo } = await learningContext();
  if (!demo) {
    const { data, error } = await db.rpc("save_video_progress_with_version", { target_video: params.videoId, changes: validated.data });
    if (error || !data?.saved) return { error: "Video could not be saved or changed elsewhere. Reload before retrying." };
    revalidatePath("/learning"); revalidatePath("/dashboard");
    return { success: true, updatedAt: data.updated_at as string };
  }
  const store = getStore();
  const video = store.playlistVideos.find((v) => v.id === params.videoId);

  if (!video) {
    return { error: "Video not found" };
  }

  if (params.expectedUpdatedAt && video.updated_at !== params.expectedUpdatedAt) return { error: "This video changed elsewhere. Reload before saving." };
  const prevStatus = video.status;
  video.status = params.status;
  video.last_studied_at = new Date().toISOString();

  if (params.difficultyRating !== undefined) {
    video.difficulty_rating = params.difficultyRating;
  }
  if (params.notes !== undefined) {
    video.notes = params.notes;
  }
  if (params.topicsLearned !== undefined) {
    video.topics_learned = params.topicsLearned;
  }

  if (params.status === "completed" && prevStatus !== "completed") {
    video.completed_at = new Date().toISOString();

    // Log activity
    store.activityLogs.push({
      id: `log-${Date.now()}`,
      user_id: "00000000-0000-0000-0000-000000000001",
      activity_type: "video_completed",
      activity_date: new Date().toISOString().split("T")[0],
      count: 1,
      metadata: { videoTitle: video.title },
      created_at: new Date().toISOString(),
    });
  }

  if (params.status !== "completed") video.completed_at = null;
  const playlist = store.youtubePlaylists.find((p) => p.id === video.playlist_id);
  if (playlist) {
    const videos = store.playlistVideos.filter((v) => v.playlist_id === playlist.id);
    playlist.total_videos = videos.length;
    playlist.completed_videos = videos.filter((v) => v.status === "completed").length;
    const track = store.learningTracks.find((t) => t.id === playlist.learning_track_id);
    if (track) {
      const ids = new Set(store.youtubePlaylists.filter((p) => p.learning_track_id === track.id).map((p) => p.id));
      const all = store.playlistVideos.filter((v) => ids.has(v.playlist_id));
      track.total_items = all.length;
      track.completed_items = all.filter((v) => v.status === "completed").length;
    }
  }
  video.updated_at = new Date().toISOString();
  saveStore(store);
  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return { success: true, updatedAt: video.updated_at };
}

export async function saveJournalEntryAction(formData: FormData) {
  const validatedJournal = journalSchema.safeParse({ summary: field(formData, "summary"), concepts: tags(field(formData, "concepts")), confusing_topics: tags(field(formData, "confusingTopics")), questions: tags(field(formData, "questions")), code: field(formData, "codeSnippet"), language: field(formData, "language") || "text" });
  if (!validatedJournal.success) return { error: validatedJournal.error.issues[0].message };
  const trackId = field(formData, "trackId");
  const summary = field(formData, "summary");
  const conceptsRaw = field(formData, "concepts");
  const confusingRaw = field(formData, "confusingTopics");
  const questionsRaw = field(formData, "questions");
  const codeSnippet = field(formData, "codeSnippet");

  if (!summary?.trim() && !conceptsRaw?.trim() && !codeSnippet?.trim()) {
    return { error: "Record a summary, concept, or code snippet before saving." };
  }
  const concepts = conceptsRaw ? conceptsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const confusingTopics = confusingRaw ? confusingRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const questions = questionsRaw ? questionsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const { db, userId, demo } = await learningContext();
  const today = studyDate((await readProfile())?.timezone);

  const codeSnippets = codeSnippet
    ? [{ language: "cpp", code: codeSnippet, description: "Daily practice snippet" }]
    : [];

  const entry = {
    id: crypto.randomUUID(),
    user_id: userId,
    learning_track_id: trackId || null,
    date: today,
    summary,
    concepts,
    code_snippets: codeSnippets,
    confusing_topics: confusingTopics,
    questions,
    resource_links: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (demo) {
    const store = getStore();
    if (trackId && !store.learningTracks.some((t) => t.id === trackId)) return { error: "Track not found." };
    store.journalEntries.unshift(entry);
    saveStore(store);
  } else {
    if (trackId) {
      const { data } = await db.from("learning_tracks").select("id").eq("id", trackId).eq("user_id", userId).single();
      if (!data) return { error: "Track not found." };
    }
    const { error } = await db.from("journal_entries").insert(entry);
    if (error) return { error: "Could not save your reflection. Please retry." };
  }

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return { success: true };
}

function trackFields(form: FormData) {
  return {
    title: field(form, "title"), description: field(form, "description"), subject: field(form, "subject"),
    target_outcome: field(form, "targetOutcome"), deadline: field(form, "deadline") || null,
    priority: field(form, "priority") || "medium", daily_goal: field(form, "dailyGoal"), weekly_goal: field(form, "weeklyGoal"),
    notes: field(form, "notes"), resource_links: field(form, "resourceLinks").split("\n").map((s) => s.trim()).filter(Boolean),
    status: field(form, "status") || "active",
  };
}

export async function updateLearningTrackAction(form: FormData) {
  const parsed = trackSchema.safeParse(trackFields(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const id = field(form, "trackId"), expected = field(form, "expectedUpdatedAt");
  if (!id || !expected) return { error: "Reload this track before editing it." };
  const { db, userId, demo } = await learningContext();
  if (demo) {
    const store = getStore();
    const track = store.learningTracks.find((t) => t.id === id && t.user_id === userId);
    if (!track || track.updated_at !== expected) return { error: "This track changed elsewhere. Reload before saving." };
    Object.assign(track, parsed.data, { updated_at: new Date().toISOString() }); saveStore(store);
  } else {
    const { data, error } = await db.from("learning_tracks").update(parsed.data).eq("id", id).eq("user_id", userId).eq("updated_at", expected).select("id").maybeSingle();
    if (error) return { error: "Could not save the track. Please retry." };
    if (!data) return { error: "This track changed elsewhere. Reload before saving." };
  }
  revalidatePath("/learning"); revalidatePath("/dashboard");
  return { success: true };
}

export async function importPlaylistAction(form: FormData) {
  const trackId = field(form, "trackId"), playlistId = extractPlaylistId(field(form, "playlistUrl"));
  if (!trackId || !playlistId) return { error: "Enter a valid YouTube playlist URL or playlist ID." };
  const { db, userId, demo } = await learningContext();
  if (demo) {
    if (!getStore().learningTracks.some((t) => t.id === trackId && t.user_id === userId)) return { error: "Track not found." };
  } else {
    const { data, error } = await db.from("learning_tracks").select("id").eq("id", trackId).eq("user_id", userId).maybeSingle();
    if (error || !data) return { error: "Track not found." };
  }
  try {
    const info = await fetchPlaylistInfo(playlistId);
    const videos = await fetchPlaylistVideos(playlistId);
    const now = new Date().toISOString(), id = crypto.randomUUID();
    const playlist = { id, user_id: userId, learning_track_id: trackId, playlist_id: playlistId, title: info.title, description: info.description || null,
      thumbnail_url: info.thumbnailUrl || null, total_videos: videos.length, completed_videos: 0, created_at: now, updated_at: now };
    const rows = videos.map((v) => ({ id: crypto.randomUUID(), playlist_id: id, video_id: v.videoId, title: v.title, thumbnail_url: v.thumbnailUrl || null,
      duration_seconds: v.durationSeconds, order_index: v.position, status: "not_started" as const, difficulty_rating: null, topics_learned: [], notes: null,
      last_studied_at: null, completed_at: null, created_at: now, updated_at: now }));
    if (demo) {
      // Read again after network work so another local edit is not overwritten.
      const store = getStore();
      const track = store.learningTracks.find((t) => t.id === trackId && t.user_id === userId);
      if (!track) return { error: "Track no longer exists." };
      if (store.youtubePlaylists.some((p) => p.learning_track_id === trackId && p.playlist_id === playlistId)) return { error: "This playlist is already linked to this track." };
      store.youtubePlaylists.push(playlist); store.playlistVideos.push(...rows); track.total_items += rows.length; track.updated_at = now; saveStore(store);
    } else {
      const { error } = await db.rpc("import_learning_playlist", { playlist_data: playlist, video_data: rows });
      if (error) return { error: "Could not import the playlist. It may already be linked; refresh before retrying." };
    }
    revalidatePath("/learning"); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Playlist import failed. Please retry." }; }
}

export async function updateJournalEntryAction(form: FormData) {
  const id = field(form, "journalId"), expected = field(form, "expectedUpdatedAt");
  const parsed = journalSchema.safeParse({ summary: field(form, "summary"), concepts: tags(field(form, "concepts")),
    confusing_topics: tags(field(form, "confusingTopics")), questions: tags(field(form, "questions")), code: field(form, "codeSnippet"), language: field(form, "language") || "text" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!id || !expected) return { error: "Reload this reflection before editing." };
  const { code, language, ...values } = parsed.data;
  const changes = { ...values, code_snippets: code ? [{ language, code }] : [] };
  const { db, userId, demo } = await learningContext();
  if (demo) {
    const store = getStore(); const entry = store.journalEntries.find((j) => j.id === id && j.user_id === userId);
    if (!entry || entry.updated_at !== expected) return { error: "This reflection changed elsewhere. Reload before saving." };
    Object.assign(entry, changes, { updated_at: new Date().toISOString() }); saveStore(store);
  } else {
    const { data, error } = await db.from("journal_entries").update(changes).eq("id", id).eq("user_id", userId).eq("updated_at", expected).select("id").maybeSingle();
    if (error || !data) return { error: "Reflection could not be saved or changed elsewhere. Reload before retrying." };
  }
  revalidatePath("/learning"); return { success: true };
}

export async function deleteJournalEntryAction(id: string, expectedUpdatedAt: string) {
  const { db, userId, demo } = await learningContext();
  if (demo) {
    const store = getStore(); const index = store.journalEntries.findIndex((j) => j.id === id && j.user_id === userId && j.updated_at === expectedUpdatedAt);
    if (index < 0) return { error: "Reflection changed elsewhere. Reload before deleting." };
    store.journalEntries.splice(index, 1); saveStore(store);
  } else {
    const { data, error } = await db.from("journal_entries").delete().eq("id", id).eq("user_id", userId).eq("updated_at", expectedUpdatedAt).select("id").maybeSingle();
    if (error || !data) return { error: "Reflection could not be deleted or changed elsewhere." };
  }
  revalidatePath("/learning"); return { success: true };
}
