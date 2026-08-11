import { describe, expect, it } from "vitest";
import { countChars, countLines, countWords, getTextCounts } from "@/lib/text/counts";

describe("countWords", () => {
  it("counts space-separated words", () => {
    expect(countWords("the quick brown fox")).toBe(4);
  });

  it("handles leading, trailing, and repeated whitespace", () => {
    expect(countWords("  hello   world \n tab\there  ")).toBe(4);
  });

  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("treats punctuation as word boundaries", () => {
    expect(countWords("one, two; three—four!")).toBe(4);
    expect(countWords('{"a": 1}')).toBe(2);
  });

  it("keeps apostrophes and hyphens inside a word", () => {
    expect(countWords("don't stop mother-in-law")).toBe(3);
  });

  it("counts non-Latin scripts and digits", () => {
    expect(countWords("héllo wörld")).toBe(2);
    expect(countWords("版本 1.2")).toBe(3);
  });

  it("ignores standalone symbols", () => {
    expect(countWords("-> <=> ...")).toBe(0);
  });
});

describe("countChars & countLines", () => {
  it("counts characters by code point", () => {
    expect(countChars("héllo")).toBe(5);
    expect(countChars("a😀b")).toBe(3);
  });

  it("counts lines", () => {
    expect(countLines("")).toBe(0);
    expect(countLines("a")).toBe(1);
    expect(countLines("a\nb\nc")).toBe(3);
  });
});

describe("getTextCounts", () => {
  it("returns all three counts", () => {
    expect(getTextCounts("one two\nthree")).toEqual({
      characters: 13,
      lines: 2,
      words: 3,
    });
  });
});