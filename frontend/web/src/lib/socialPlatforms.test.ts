import { describe, expect, it } from "vitest";

import {
  getSocialPlatformLabel,
  normalizeExternalUrl,
  socialLinksFromRecord,
  socialLinksToRecord,
} from "./socialPlatforms";

describe("normalizeExternalUrl", () => {
  it("returns empty string for blank input", () => {
    expect(normalizeExternalUrl("   ")).toBe("");
  });

  it("keeps absolute URLs unchanged", () => {
    expect(normalizeExternalUrl("https://open.spotify.com/album/1")).toBe(
      "https://open.spotify.com/album/1",
    );
    expect(normalizeExternalUrl("mailto:hello@example.com")).toBe("mailto:hello@example.com");
  });

  it("prepends https for host-only URLs", () => {
    expect(normalizeExternalUrl("open.spotify.com/album/1")).toBe(
      "https://open.spotify.com/album/1",
    );
  });

  it("converts telegram handles", () => {
    expect(normalizeExternalUrl("@bobrapp")).toBe("https://t.me/bobrapp");
  });
});

describe("socialLinksToRecord", () => {
  it("normalizes URLs and skips empty entries", () => {
    expect(
      socialLinksToRecord([
        { id: "1", platform: "spotify", url: "open.spotify.com/artist/1" },
        { id: "2", platform: "telegram", url: "@artist" },
        { id: "3", platform: "website", url: "   " },
      ]),
    ).toEqual({
      spotify: "https://open.spotify.com/artist/1",
      telegram: "https://t.me/artist",
    });
  });
});

describe("socialLinksFromRecord", () => {
  it("filters out empty URLs", () => {
    const entries = socialLinksFromRecord({
      spotify: "https://spotify.com",
      youtube: "  ",
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]?.platform).toBe("spotify");
  });
});

describe("getSocialPlatformLabel", () => {
  it("returns known labels and falls back to id", () => {
    expect(getSocialPlatformLabel("spotify")).toBe("Spotify");
    expect(getSocialPlatformLabel("custom")).toBe("custom");
  });
});
