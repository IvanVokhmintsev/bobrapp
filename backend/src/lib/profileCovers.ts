import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { uploadsRoot } from "./backendRoot.js";

export const profileCoversDir = path.join(uploadsRoot, "profile-covers");

const allowedMimeTypes = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export const maxProfileCoverBytes = 5 * 1024 * 1024;

export async function ensureProfileCoverDirs() {
  await mkdir(profileCoversDir, { recursive: true });
}

export function isAllowedProfileCoverMimeType(mimeType: string) {
  return allowedMimeTypes.has(mimeType);
}

function getProfileCoverExtension(mimeType: string) {
  return allowedMimeTypes.get(mimeType);
}

export function buildProfileCoverFileName(
  entity: "album" | "concert",
  entityId: string,
  mimeType: string,
) {
  const extension = getProfileCoverExtension(mimeType);
  if (!extension) {
    throw new Error("Unsupported cover mime type");
  }

  return `${entity}-${entityId}-${Date.now()}.${extension}`;
}

export function buildProfileCoverPublicPath(fileName: string) {
  return `/uploads/profile-covers/${fileName}`;
}

export function isManagedProfileCoverUrl(coverUrl: string | null | undefined) {
  return Boolean(coverUrl?.startsWith("/uploads/profile-covers/"));
}

export async function saveProfileCoverFile(fileName: string, buffer: Buffer) {
  await ensureProfileCoverDirs();
  await writeFile(path.join(profileCoversDir, fileName), buffer);
}

export async function deleteManagedProfileCover(
  coverUrl: string | null | undefined,
) {
  if (!isManagedProfileCoverUrl(coverUrl)) {
    return;
  }

  const fileName = path.basename(coverUrl!);
  const filePath = path.join(profileCoversDir, fileName);

  try {
    await unlink(filePath);
  } catch {
    /* ignore missing files */
  }
}
