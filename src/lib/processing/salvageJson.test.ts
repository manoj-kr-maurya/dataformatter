import { describe, expect, it } from "vitest";
import {
  salvageJsonFragment,
  splitJsonDocuments,
  repairJsonFragment,
  decodeIntactBase64InFragment,
} from "@/lib/processing/salvageJson";

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

describe("repairJsonFragment", () => {
  it("auto-closes an unterminated object", () => {
    const result = repairJsonFragment('{"a":"SGVsbG8="');
    expect(result.repaired).toBe(true);
    expect(result.value).toEqual({ a: "SGVsbG8=" });
  });

  it("auto-closes nested openers", () => {
    const result = repairJsonFragment('{"a":{"b":[1,2');
    expect(result.repaired).toBe(true);
    expect(result.value).toEqual({ a: { b: [1, 2] } });
  });

  it("auto-closes an unterminated array", () => {
    const result = repairJsonFragment('[1,2,"x"');
    expect(result.repaired).toBe(true);
    expect(result.value).toEqual([1, 2, "x"]);
  });

  it("ignores brackets inside string values", () => {
    const result = repairJsonFragment('{"s":"a } b"');
    expect(result.repaired).toBe(true);
    expect(result.value).toEqual({ s: "a } b" });
  });

  it("returns repaired=false when closing brackets do not fix the error", () => {
    expect(repairJsonFragment('{"a" 1}').repaired).toBe(false);
    expect(repairJsonFragment('{"a": 1,}').repaired).toBe(false);
  });

  it("returns repaired=false for empty input", () => {
    expect(repairJsonFragment("   ").repaired).toBe(false);
  });
});

describe("decodeIntactBase64InFragment", () => {
  it("decodes intact base64 string values and leaves the rest", () => {
    const result = decodeIntactBase64InFragment('{"a": "SGVsbG8=",');
    expect(result.decoded).toBe(true);
    expect(result.output).toBe('{"a": "Hello",');
  });

  it("leaves non-base64 strings verbatim", () => {
    const result = decodeIntactBase64InFragment('{"a": "hello",');
    expect(result.decoded).toBe(false);
    expect(result.output).toBe('{"a": "hello",');
  });

  it("reports decoded=false for empty input", () => {
    const result = decodeIntactBase64InFragment("   ");
    expect(result.decoded).toBe(false);
  });
});
