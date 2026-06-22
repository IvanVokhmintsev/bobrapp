import { parseBlob } from "music-metadata";

import type { ApiPost } from "../../api";
import defaultCover from "../../assets/feed/cover.png";

export type FeedPostMedia = {
  imageUrl: string | null;
  audioUrl: string | null;
  audioTitle: string | null;
  audioDurationSec: number | null;
};

export type AudioFileMetadata = {
  durationSec: number | null;
  title: string | null;
  artist: string | null;
  coverUrl: string | null;
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

export async function readAudioFileMetadata(file: File): Promise<AudioFileMetadata> {
  try {
    const metadata = await parseBlob(file);
    const picture = metadata.common.picture?.[0];
    const duration = metadata.format.duration;

    return {
      durationSec: duration && duration > 0 ? duration : null,
      title: metadata.common.title?.trim() || null,
      artist: metadata.common.artist?.trim() || null,
      coverUrl: picture
        ? URL.createObjectURL(
            new Blob([Uint8Array.from(picture.data)], { type: picture.format }),
          )
        : null,
    };
  } catch {
    return {
      durationSec: await readAudioDuration(file),
      title: null,
      artist: null,
      coverUrl: null,
    };
  }
}

export function buildAudioTitle(fileName: string, authorName: string) {
  const trackName = stripFileExtension(fileName);
  return `${trackName} – ${authorName}`;
}

export function buildAudioTitleFromMetadata(
  metadata: Pick<AudioFileMetadata, "title" | "artist">,
  fileName: string,
  authorName: string,
) {
  if (metadata.title && metadata.artist) {
    return `${metadata.title} – ${metadata.artist}`;
  }

  if (metadata.title) {
    return `${metadata.title} – ${authorName}`;
  }

  return buildAudioTitle(fileName, authorName);
}

export function revokeObjectUrl(url: string | null | undefined) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
