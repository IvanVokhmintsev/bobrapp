import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

export const uploadsRoot = path.join(backendRoot, "uploads");
export const avatarsDir = path.join(uploadsRoot, "avatars");

const allowedMimeTypes = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export const maxAvatarBytes = 5 * 1024 * 1024;

export async function ensureUploadDirs() {
  await mkdir(avatarsDir, { recursive: true });
}

export function isAllowedAvatarMimeType(mimeType: string) {
  return allowedMimeTypes.has(mimeType);
}

export function getAvatarExtension(mimeType: string) {
  return allowedMimeTypes.get(mimeType);
}

export function buildAvatarFileName(userId: string, mimeType: string) {
  const extension = getAvatarExtension(mimeType);
  if (!extension) {
    throw new Error("Unsupported avatar mime type");
  }

  return `${userId}-${Date.now()}.${extension}`;
}

export function buildAvatarPublicPath(fileName: string) {
  return `/uploads/avatars/${fileName}`;
}

export function isManagedAvatarUrl(avatarUrl: string | null | undefined) {
  return Boolean(avatarUrl?.startsWith("/uploads/avatars/"));
}

export async function saveAvatarFile(
  fileName: string,
  buffer: Buffer,
) {
  await ensureUploadDirs();
  await writeFile(path.join(avatarsDir, fileName), buffer);
}

export async function deleteManagedAvatar(avatarUrl: string | null | undefined) {
  if (!isManagedAvatarUrl(avatarUrl)) {
    return;
  }

  const fileName = path.basename(avatarUrl!);
  const filePath = path.join(avatarsDir, fileName);

  try {
    await unlink(filePath);
  } catch {
    /* ignore missing files */
  }
}
