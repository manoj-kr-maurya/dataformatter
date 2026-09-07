/**
 * Inspection helpers: calendar facts, precision/range analysis, relative time
 * and human-readable durations. All calendar math is in a named zone's wall
 * clock; epoch math stays exact with BigInt.
 */

import {
  formatOffset,
  wallParts,
  type WallParts,
} from "@/lib/time/zones";
import { epochFromNs } from "@/lib/time/parse";

export interface CalendarInfo {
  year: number;
  month: number;
  monthName: string;
  day: number;
  weekdayName: string;
  dayOfYear: number;
  isoWeekYear: number;
  isoWeek: number;
  quarter: number;
  leapYear: boolean;
}

function isoWeek(y: number, mo: number, d: number): { year: number; week: number } {
  const date = new Date(Date.UTC(y, mo - 1, d));
  const dayNum = date.getUTCDay() || 7; // 1=Mon .. 7=Sun
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Wall-clock calendar facts for `ms` in `zone`. */
export function calendarInfo(zone: string, ms: number): CalendarInfo {
  const w = wallParts(zone, ms);
  const leapYear = (w.year % 4 === 0 && w.year % 100 !== 0) || w.year % 400 === 0;
  const dayOfYear = Math.floor((Date.UTC(w.year, w.month - 1, w.day) - Date.UTC(w.year, 0, 1)) / 86_400_000) + 1;
  const iso = isoWeek(w.year, w.month, w.day);
  return {
    year: w.year,
    month: w.month,
    monthName: MONTH_NAMES[w.month - 1] ?? "",
    day: w.day,
    weekdayName: w.weekdayName,
    dayOfYear,
    isoWeekYear: iso.year,
    isoWeek: iso.week,
    quarter: Math.floor((w.month - 1) / 3) + 1,
    leapYear,
  };
}

/** "2026-09-07 16:00:00" in a zone's wall clock. */
export function formatZoned(zone: string, ms: number): string {
  const w = wallParts(zone, ms);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${w.year}-${p2(w.month)}-${p2(w.day)} ${p2(w.hour)}:${p2(w.minute)}:${p2(w.second)}`;
}

/** "2026-09-07" in a zone's wall clock. */
export function formatZonedDate(zone: string, ms: number): string {
  const w = wallParts(zone, ms);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${w.year}-${p2(w.month)}-${p2(w.day)}`;
}

/** Zone identity line, e.g. "IST (UTC+05:30) · Asia/Kolkata". */
export function zoneLine(zone: string, ms: number): string {
  if (zone === "UTC") return "UTC";
  if (zone === "Asia/Kolkata") return "IST (UTC+05:30) · Asia/Kolkata";
  const w = wallParts(zone, ms);
  return `${w.shortName} (${w.offsetLabel}) · ${zone}`;
}

export interface PrecisionReport {
  unitLabel: string;
  /** JS number would lose the sub-ms tail or exceed MAX_SAFE_INTEGER. */
  jsNumberSafe: boolean;
  jsDateSafe: boolean;
  bigintSafe: true;
  int64Fits: boolean;
  int32SecondsFits: boolean;
}

const MAX_SAFE = 9_007_199_254_740_991n;
const MAX_INT64 = 9_223_372_036_854_775_807n;
const MIN_INT64 = -9_223_372_036_854_775_808n;
const MAX_INT32_S = 2_147_483_647n;
const MIN_INT32_S = -2_147_483_648n;

export const UNIT_PRIMES: Record<string, string> = {
  "unix-seconds": "Seconds",
  "unix-milliseconds": "Milliseconds",
  "unix-microseconds": "Microseconds",
  "unix-nanoseconds": "Nanoseconds",
  "iso-8601": "ISO-8601",
  "rfc-1123": "RFC 1123",
  date: "Date / time",
  now: "Milliseconds",
};

function floorDiv(a: bigint, b: bigint): bigint {
  return a >= 0n ? a / b : -((-a + b - 1n) / b);
}

export function precisionReport(kind: string, ns: bigint): PrecisionReport {
  const cache = epochFromNs(ns);
  const msBig = floorDiv(ns, 1_000_000n);
  const fractional = ns % 1_000_000n !== 0n;
  const jsNumberSafe = !fractional && msBig >= -MAX_SAFE && msBig <= MAX_SAFE;
  const jsDateSafe = cache.date !== null;
  const secs = floorDiv(ns, 1_000_000_000n);
  return {
    unitLabel: UNIT_PRIMES[kind] ?? "",
    jsNumberSafe,
    jsDateSafe,
    bigintSafe: true,
    int64Fits: secs >= MIN_INT64 && secs <= MAX_INT64,
    int32SecondsFits: secs >= MIN_INT32_S && secs <= MAX_INT32_S,
  };
}

export interface UnixRangeReport {
  int32MinS: string;
  int32MaxS: string;
  int32MinDate: string;
  int32MaxDate: string;
  int32: boolean;
  int64: boolean;
  beyond2038: boolean;
  yearOfInput: string;
}

export function unixRangeReport(ns: bigint): UnixRangeReport {
  const secs = floorDiv(ns, 1_000_000_000n);
  const int32 = secs >= MIN_INT32_S && secs <= MAX_INT32_S;
  const int64 = secs >= MIN_INT64 && secs <= MAX_INT64;
  const minDate = new Date(Number(MIN_INT32_S * 1_000_000_000n / 1_000_000n));
  const maxDate = new Date(Number(MAX_INT32_S * 1_000_000_000n / 1_000_000n));
  const date = epochFromNs(ns).date;
  return {
    int32MinS: MIN_INT32_S.toString(),
    int32MaxS: MAX_INT32_S.toString(),
    int32MinDate: minDate.toISOString().replace("T", " ").replace(".000Z", " UTC"),
    int32MaxDate: maxDate.toISOString().replace("T", " ").replace(".000Z", " UTC"),
    int32,
    int64,
    beyond2038: !int32,
    yearOfInput: date ? String(date.getUTCFullYear()) : "—",
  };
}

/** Compact relative age used across panels (kept identical to the old converter). */
export function relativeUnit(diffMs: number): string {
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30.44);
  if (months < 12) return `${months}mo`;
  const years = Math.round(days / 365.25);
  return `${years}y`;
}

/** Human phrase relative to now, e.g. "2 hours ago" / "in 3 days". */
export function relativePhrase(diffMs: number): string {
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;
  const totalSeconds = Math.floor(abs / 1000);
  if (totalSeconds < 5) return "now";
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value = totalSeconds;
  let label = "second";
  for (const [size, name] of units) {
    label = name;
    if (Number.isFinite(size)) {
      if (value / size < 1) break;
      value = Math.floor(value / size);
    } else {
      value = Math.floor(value / 31536000);
    }
  }
  const plural = value === 1 ? label : `${label}s`;
  return future ? `in ${value} ${plural}` : `${value} ${plural} ago`;
}

/** "28 days 4 hours 32 minutes 17 seconds" (0-buckets collapsed). */
export function humanizeDuration(milliseconds: number): string {
  const abs = Math.abs(Math.round(milliseconds));
  const totalSeconds = Math.floor(abs / 1000);
  const buckets: [number, string][] = [
    [86_400, "day"],
    [3_600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];
  let remaining = totalSeconds;
  const parts: string[] = [];
  for (const [size, label] of buckets) {
    if (size === 1) {
      if (remaining > 0 || parts.length === 0) parts.push(`${remaining} second${remaining === 1 ? "" : "s"}`);
    } else {
      const count = Math.floor(remaining / size);
      remaining %= size;
      if (count > 0) parts.push(`${count} ${label}${count === 1 ? "" : "s"}`);
    }
  }
  return parts.join(" ") || "0 seconds";
}

/** Offset text such as "+05:30" for a zone abbreviation-aware display. */
export function offsetText(zone: string, ms: number): string {
  if (zone === "UTC") return "+00:00";
  return formatOffset(wallParts(zone, ms).offsetMinutes);
}

export type { WallParts };