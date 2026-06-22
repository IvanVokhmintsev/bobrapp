const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
