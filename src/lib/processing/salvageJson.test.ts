import { describe, expect, it } from "vitest";
import { salvageJsonFragment, splitJsonDocuments } from "@/lib/processing/salvageJson";

describe("splitJsonDocuments", () => {
  it("returns all complete JSON documents in order", () => {
    const docs = splitJsonDocuments('{"a":1} {"b":2} [3]');
    expect(docs.map((d) => d.value)).toEqual([{ a: 1 }, { b: 2 }, [3]]);
  });

  it("handles documents separated by newlines", () => {
    const docs = splitJsonDocuments('{"a":1}\n{"b":2}\n{"c":3}');
    expect(docs.map((d) => d.value)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it("returns a single document when the input parses whole", () => {
    const docs = splitJsonDocuments('{"a":1}');
    expect(docs.map((d) => d.value)).toEqual([{ a: 1 }]);
  });

  it("ignores non-JSON content between valid documents", () => {
    // Splitter counts only documents that parse; the trailing/embedded garbage
    // is not a document.
    const docs = splitJsonDocuments('{"a":1} garbage {"b":2}');
    expect(docs.map((d) => d.value)).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("returns empty for input with no valid document", () => {
    expect(splitJsonDocuments('not json at all {')).toEqual([]);
    expect(splitJsonDocuments('')).toEqual([]);
  });

  it("does not split on braces inside string values", () => {
    const docs = splitJsonDocuments('{"s":"a } b"} {"x":1}');
    expect(docs.map((d) => d.value)).toEqual([{ s: "a } b" }, { x: 1 }]);
  });
});

describe("salvageJsonFragment", () => {
  it("returns found=false for already-valid JSON", () => {
    const result = salvageJsonFragment('{"a":1}');
    expect(result.found).toBe(false);
  });

  it("recovers a leading object followed by non-JSON trailing text", () => {
    const result = salvageJsonFragment('{"a":1} this is trailing');
    expect(result.found).toBe(true);
    expect(result.value).toEqual({ a: 1 });
    expect(result.trailing).toBe("this is trailing");
  });

  it("recovers a leading array followed by garbage", () => {
    const result = salvageJsonFragment("[1, 2, 3] garbage here");
    expect(result.found).toBe(true);
    expect(result.value).toEqual([1, 2, 3]);
    expect(result.trailing).toBe("garbage here");
  });

  it("returns found=false when the document is unterminated", () => {
    expect(salvageJsonFragment('{"name": "John", "age": 30').found).toBe(false);
  });

  it("returns found=false for a fragment that is not valid JSON even if it closes", () => {
    expect(salvageJsonFragment('{"a" 1} junk').found).toBe(false);
  });

  it("ignores braces inside string values", () => {
    const result = salvageJsonFragment('{"s": "a } b"} trailing stuff');
    expect(result.found).toBe(true);
    expect(result.value).toEqual({ s: "a } b" });
    expect(result.trailing).toBe("trailing stuff");
  });

  it("handles a trailing comma invalidating the whole input but no complete doc", () => {
    expect(salvageJsonFragment('{"a": 1,}').found).toBe(false);
  });

  it("recovers the first of two JSON documents", () => {
    const result = salvageJsonFragment('{"a":1} {"b":2}');
    expect(result.found).toBe(true);
    expect(result.value).toEqual({ a: 1 });
    expect(result.trailing).toBe('{"b":2}');
  });

  it("returns found=false for empty or whitespace", () => {
    expect(salvageJsonFragment("   ").found).toBe(false);
  });

  it("returns found=false for plain text with no JSON", () => {
    expect(salvageJsonFragment("hello world {").found).toBe(false);
  });
});
