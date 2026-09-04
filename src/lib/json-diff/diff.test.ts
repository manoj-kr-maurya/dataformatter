import { describe, expect, it } from "vitest";
import { diffJson, parseJson, renderInline } from "@/lib/json-diff/diff";

describe("parseJson", () => {
  it("returns parsed value on success", () => {
    const result = parseJson('{"a":1}');
    expect("error" in result).toBe(false);
    if (!("error" in result)) expect(result.value).toEqual({ a: 1 });
  });

  it("returns an error (not a throw) on invalid JSON", () => {
    const result = parseJson("{oops}");
    expect("error" in result && !!result.error).toBe(true);
  });
});

describe("diffJson", () => {
  it("detects added/removed/changed leaves", () => {
    const result = diffJson('{"a":1,"b":2}', '{"a":1,"b":3,"c":4}');
    expect(result.ok).toBe(true);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.changed).toBe(1);
    const paths = result.changes.map((c) => c.path);
    expect(paths).toContain("$.b");
    expect(paths).toContain("$.c");
    const changed = result.changes.find((c) => c.path === "$.b");
    expect(changed?.before).toBe("2");
    expect(changed?.after).toBe("3");
  });

  it("detects removed keys", () => {
    const result = diffJson('{"a":1,"b":2}', '{"b":2}');
    expect(result.removed).toBe(1);
    expect(result.changes[0].path).toBe("$.a");
  });

  it("compares arrays positionally (like most structural diffs)", () => {
    const result = diffJson("[1,2,3]", "[3,2,1]");
    expect(result.changed).toBe(2);
  });

  it("returns empty diff for identical inputs", () => {
    const result = diffJson('{"x":[1,2]}', '{"x":[1,2]}');
    expect(result.changes).toHaveLength(0);
  });

  it("reports parse errors per side", () => {
    const result = diffJson("{bad", "{}");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("JSON A");
  });
});

describe("renderInline", () => {
  it("summarizes identical documents", () => {
    const result = diffJson('{"a":1}', '{"a":1}');
    expect(renderInline(result)).toContain("No differences");
  });

  it("renders changes as path blocks", () => {
    const result = diffJson('{"a":1}', '{"a":2}');
    const rendered = renderInline(result);
    expect(rendered).toContain("changed");
    expect(rendered).toContain("$.a");
  });
});