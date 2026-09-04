import { describe, expect, it } from "vitest";
import { parseTimestamp, toParts, relativeTime, nowInZone } from "@/lib/timestamp/convert";

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

describe("parseTimestamp", () => {
  it("parses unix seconds and milliseconds", () => {
    expect(parseTimestamp("1736956800").ms).toBe(1736956800000);
    expect(parseTimestamp("1736956800000").ms).toBe(1736956800000);
  });

  it("parses ISO-8601 strings", () => {
    expect(parseTimestamp("2026-01-15T12:00:00Z").ms).toBe(NOW);
  });

  it("parses RFC-1123 HTTP dates", () => {
    expect(parseTimestamp("Thu, 15 Jan 2026 12:00:00 GMT").ms).toBe(NOW);
  });

  it("rejects garbage", () => {
    expect(parseTimestamp("nonsense").valid).toBe(false);
    expect(parseTimestamp("").valid).toBe(false);
  });
});

describe("toParts", () => {
  const parts = toParts(1736956800000, NOW);
  it("converts across epoch units", () => {
    expect(parts.seconds).toBe(1736956800);
    expect(parts.microseconds).toBe(1736956800000000);
    expect(parts.nanoseconds).toBe(1736956800000000000);
  });
  it("computes relative nicely", () => {
    expect(relativeTime(90_000)).toBe("2m");
    expect(relativeTime(3_600_000)).toBe("1h");
  });
  it("flags future vs past", () => {
    expect(parts.isFuture).toBe(false);
    expect(toParts(NOW + 1000, NOW).isFuture).toBe(true);
  });
});

describe("nowInZone", () => {
  it("reports a wall clock for a named zone", () => {
    const ny = nowInZone("America/New_York", NOW);
    expect(ny.time).toMatch(/^\d{2}:/);
  });
});