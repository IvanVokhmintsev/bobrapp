import { apiUrl } from "./apiUrl.js";

export function resolveCoverUrl(
  coverUrl: string | null | undefined,
  fallback: string,
) {
  if (!coverUrl?.trim()) {
    return fallback;
  }

  if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
    return coverUrl;
  }

  if (coverUrl.startsWith("/")) {
    return `${apiUrl}${coverUrl}`;
  }

  return fallback;
}

export function formatProfileDate(value: string | null | undefined) {
  if (!value) {
    return "Дата не указана";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
