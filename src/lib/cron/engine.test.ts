import { describe, expect, it } from "vitest";
import {
  validateCron,
  nextRuns,
  previousRuns,
  describeCron,
} from "@/lib/cron/engine";

const REF = Date.UTC(2026, 0, 15, 12, 0, 0); // Jan 15 2026 12:00 UTC

describe("validateCron", () => {
  it("accepts standard 5-field expressions", () => {
    expect(validateCron("*/5 * * * *").valid).toBe(true);
    expect(validateCron("0 9 * * 1-5").valid).toBe(true);
    expect(validateCron("30 14 1,15 * *").valid).toBe(true);
  });

  it("accepts 6-field with seconds", () => {
    expect(validateCron("*/10 * * * * *").valid).toBe(true);
  });

  it("rejects malformed expressions", () => {
    expect(validateCron("* * *").valid).toBe(false);
    expect(validateCron("60 * * * *").valid).toBe(false);
    expect(validateCron("x * * * *").valid).toBe(false);
  });
});

describe("nextRuns", () => {
  it("computes daily-at-noon runs", () => {
    const runs = nextRuns("0 12 * * *", REF, 2, "UTC");
    expect(new Date(runs[0]).toISOString()).toBe("2026-01-16T12:00:00.000Z");
    expect(new Date(runs[1]).toISOString()).toBe("2026-01-17T12:00:00.000Z");
  });

  it("computes every-5-minutes runs", () => {
    const runs = nextRuns("*/5 * * * *", REF, 2, "UTC");
    expect(runs[0]).toBe(REF + 5 * 60_000);
    expect(runs[1]).toBe(REF + 10 * 60_000);
  });

  it("respects weekday restriction", () => {
    const runs = nextRuns("0 9 * * 1", REF, 1, "UTC"); // Mondays
    const run = new Date(runs[0]);
    expect(run.getUTCDay()).toBe(1); // Monday
  });

  it("handles month names and seconds precision", () => {
    const runs = nextRuns("*/30 9 * JAN *", REF, 1, "UTC");
    expect(new Date(runs[0]).toISOString()).toMatch(/^\d{4}-01-\d{2}T09:/);
  });
});

describe("previousRuns", () => {
  it("returns the run strictly before the reference", () => {
    const runs = previousRuns("0 12 * * *", REF, 1, "UTC");
    expect(new Date(runs[0]).toISOString()).toBe("2026-01-14T12:00:00.000Z");
  });

  it("returns the same clock time when the reference is just after it", () => {
    const runs = previousRuns("0 12 * * *", REF + 60_000, 1, "UTC");
    expect(new Date(runs[0]).toISOString()).toBe("2026-01-15T12:00:00.000Z");
  });
});

describe("describeCron", () => {
  it("produces a readable summary", () => {
    const desc = describeCron("0 12 * * 1");
    expect(desc).toMatch(/12/);
    expect(desc).toMatch(/day-of-week mon/);
  });
});