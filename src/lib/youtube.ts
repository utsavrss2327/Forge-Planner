const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface PlaylistInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  videoCount: number;
}

export interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  position: number;
}

function isYoutubeConfigured(): boolean {
  return !!process.env.YOUTUBE_API_KEY;
}

export function extractPlaylistId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (!["https:", "http:"].includes(urlObj.protocol) ||
        !["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(urlObj.hostname)) return null;
    const listParam = urlObj.searchParams.get("list");
    return listParam && /^[a-zA-Z0-9_-]{10,150}$/.test(listParam) ? listParam : null;
  } catch {
    // Try direct ID match
    const match = url.match(/^[a-zA-Z0-9_-]{10,150}$/);
    return match ? url : null;
  }
}

function parseISO8601Duration(duration: string): number | null {
  if (!duration) return null;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function fetchPlaylistInfo(playlistId: string): Promise<PlaylistInfo> {
  if (!isYoutubeConfigured()) {
    throw new Error(
      "YouTube API key is not configured. Please add YOUTUBE_API_KEY to your environment variables."
    );
  }

  const response = await fetch(
    `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&id=${encodeURIComponent(playlistId)}&key=${process.env.YOUTUBE_API_KEY}`,
    { cache: "no-store", signal: AbortSignal.timeout(15000) }
  );

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("Playlist not found. Please check the URL and try again.");
  }

  const playlist = data.items[0];

  return {
    id: playlist.id,
    title: playlist.snippet.title,
    description: playlist.snippet.description || "",
    thumbnailUrl:
      playlist.snippet.thumbnails?.medium?.url ||
      playlist.snippet.thumbnails?.default?.url ||
      "",
    channelTitle: playlist.snippet.channelTitle,
    videoCount: playlist.contentDetails.itemCount,
  };
}

export async function fetchPlaylistVideos(playlistId: string): Promise<VideoInfo[]> {
  if (!isYoutubeConfigured()) {
    throw new Error("YouTube API key is not configured.");
  }

  const videos: VideoInfo[] = [];
  let nextPageToken: string | undefined;
  const visitedPages = new Set<string>();

  // Fetch all pages of playlist items
  do {
    const token = nextPageToken ?? "first";
    if (visitedPages.has(token) || visitedPages.size >= 100) throw new Error("This playlist is too large or pagination failed. Split the playlist and retry.");
    visitedPages.add(token);
    const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
    if (nextPageToken) {
      url.searchParams.set("pageToken", nextPageToken);
    }

    const response = await fetch(url.toString(), { cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    nextPageToken = data.nextPageToken;

    for (const item of data.items || []) {
      if (item.snippet.title === "Private video" || item.snippet.title === "Deleted video") {
        continue;
      }

      videos.push({
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description || "",
        thumbnailUrl:
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        durationSeconds: null, // Will be fetched separately
        position: item.snippet.position,
      });
    }
  } while (nextPageToken);

  // Fetch video durations in batches of 50
  const videoIds = videos.map((v) => v.videoId);
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

    const response = await fetch(url.toString(), { cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (response.ok) {
      const data = await response.json();
      for (const item of data.items || []) {
        const video = videos.find((v) => v.videoId === item.id);
        if (video) {
          video.durationSeconds = parseISO8601Duration(item.contentDetails.duration);
        }
      }
    }
  }

  return videos.sort((a, b) => a.position - b.position);
}
