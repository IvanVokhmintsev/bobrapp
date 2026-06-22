import { parseBlob, parseBuffer, selectCover, type IPicture } from "music-metadata";

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

export function getDemoCoverSrc(
  media?: FeedPostMedia,
  extractedCoverUrl?: string | null,
) {
  return media?.imageUrl ?? extractedCoverUrl ?? defaultCover;
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

function normalizeImageMimeType(format: string) {
  const normalized = format.trim().toLowerCase();

  if (!normalized) {
    return "image/jpeg";
  }

  if (normalized.startsWith("image/")) {
    return normalized;
  }

  if (normalized === "jpg" || normalized === "jpeg") {
    return "image/jpeg";
  }

  if (normalized === "png") {
    return "image/png";
  }

  return `image/${normalized}`;
}

function guessAudioMimeType(file: File) {
  if (file.type) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    flac: "audio/flac",
    ogg: "audio/ogg",
    opus: "audio/ogg",
    wav: "audio/wav",
    aiff: "audio/aiff",
    aif: "audio/aiff",
  };

  return byExtension[extension ?? ""] ?? "application/octet-stream";
}

function pictureToObjectUrl(picture: IPicture) {
  return URL.createObjectURL(
    new Blob([Uint8Array.from(picture.data)], {
      type: normalizeImageMimeType(picture.format),
    }),
  );
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
    const metadata = await readMetadataFromFile(file);
    const picture = selectCover(metadata.common.picture);
    const duration = metadata.format.duration;

    return {
      durationSec: duration && duration > 0 ? duration : null,
      title: metadata.common.title?.trim() || null,
      artist: metadata.common.artist?.trim() || null,
      coverUrl: picture ? pictureToObjectUrl(picture) : null,
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

async function readMetadataFromFile(file: File) {
  try {
    return await parseBlob(file);
  } catch {
    const buffer = new Uint8Array(await file.arrayBuffer());
    return parseBuffer(buffer, {
      mimeType: guessAudioMimeType(file),
      size: file.size,
    });
  }
}

export async function readAudioCoverFromUrl(audioUrl: string) {
  try {
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    const file = new File([blob], "track", {
      type: blob.type || "audio/mpeg",
    });
    const metadata = await readAudioFileMetadata(file);
    return metadata.coverUrl;
  } catch {
    return null;
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
