import { apiUrl } from "./apiUrl.js";

export function resolveAvatarUrl(
  avatarUrl: string | null | undefined,
  fallback: string,
) {
  if (!avatarUrl?.trim()) {
    return fallback;
  }

  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://") ||
    avatarUrl.startsWith("data:") ||
    avatarUrl.startsWith("blob:")
  ) {
    return avatarUrl;
  }

  if (avatarUrl.startsWith("/")) {
    return `${apiUrl}${avatarUrl}`;
  }

  return avatarUrl;
}
