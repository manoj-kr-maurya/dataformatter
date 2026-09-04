import { describe, expect, it } from "vitest";
import { testRegex, normalizeFlags } from "@/lib/regex/engine";

describe("testRegex", () => {
  it("reports invalid patterns", () => {
    const result = testRegex("(", "", "text");
    expect(result.valid).toBe(false);
    expect(result.message.length).toBeGreaterThan(0);
  });

  it("finds all matches with global flag", () => {
    const result = testRegex("\\b\\w+\\b", "g", "hello world hello");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(3);
    expect(result.matches[0].value).toBe("hello");
  });

  it("returns only the first match without g", () => {
    const result = testRegex("hello", "", "hello hello");
    expect(result.matchCount).toBe(1);
  });

  it("captures groups and named groups", () => {
    const result = testRegex("(?<word>\\w+)@(\\w+)", "g", "a@b c@d");
    expect(result.matches[0].named.word).toBe("a");
    expect(result.matches[0].groups).toEqual(["a", "b"]);
  });

  it("per-line counts in lines mode", () => {
    const result = testRegex("err", "g", "fine\nerr x\nno\nerr err", "lines");
    expect(result.lines.map((l) => l.count)).toEqual([0, 1, 0, 2]);
  });
});

describe("normalizeFlags", () => {
  it("canonicalizes and dedupes flags", () => {
    expect(normalizeFlags("mgi")).toBe("gim");
    expect(normalizeFlags("gg")).toBe("g");
  });
});