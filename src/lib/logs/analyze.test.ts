import { describe, expect, it } from "vitest";
import { analyzeLogs } from "@/lib/logs/analyze";

const LOG = [
  "2026-01-01T10:00:01Z INFO  worker started",
  "2026-01-01T10:00:02Z DEBUG seeding cache",
  "2026-01-01T10:00:03Z WARN  retry #1 for job 42",
  "2026-01-01T10:00:04Z ERROR timed out connecting",
  "2026-01-01T10:00:05Z ERROR timed out connecting",
  "2026-01-01T10:15:00Z FATAL db disk is full",
].join("\n");

describe("analyzeLogs", () => {
  it("counts levels and total lines", () => {
    const result = analyzeLogs(LOG);
    expect(result.total).toBe(6);
    const byLevel = Object.fromEntries(result.levels.map((l) => [l.level, l.count]));
    expect(byLevel.INFO).toBe(1);
    expect(byLevel.DEBUG).toBe(1);
    expect(byLevel.WARN).toBe(1);
    expect(byLevel.ERROR).toBe(2);
    expect(byLevel.FATAL).toBe(1);
  });

  it("groups duplicate errors and reports unique count", () => {
    const result = analyzeLogs(LOG);
    expect(result.uniqueErrors).toBe(2);
    const top = result.errorGroups[0];
    expect(top.count).toBe(2);
    expect(top.message).toContain("timed out");
  });

  it("produces an hourly timeline from ISO timestamps", () => {
    const result = analyzeLogs(LOG);
    expect(result.timeline).not.toBeNull();
    const hour10 = result.timeline?.find((b) => b.hour === 10);
    expect(hour10?.error).toBe(2);
  });

  it("handles JSON log lines", () => {
    const result = analyzeLogs(JSON.stringify({ level: "ERROR", message: "boom", timestamp: "2026-01-01T10:00:00Z" }));
    expect(result.levels.find((l) => l.level === "ERROR")?.count).toBe(1);
  });

  it("handles nginx access lines without crashing", () => {
    const result = analyzeLogs('127.0.0.1 - - [01/Jan/2026:10:00:00 +0000] "GET /health HTTP/1.1" 200 23');
    expect(result.total).toBe(1);
    expect(result.levels.find((l) => l.level === "HTTP")?.count).toBe(1);
  });

  it("returns no timeline when timestamps are absent", () => {
    const result = analyzeLogs("ERROR boom\nINFO fine");
    expect(result.timeline).toBeNull();
  });
});