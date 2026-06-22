import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { uploadsRoot } from "./backendRoot.js";
export const postsMediaDir = path.join(uploadsRoot, "posts");

export const maxPostImageBytes = 5 * 1024 * 1024;
export const maxPostAudioBytes = 20 * 1024 * 1024;
export const maxPostMediaBytes = maxPostAudioBytes;

const imageMimeTypes = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const audioMimeTypes = new Map<string, string>([
  ["audio/mpeg", "mp3"],
  ["audio/mp3", "mp3"],
  ["audio/x-mpeg", "mp3"],
  ["audio/x-mp3", "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/x-m4a", "m4a"],
  ["audio/m4a", "m4a"],
  ["audio/wav", "wav"],
  ["audio/x-wav", "wav"],
  ["audio/wave", "wav"],
  ["audio/ogg", "ogg"],
  ["audio/flac", "flac"],
  ["audio/webm", "webm"],
]);

export async function ensurePostMediaDirs() {
  await mkdir(postsMediaDir, { recursive: true });
}

export function isAllowedPostImageMimeType(mimeType: string) {
  return imageMimeTypes.has(mimeType);
}

export function isAllowedPostAudioMimeType(mimeType: string) {
  return audioMimeTypes.has(mimeType);
}

function getExtension(map: Map<string, string>, mimeType: string) {
  return map.get(mimeType);
}

export function buildPostImageFileName(postId: string, mimeType: string) {
  const extension = getExtension(imageMimeTypes, mimeType);
  if (!extension) {
    throw new Error("Unsupported post image mime type");
  }

  return `${postId}-image.${extension}`;
}

export function buildPostAudioFileName(postId: string, mimeType: string) {
  const extension = getExtension(audioMimeTypes, mimeType);
  if (!extension) {
    throw new Error("Unsupported post audio mime type");
  }

  return `${postId}-audio.${extension}`;
}

export function buildPostImagePublicPath(fileName: string) {
  return `/uploads/posts/${fileName}`;
}

export function buildPostAudioPublicPath(fileName: string) {
  return `/uploads/posts/${fileName}`;
}

export function isManagedPostMediaUrl(mediaUrl: string | null | undefined) {
  return Boolean(mediaUrl?.startsWith("/uploads/posts/"));
}

export async function savePostMediaFile(fileName: string, buffer: Buffer) {
  await ensurePostMediaDirs();
  await writeFile(path.join(postsMediaDir, fileName), buffer);
}

export async function deleteManagedPostMedia(mediaUrl: string | null | undefined) {
  if (!isManagedPostMediaUrl(mediaUrl)) {
    return;
  }

  const fileName = path.basename(mediaUrl!);
  const filePath = path.join(postsMediaDir, fileName);

  try {
    await unlink(filePath);
  } catch {
    /* ignore missing files */
  }
}

export async function deleteManagedPostMediaSet(
  imageUrl: string | null | undefined,
  audioUrl: string | null | undefined,
) {
  await deleteManagedPostMedia(imageUrl);
  await deleteManagedPostMedia(audioUrl);
}
