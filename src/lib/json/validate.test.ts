import { describe, expect, it } from "vitest";
import { parseJson, isJson } from "@/lib/json/validate";

describe("parseJson", () => {
  it("parses valid JSON objects", () => {
    const result = parseJson('{"a":1,"b":[true,null,"x"]}');
    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual({ a: 1, b: [true, null, "x"] });
  });

  it("parses only valid JSON values", () => {
    for (const input of ["null", "42", '"hi"', "[1,2,3]", "true"]) {
      expect(parseJson(input).ok).toBe(true);
    }
  });

  it("rejects malformed JSON", () => {
    const result = parseJson('{"a": }');
    expect(result.ok).toBe(false);
  });

  it("reports approximate location for multi-line JSON", () => {
    const input = '{\n  "a": 1,\n  "b": [1, 2\n}\n';
    const { findLine } = locateIn(input, '"b"');
    const result = parseJson(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.line).toBe(4);
      expect(result.error.column).toBe(1);
      expect(result.error.position).toBeDefined();
      expect(findLine).toBeGreaterThanOrEqual(0);
    }
  });
});

function locateIn(input: string, needle: string): { findLine: number } {
  const index = input.indexOf(needle);
  const before = input.slice(0, index);
  const line = before.split("\n").length;
  return { findLine: line };
}

describe("isJson", () => {
  it("returns true for valid JSON", () => {
    expect(isJson('{"name":"Ada"}')).toBe(true);
  });

  it("returns false for invalid JSON and plain text", () => {
    expect(isJson("hello world")).toBe(false);
    expect(isJson('{"broken')).toBe(false);
  });
});