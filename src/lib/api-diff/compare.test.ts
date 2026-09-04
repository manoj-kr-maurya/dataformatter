import { describe, expect, it } from "vitest";
import { buildApiDiffSample } from "@/lib/api-diff/sample";
import { compareApis, looksLikeSchema } from "@/lib/api-diff/compare";

const types = (changes: { severity: string }[]) => changes.map((change) => change.severity);

describe("compareApis", () => {
  it("classifies the sample pair with 4 breaking changes", () => {
    const sample = buildApiDiffSample();
    const result = compareApis(sample.previous, sample.current);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.isSchemaComparison).toBe(true);
    expect(result.summary.breaking).toBe(4);
    expect(result.summary.nonBreaking).toBeGreaterThanOrEqual(2);
    expect(result.summary.informational).toBeGreaterThan(0);

    const titles = result.changes.map((change) => change.title);
    expect(titles).toContain('New required field "version"');
    expect(titles).toContain('Type changed: "integer" → "string"');
    expect(titles).toContain('Field "shippingAddress" removed');
    expect(titles).toContain('Type changed: ["number","null"] → "number"');
    expect(titles).toContain('Enum value "refunded" added');
    expect(titles).toContain('Field "note" added');
    expect(titles).toContain("Value changed");

    expect(result.summary.potentiallyBreaking).toBe(0);
    expect(result.session.findings.some((finding) => finding.severity === "critical")).toBe(true);
  });

  it("detects breaking changes in plain JSON payloads", () => {
    const result = compareApis('{"a": 1, "b": "x"}', '{"a": "1", "b": "x"}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.isSchemaComparison).toBe(false);
    expect(result.changes.some((change) => change.title === 'Type changed: number → string' && change.severity === "breaking")).toBe(true);
  });

  it("flags object↔array flips as breaking", () => {
    const result = compareApis('{"a": {"x": 1}}', '{"a": [1]}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changes.some((change) => change.title === "Shape changed: object → array" && change.severity === "breaking")).toBe(true);
  });

  it("treats added fields as non-breaking and removed fields as breaking", () => {
    const added = compareApis('{"a": 1}', '{"a": 1, "new": 2}');
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.changes.some((change) => change.title === 'Field "new" added' && change.severity === "non-breaking")).toBe(true);

    const removed = compareApis('{"a": 1, "old": 2}', '{"a": 1}');
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.changes.some((change) => change.title === 'Field "old" removed' && change.severity === "breaking")).toBe(true);
  });

  it("marks null↔value transitions as potentially Breaking", () => {
    const result = compareApis('{"meta": {"note": null}}', '{"meta": {"note": "hello"}}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changes.some((change) => change.title === "Nullable → non-null" && change.severity === "potentially-breaking")).toBe(true);
  });

  it("reports required-relaxation as non-breaking and required-addition as breaking", () => {
    const relaxed = compareApis(
      '{"type":"object","required":["a","b"],"properties":{"a":{"type":"string"},"b":{"type":"string"}}}',
      '{"type":"object","required":["a"],"properties":{"a":{"type":"string"},"b":{"type":"string"}}}',
    );
    expect(relaxed.ok).toBe(true);
    if (!relaxed.ok) return;
    expect(relaxed.changes.some((change) => change.title === 'Required constraint relaxed for "b"')).toBe(true);

    const tightened = compareApis(
      '{"type":"object","required":["a"],"properties":{"a":{"type":"string"}}}',
      '{"type":"object","required":["a","b"],"properties":{"a":{"type":"string"},"b":{"type":"string"}}}',
    );
    expect(tightened.ok).toBe(true);
    if (!tightened.ok) return;
    expect(tightened.changes.some((change) => change.title === 'New required field "b"' && change.severity === "breaking")).toBe(true);
  });

  it("detects enum removals as breaking and type relaxations as non-breaking", () => {
    const enumRemoved = compareApis(
      '{"type":"string","enum":["a","b","c"]}',
      '{"type":"string","enum":["a","b"]}',
    );
    expect(enumRemoved.ok).toBe(true);
    if (!enumRemoved.ok) return;
    expect(enumRemoved.changes.some((change) => change.title === 'Enum value "c" removed' && change.severity === "breaking")).toBe(true);

    const relaxedType = compareApis(
      '{"type":"string","x":1}',
      '{"type":["string","null"],"x":1}',
    );
    expect(relaxedType.ok).toBe(true);
    if (!relaxedType.ok) return;
    const change = relaxedType.changes.find((entry) => entry.title.includes('Type changed: "string" → ["string","null"]'));
    expect(change?.severity).toBe("non-breaking");
  });

  it("returns no changes for identical documents", () => {
    const result = compareApis('{"a": 1}', '{"a": 1}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changes).toEqual([]);
    expect(result.summary).toEqual({ breaking: 0, potentiallyBreaking: 0, nonBreaking: 0, informational: 0 });
  });

  it("reports JSON parse failures", () => {
    const result = compareApis("{", '{"a": 1}');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/JSON A/);
  });

  it("keeps every affected path resolvable with before/after values", () => {
    const sample = buildApiDiffSample();
    const result = compareApis(sample.previous, sample.current);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const change of result.changes) {
      expect(change.path).toMatch(/^\$/);
      expect(change.title.length).toBeGreaterThan(0);
      if (change.kind !== "added") expect(change.before).toBeDefined();
      if (change.kind !== "removed") expect(change.after).toBeDefined();
    }
    const severities = types(result.changes);
    expect(severities[0]).toBe("breaking");
  });
});

describe("looksLikeSchema", () => {
  it("recognizes schema-shaped documents", () => {
    expect(looksLikeSchema({ type: "object", properties: {} })).toBe(true);
    expect(looksLikeSchema({ required: ["a"] })).toBe(true);
    expect(looksLikeSchema({ enum: ["a"] })).toBe(true);
    expect(looksLikeSchema({ items: {} })).toBe(true);
    expect(looksLikeSchema({ a: 1 })).toBe(false);
    expect(looksLikeSchema([1])).toBe(false);
    expect(looksLikeSchema(null)).toBe(false);
  });
});