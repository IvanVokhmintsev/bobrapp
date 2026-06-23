export const SOCIAL_PLATFORMS = [
  { id: "spotify", label: "Spotify" },
  { id: "apple", label: "Apple Music" },
  { id: "youtube", label: "YouTube" },
  { id: "vk", label: "VK" },
  { id: "telegram", label: "Telegram" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "bandcamp", label: "Bandcamp" },
  { id: "soundcloud", label: "SoundCloud" },
  { id: "website", label: "Сайт" },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]["id"];

export type SocialLinkEntry = {
  id: string;
  platform: string;
  url: string;
};

const platformLabelById = new Map(
  SOCIAL_PLATFORMS.map((platform) => [platform.id, platform.label]),
);

export function getSocialPlatformLabel(platformId: string) {
  return platformLabelById.get(platformId as SocialPlatformId) ?? platformId;
}

export function normalizeExternalUrl(raw: string): string {
  const url = raw.trim();

  if (!url) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return url;
  }

  if (url.startsWith("@")) {
    return `https://t.me/${url.slice(1)}`;
  }

  return `https://${url}`;
}

export function socialLinksFromRecord(links: Record<string, string>) {
  return Object.entries(links)
    .filter(([, url]) => url.trim().length > 0)
    .map(([platform, url], index) => ({
      id: `social-${platform}-${index}`,
      platform,
      url: url.trim(),
    }));
}

export function socialLinksToRecord(entries: SocialLinkEntry[]) {
  const result: Record<string, string> = {};

  for (const entry of entries) {
    const platform = entry.platform.trim();
    const url = normalizeExternalUrl(entry.url.trim());

    if (!platform || !url) {
      continue;
    }

    result[platform] = url;

    if (Object.keys(result).length >= 20) {
      break;
    }
  }

  return result;
}

export function createSocialLinkEntry(platform = ""): SocialLinkEntry {
  return {
    id: `social-${crypto.randomUUID()}`,
    platform,
    url: "",
  };
}
