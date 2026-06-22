import type { ApiPost } from "../../api";
import defaultCover from "../../assets/feed/cover.png";

export type FeedPostMedia = {
  imageUrl: string | null;
  audioUrl: string | null;
  audioTitle: string | null;
  audioDurationSec: number | null;
};

export type FeedPostDisplayMode = "demo" | "text" | "roadmap";

export function getPostDisplayMode(
  post: ApiPost,
  media?: FeedPostMedia,
): FeedPostDisplayMode {
  if (post.type === "roadmap") {
    return "roadmap";
  }

  if (media?.imageUrl || media?.audioUrl) {
    return "demo";
  }

  if (post.text.trim()) {
    return "text";
  }

  return "demo";
}

export function getDemoCoverSrc(media?: FeedPostMedia) {
  return media?.imageUrl ?? defaultCover;
}

export function formatAudioDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

export async function readAudioDuration(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.src = objectUrl;
      audio.addEventListener("loadedmetadata", () => {
        resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
      });
      audio.addEventListener("error", () => reject(new Error("audio metadata")));
    });

    return duration > 0 ? duration : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function buildAudioTitle(fileName: string, authorName: string) {
  const trackName = stripFileExtension(fileName);
  return `${trackName} – ${authorName}`;
}
