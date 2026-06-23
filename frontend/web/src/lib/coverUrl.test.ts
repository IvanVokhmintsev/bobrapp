import { describe, expect, it, vi } from "vitest";

vi.mock("./apiUrl.js", () => ({
  apiUrl: "http://localhost:3000",
}));

import { formatProfileDate, resolveCoverUrl } from "./coverUrl";

describe("resolveCoverUrl", () => {
  it("returns fallback when cover is missing", () => {
    expect(resolveCoverUrl(null, "/fallback.png")).toBe("/fallback.png");
    expect(resolveCoverUrl("  ", "/fallback.png")).toBe("/fallback.png");
  });

  it("keeps absolute URLs", () => {
    expect(resolveCoverUrl("https://cdn.example.com/cover.jpg", "/fallback.png")).toBe(
      "https://cdn.example.com/cover.jpg",
    );
  });

  it("prefixes API host for relative upload paths", () => {
    expect(resolveCoverUrl("/uploads/covers/1.jpg", "/fallback.png")).toBe(
      "http://localhost:3000/uploads/covers/1.jpg",
    );
  });
});

describe("formatProfileDate", () => {
  it("handles missing values", () => {
    expect(formatProfileDate(null)).toBe("Дата не указана");
    expect(formatProfileDate(undefined)).toBe("Дата не указана");
  });

  it("formats valid ISO dates in Russian locale", () => {
    const formatted = formatProfileDate("2024-06-15");
    expect(formatted).toContain("2024");
    expect(formatted).toContain("15");
  });

  it("returns raw value for invalid dates", () => {
    expect(formatProfileDate("not-a-date")).toBe("not-a-date");
  });
});
