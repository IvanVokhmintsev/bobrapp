import { describe, expect, it } from "vitest";

import {
  formatMemberLabel,
  membersToNames,
  normalizeMembers,
  parseMemberLabel,
  parseMembersJson,
} from "./profileMembers.js";

describe("parseMemberLabel", () => {
  it("parses hyphen-separated labels", () => {
    expect(parseMemberLabel("Макс - ударные")).toEqual({
      name: "Макс",
      role: "ударные",
    });
  });
});

describe("normalizeMembers", () => {
  it("limits list to 20 unique members", () => {
    const members = Array.from({ length: 25 }, (_, index) => ({
      name: `Участник ${index}`,
      role: "",
    }));

    expect(normalizeMembers(members)).toHaveLength(20);
  });
});

describe("membersToNames", () => {
  it("serializes members to display labels", () => {
    expect(
      membersToNames([
        { name: "Оля", role: "клавиши" },
        { name: "Ваня", role: "" },
      ]),
    ).toEqual(["Оля — клавиши", "Ваня"]);
  });
});

describe("parseMembersJson", () => {
  it("reads structured JSON members", () => {
    expect(
      parseMembersJson([
        { name: "Аня", role: "вокал" },
        { name: "  ", role: "гитара" },
      ]),
    ).toEqual([{ name: "Аня", role: "вокал" }]);
  });

  it("falls back to legacy names", () => {
    expect(parseMembersJson(null, ["Петя — бас", "Саша"])).toEqual([
      { name: "Петя", role: "бас" },
      { name: "Саша", role: "" },
    ]);
  });
});

describe("formatMemberLabel", () => {
  it("omits role when empty", () => {
    expect(formatMemberLabel({ name: "Соло", role: "   " })).toBe("Соло");
  });
});
