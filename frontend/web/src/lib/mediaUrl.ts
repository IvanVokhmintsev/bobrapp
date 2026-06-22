import { apiUrl } from "./apiUrl.js";

export function resolveUploadUrl(url: string | null | undefined) {
  if (!url?.trim()) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${apiUrl}${url}`;
  }

  return url;
}
