import { describe, expect, it } from "vitest";

import {
  formatMemberLabel,
  normalizeMembers,
  parseMemberLabel,
  resolveProfileMembers,
} from "./profileMembers";

describe("parseMemberLabel", () => {
  it("splits name and role by em dash", () => {
    expect(parseMemberLabel("Аня — вокал")).toEqual({
      name: "Аня",
      role: "вокал",
    });
  });

  it("treats plain text as name only", () => {
    expect(parseMemberLabel("Барабанщик")).toEqual({
      name: "Барабанщик",
      role: "",
    });
  });
});

describe("formatMemberLabel", () => {
  it("joins name and role", () => {
    expect(formatMemberLabel({ name: "Игорь", role: "бас" })).toBe("Игорь — бас");
    expect(formatMemberLabel({ name: "Игорь", role: "" })).toBe("Игорь");
  });
});

describe("normalizeMembers", () => {
  it("trims values and removes duplicates", () => {
    expect(
      normalizeMembers([
        { name: " Аня ", role: " вокал " },
        { name: "Аня", role: "вокал" },
        { name: "", role: "гитара" },
        { name: "Петя", role: "барабаны" },
      ]),
    ).toEqual([
      { name: "Аня", role: "вокал" },
      { name: "Петя", role: "барабаны" },
    ]);
  });
});

describe("resolveProfileMembers", () => {
  it("prefers structured members over legacy names", () => {
    expect(
      resolveProfileMembers(
        [{ name: "Аня", role: "вокал" }],
        ["Старый участник — бас"],
      ),
    ).toEqual([{ name: "Аня", role: "вокал" }]);
  });

  it("parses legacy member names when members array is empty", () => {
    expect(resolveProfileMembers([], ["Коля — гитара", "Саша"])).toEqual([
      { name: "Коля", role: "гитара" },
      { name: "Саша", role: "" },
    ]);
  });
});
