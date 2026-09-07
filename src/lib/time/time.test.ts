import { describe, expect, it } from "vitest";
import { parseTimestampText } from "@/lib/time/parse";
import {
  isValidZone,
  zoneOffsetMinutes,
  formatOffset,
  wallToInstant,
  TZ_ABBREVIATIONS,
} from "@/lib/time/zones";
import {
  calendarInfo,
  formatZoned,
  zoneLine,
  offsetText,
  precisionReport,
  unixRangeReport,
  relativePhrase,
  humanizeDuration,
} from "@/lib/time/inspect";
import {
  difference,
  humanizeDurationBig,
  compareTimestamps,
  evaluateArithmetic,
  extractLogTimestamps,
  analyzeJwt,
  parseHttpTimestamps,
  epochUnits,
} from "@/lib/time/analyze";

const IST = "Asia/Kolkata";
const OPTS = { primaryTz: IST };
const BASE = Date.UTC(2026, 0, 15, 12, 0, 0); // 2026-01-15T12:00:00Z

describe("parseTimestampText · numeric", () => {
  it("detects unix seconds for <=10-digit values", () => {
    const p = parseTimestampText("1736956800", OPTS);
    expect(p.ok).toBe(true);
    expect(p.kind).toBe("unix-seconds");
    expect(p.ns).toBe(1736956800n * 1_000_000_000n);
    expect(p.date?.toISOString()).toBe("2025-01-15T16:00:00.000Z");
  });

  it("detects unix milliseconds (13-digit)", () => {
    const p = parseTimestampText("1736956800000", OPTS);
    expect(p.kind).toBe("unix-milliseconds");
    expect(p.ns).toBe(1736956800000n * 1_000_000n);
  });

  it("detects unix microseconds (16-digit)", () => {
    const p = parseTimestampText("1736956800000000", OPTS);
    expect(p.kind).toBe("unix-microseconds");
    expect(p.ns).toBe(1736956800000000n * 1_000n);
  });

  it("detects unix nanoseconds (19-digit) and keeps the exact value", () => {
    const p = parseTimestampText("1736956800123456789", OPTS);
    expect(p.kind).toBe("unix-nanoseconds");
    expect(p.ns).toBe(1736956800123456789n);
    expect(p.date?.getTime()).toBe(1736956800123);
  });

  it("treats epoch 0 as unix seconds with full confidence", () => {
    const p = parseTimestampText("0", OPTS);
    expect(p.kind).toBe("unix-seconds");
    expect(p.confidence).toBe(100);
    expect(p.ns).toBe(0n);
    expect(p.date?.toISOString()).toBe("1970-01-01T00:00:00.000Z");
  });

  it("handles negative values", () => {
    const p = parseTimestampText("-1", OPTS);
    expect(p.kind).toBe("unix-seconds");
    expect(p.ns).toBe(-1_000_000_000n);
    expect(p.date?.toISOString()).toBe("1969-12-31T23:59:59.000Z");
  });

  it("flags 11-digit values as possibly milliseconds", () => {
    const p = parseTimestampText("99999999999", OPTS);
    expect(p.kind).toBe("unix-seconds");
    expect(p.confidence).toBeLessThan(100);
    expect(p.ambiguity).toBeDefined();
    expect(p.ambiguity?.map((a) => a.label)).toContain("Unix milliseconds");
  });

  it("rejects larger-than-recent numbers with honest confidence", () => {
    const far = parseTimestampText("1000000000000000000000", OPTS);
    expect(far.ok).toBe(true);
    expect(far.confidence).toBeLessThan(50);
  });

  it("rejects absurd magnitudes and garbage", () => {
    const huge = parseTimestampText("1" + "0".repeat(31), OPTS);
    expect(huge.ok).toBe(false);
    const garbage = parseTimestampText("not a time", OPTS);
    expect(garbage.ok).toBe(false);
    expect(parseTimestampText("", OPTS).ok).toBe(false);
  });
});

describe("parseTimestampText · text formats", () => {
  it("parses ISO-8601 UTC with fractional seconds", () => {
    const p = parseTimestampText("2026-09-07T16:00:00.123Z", OPTS);
    expect(p.kind).toBe("iso-8601");
    expect(p.confidence).toBe(100);
    expect(p.date?.toISOString()).toBe("2026-09-07T16:00:00.123Z");
  });

  it("parses ISO-8601 with an inline numeric offset", () => {
    const p = parseTimestampText("2026-01-15T12:00:00+05:30", OPTS);
    expect(p.date?.toISOString()).toBe("2026-01-15T06:30:00.000Z");
  });

  it("treats date-only ISO as UTC midnight", () => {
    const p = parseTimestampText("2026-01-15", OPTS);
    expect(p.date?.toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });

  it("parses RFC 1123 HTTP dates", () => {
    const p = parseTimestampText("Thu, 15 Jan 2026 12:00:00 GMT", OPTS);
    expect(p.kind).toBe("rfc-1123");
    expect(p.date?.getTime()).toBe(BASE);
  });

  it("interprets zone-less wall times in the primary timezone", () => {
    const p = parseTimestampText("2026-01-15 12:00:00", OPTS);
    expect(p.wall?.tz).toBe(IST);
    expect(p.date?.toISOString()).toBe("2026-01-15T06:30:00.000Z");
  });

  it("honours an IST suffix", () => {
    const p = parseTimestampText("2026-01-15 12:00:00 IST", OPTS);
    expect(p.wall?.tz).toBe(IST);
    expect(p.date?.toISOString()).toBe("2026-01-15T06:30:00.000Z");
  });

  it("detects DST gaps and overlaps in wall times", () => {
    const gap = parseTimestampText("2026-03-08 02:30:00", { primaryTz: "America/New_York" });
    expect(gap.dstWarn?.state).toBe("nonexistent");
    const overlap = parseTimestampText("2026-11-01 01:30:00", { primaryTz: "America/New_York" });
    expect(overlap.dstWarn?.state).toBe("ambiguous");
  });

  it("supports the literal 'now'", () => {
    const p = parseTimestampText("now", OPTS);
    expect(p.ok).toBe(true);
    expect(p.isNow).toBe(true);
    expect(p.ns).toBeDefined();
  });
});

describe("zones", () => {
  it("reports offsets and formatting", () => {
    expect(zoneOffsetMinutes("Asia/Kolkata", 0)).toBe(330);
    expect(formatOffset(-330)).toBe("-05:30");
    expect(formatOffset(570)).toBe("+09:30");
    expect(isValidZone("America/New_York")).toBe(true);
    expect(isValidZone("Not/AZone")).toBe(false);
    expect(TZ_ABBREVIATIONS.EST).toBe("America/New_York");
    expect(TZ_ABBREVIATIONS.CDT).toBe("America/Chicago");
  });

  it("marks wall times inside a spring-forward gap as nonexistent", () => {
    const r = wallToInstant("America/New_York", 2026, 3, 8, 2, 30, 0);
    expect(r.state).toBe("nonexistent");
  });

  it("marks wall times in a fall-back overlap as ambiguous", () => {
    const r = wallToInstant("America/New_York", 2026, 11, 1, 1, 30, 0);
    expect(r.state).toBe("ambiguous");
    expect(r.ambiguousInstants).toBeDefined();
    expect(r.ambiguousInstants?.length).toBeGreaterThanOrEqual(2);
  });

  it("resolves unambiguous instances uniquely", () => {
    const r = wallToInstant("Asia/Kolkata", 2026, 1, 15, 12, 0, 0);
    expect(r.state).toBe("unique");
    expect(r.instant).toBe(Date.UTC(2026, 0, 15, 6, 30, 0));
  });
});

describe("inspect", () => {
  it("computes calendar facts in a named zone", () => {
    const c = calendarInfo("Asia/Kolkata", Date.UTC(2026, 0, 15, 6, 30, 0));
    expect(c.year).toBe(2026);
    expect(c.month).toBe(1);
    expect(c.day).toBe(15);
    expect(c.weekdayName).toBe("Thursday");
    expect(c.dayOfYear).toBe(15);
    expect(c.quarter).toBe(1);
    expect(c.leapYear).toBe(false);
  });

  it("renders zone lines and clock text", () => {
    expect(zoneLine("Asia/Kolkata", 0)).toBe("IST (UTC+05:30) · Asia/Kolkata");
    expect(zoneLine("UTC", 0)).toBe("UTC");
    expect(formatZoned("UTC", BASE)).toBe("2026-01-15 12:00:00");
    expect(offsetText("Asia/Kolkata", 0)).toBe("+05:30");
  });

  it("reports nanoseconds precision carefully", () => {
    const p = precisionReport("unix-nanoseconds", 1736956800123456789n);
    expect(p.unitLabel).toBe("Nanoseconds");
    expect(p.jsNumberSafe).toBe(false);
    expect(p.int64Fits).toBe(true);
    expect(p.int32SecondsFits).toBe(true);
    const beyond = precisionReport("unix-nanoseconds", 4102444800n * 1_000_000_000n);
    expect(beyond.int32SecondsFits).toBe(false);
  });

  it("reports int32/int64 unix ranges", () => {
    const r = unixRangeReport(4102444800n * 1_000_000_000n);
    expect(r.int32).toBe(false);
    expect(r.beyond2038).toBe(true);
    expect(r.int64).toBe(true);
    expect(r.yearOfInput).toBe("2100");
  });

  it("phrases relative time and durations", () => {
    expect(relativePhrase(-2 * 3_600_000)).toBe("2 hours ago");
    expect(relativePhrase(3 * 86_400_000)).toBe("in 3 days");
    expect(humanizeDuration((3 * 86_400_000) + (4 * 3_600_000))).toBe("3 days 4 hours");
    expect(humanizeDurationBig(172_800n)).toBe("2 days");
  });
});

describe("analyze", () => {
  it("breaks down epoch units exactly", () => {
    const u = epochUnits(1736956800n * 1_000_000_000n);
    expect(u.seconds).toBe("1736956800");
    expect(u.milliseconds).toBe("1736956800000");
    expect(u.microseconds).toBe("1736956800000000");
    expect(u.nanoseconds).toBe("1736956800000000000");
  });

  it("computes differences between timestamps", () => {
    const a = parseTimestampText("2026-01-15T12:00:00Z", OPTS);
    const b = parseTimestampText("2026-01-17T12:00:00Z", OPTS);
    const d = difference(a, b);
    expect(d?.totalDays).toBe("2");
    expect(d?.future).toBe(true);
    expect(d?.human).toBe("2 days");
  });

  it("flags rows that break chronological order", () => {
    const r = compareTimestamps("2026-01-10T10:00:00Z\n2026-01-05T10:00:00Z\n2026-01-08T10:00:00Z", OPTS);
    expect(r.invalidCount).toBe(0);
    expect(r.rows[0].outOfOrder).toBe(false);
    expect(r.rows[1].outOfOrder).toBe(true);
    expect(r.rows[2].outOfOrder).toBe(true);
    expect(r.earliest).toBe(parseTimestampText("2026-01-05T10:00:00Z", OPTS).ns?.toString());
  });

  it("evaluates arithmetic expressions on timestamps", () => {
    const r = evaluateArithmetic("2026-01-15T12:00:00Z + 2h", OPTS, BASE);
    expect(r.ok).toBe(true);
    expect(r.ops).toEqual(["+2h"]);
    expect(r.date?.toISOString()).toBe("2026-01-15T14:00:00.000Z");
  });

  it("evaluates arithmetic relative to now", () => {
    const base = Date.UTC(2026, 0, 15, 12, 0, 0);
    const r = evaluateArithmetic("now - 1d", OPTS, base);
    expect(r.date?.getTime()).toBe(base - 86_400_000);
  });

  it("extracts timestamps from log lines and orders them", () => {
    const log = [
      "[2025-01-15T12:00:00Z] auth ok",
      "[2025-01-15T12:00:00Z] unrelated",
      "[2025-01-15T12:05:00Z] retry",
    ].join("\n");
    const r = extractLogTimestamps(log, OPTS, "Europe/Paris");
    expect(r.count).toBe(3);
    expect(r.rows[0].original).toBe("2025-01-15T12:00:00Z");
    expect(r.chronological[0].utc).toBe("2025-01-15 12:00:00");
    expect(r.chronological[1].utc).toBe("2025-01-15 12:00:00");
    expect(r.chronological[2].utc).toBe("2025-01-15 12:05:00");
  });

  it("reports JWT claim validity and TTL from JSON", () => {
    const now = Date.UTC(2026, 0, 15, 12, 0, 0);
    const json = JSON.stringify({ iss: "opencode", iat: now / 1000, exp: now / 1000 + 86400 });
    const r = analyzeJwt(json, now);
    expect(r.ok).toBe(true);
    expect(r.iss).toBe("opencode");
    expect(r.status).toBe("valid");
    expect(r.ttl).toBe("1 day");
  });

  it("flags expired JWTs", () => {
    const now = Date.UTC(2026, 0, 15, 12, 0, 0);
    const r = analyzeJwt(JSON.stringify({ exp: now / 1000 - 1 }), now);
    expect(r.status).toBe("expired");
  });

  it("decodes HTTP header timestamps and retry-after deltas", () => {
    const r = parseHttpTimestamps(
      ["Date: Thu, 15 Jan 2026 12:00:00 GMT", "Retry-After: 120", "Expires: not-a-date"].join("\n"),
      OPTS,
      BASE,
    );
    expect(r.rows[0].ok).toBe(true);
    expect(r.rows[0].ist).toBe("2026-01-15 17:30:00 IST");
    expect(r.rows[1].ok).toBe(true);
    expect(r.rows[1].ist).toMatch(/ IST$/);
    expect(r.rows[2].ok).toBe(false);
    expect(r.rows[2].ist).toBeNull();
  });
});