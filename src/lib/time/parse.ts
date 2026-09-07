/**
 * Timestamp detection engine. Produces an exact epoch instant (as BigInt
 * nanoseconds) from Unix numeric values, ISO-8601, RFC-1123 and common wall
 * time shapes, with a confidence score, ambiguity candidates and DST clues
 * when a zone-less time is interpreted in a named zone.
 */

import {
  isValidZone,
  TZ_ABBREVIATIONS,
  wallToInstant,
  type WallToInstantResult,
} from "@/lib/time/zones";

export type TimestampKind =
  | "unix-seconds"
  | "unix-milliseconds"
  | "unix-microseconds"
  | "unix-nanoseconds"
  | "iso-8601"
  | "rfc-1123"
  | "date"
  | "now";

const NS_PER_SEC = 1_000_000_000n;
const NS_PER_MS = 1_000_000n;
const NS_PER_US = 1_000n;
const MAX_DATE_MS = 8_640_000_000_000_000n; // Date range boundary (±8.64e15 ms)

export interface AmbiguityCandidate {
  label: string;
  ns: bigint;
  /** Human year under that interpretation, or null when beyond the Date range. */
  year: string | null;
}

export interface ParsedTimestamp {
  ok: boolean;
  error?: string;
  kind?: TimestampKind;
  /** Display label such as "Unix seconds". */
  label?: string;
  /** 0-100 heuristic confidence for numeric input; 100 for explicit formats. */
  confidence?: number;
  ns?: bigint;
  /** Best epoch instant; null when out of the JS Date range. */
  date?: Date | null;
  raw?: string;
  /** Alternate unit interpretations for numeric input. */
  ambiguity?: AmbiguityCandidate[];
  /** The zone a wall time without offset was interpreted in. */
  wall?: { tz: string };
  /** DST warning from interpreting a zone-less wall time. */
  dstWarn?: WallToInstantResult;
  /** Present for the literal input "now". */
  isNow?: boolean;
}

export interface ParseOptions {
  /** Zone used to interpret zone-less wall times. Defaults to Asia/Kolkata. */
  primaryTz: string;
}

/** Canonical epoch math shared by every panel. */
export interface EpochCache {
  ns: bigint;
  date: Date | null;
  msNumber: number | null;
}

function floorDiv(a: bigint, b: bigint): bigint {
  return a >= 0n ? a / b : -((-a + b - 1n) / b);
}

/** Canonical epoch math shared by every panel. */
export function epochFromNs(ns: bigint): EpochCache {
  const msBig = floorDiv(ns, NS_PER_MS);
  let date: Date | null = null;
  let msNumber: number | null = null;
  if (msBig >= -MAX_DATE_MS && msBig <= MAX_DATE_MS) {
    msNumber = Number(msBig);
    date = new Date(msNumber);
  }
  return { ns, date, msNumber };
}

export const KIND_LABELS: Record<TimestampKind, string> = {
  "unix-seconds": "Unix seconds",
  "unix-milliseconds": "Unix milliseconds",
  "unix-microseconds": "Unix microseconds",
  "unix-nanoseconds": "Unix nanoseconds",
  "iso-8601": "ISO-8601",
  "rfc-1123": "RFC 1123",
  date: "Date / time",
  now: "Current time",
};

function scoreYear(year: number): number {
  if (year >= 1969 && year <= 2075) return 0.99;
  if ((year >= 1900 && year < 1969) || (year > 2075 && year <= 2300)) return 0.85;
  if (year > 1300 && year < 1900) return 0.5;
  return 0.2;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

interface UnitCandidate {
  label: string;
  kind: TimestampKind;
  ns: bigint;
  year: number | null;
  score: number;
}

const UNIT_TABLE: { label: string; kind: TimestampKind; factor: bigint }[] = [
  { label: "s", kind: "unix-seconds", factor: NS_PER_SEC },
  { label: "ms", kind: "unix-milliseconds", factor: NS_PER_MS },
  { label: "us", kind: "unix-microseconds", factor: NS_PER_US },
  { label: "ns", kind: "unix-nanoseconds", factor: 1n },
];

function buildUnitCandidates(big: bigint): UnitCandidate[] {
  return UNIT_TABLE.map((u) => {
    const ns = big * u.factor;
    const date = epochFromNs(ns).date;
    const year = date ? date.getUTCFullYear() : null;
    return { label: u.label, kind: u.kind, ns, year, score: year === null ? 0.05 : scoreYear(year) };
  });
}

/**
 * Standard digit-anchored unit mapping, preserving the legacy seconds-first
 * behaviour for <=10-digit values while routing 13/16/19-digit values to
 * ms/us/ns (matching epochconverter conventions). 11-digit values stay
 * seconds (legacy) but are flagged as possibly millisecond timestamps.
 */
function pickNumericPrimary(big: bigint, candidates: UnitCandidate[]): UnitCandidate {
  const byKind = (kind: TimestampKind) => candidates.find((c) => c.kind === kind)!;
  const abs = big < 0n ? -big : big;
  const digits = abs.toString().length;
  if (digits <= 10) return byKind("unix-seconds");
  if (digits === 11) return byKind("unix-seconds");
  if (digits === 12 || digits === 13) return byKind("unix-milliseconds");
  if (digits === 14 || digits === 15 || digits === 16) return byKind("unix-microseconds");
  if (digits === 17 || digits === 18 || digits === 19) return byKind("unix-nanoseconds");
  return byKind("unix-nanoseconds");
}

/** Ambiguity candidates, listed only when alternative units are genuinely plausible. */
function numericAmbiguity(big: bigint, candidates: UnitCandidate[], chosen: UnitCandidate): AmbiguityCandidate[] {
  const abs = big < 0n ? -big : big;
  const digits = abs.toString().length;
  const yearOf = (c: UnitCandidate) => (c.year === null ? null : String(c.year));
  const mapOther = (kind: TimestampKind) => {
    const c = candidates.find((x) => x.kind === kind)!;
    return { label: KIND_LABELS[kind], ns: c.ns, year: yearOf(c) };
  };

  if (digits === 11) {
    const ms = candidates.find((x) => x.kind === "unix-milliseconds")!;
    const s = candidates.find((x) => x.kind === "unix-seconds")!;
    return [
      { label: KIND_LABELS["unix-seconds"], ns: s.ns, year: yearOf(s) },
      { label: KIND_LABELS["unix-milliseconds"], ns: ms.ns, year: yearOf(ms) },
    ];
  }
  if (digits === 12 || digits === 13) {
    if (chosen.kind === "unix-milliseconds" && chosen.score < 0.6) {
      return [mapOther("unix-seconds"), mapOther("unix-microseconds")];
    }
    return [];
  }
  if (chosen.score < 0.5) {
    return candidates.filter((c) => c.kind !== chosen.kind).map((c) => ({ label: KIND_LABELS[c.kind], ns: c.ns, year: yearOf(c) }));
  }
  return [];
}

/** Numeric with optional sign: seconds/ms/us/ns disambiguation. */
function parseNumeric(raw: string): ParsedTimestamp {
  const signed = raw.trim();
  if (!/^[+-]?\d+$/.test(signed)) return { ok: false, error: "Not a number." };
  const big = BigInt(signed.replace(/^\+/, ""));
  if (big > 10n ** 30n || big < -(10n ** 30n)) {
    return { ok: false, error: "Number is too large to map to a date." };
  }

  if (big === 0n) {
    return {
      ok: true,
      kind: "unix-seconds",
      label: KIND_LABELS["unix-seconds"],
      confidence: 100,
      ns: 0n,
      date: new Date(0),
      raw: signed,
      ambiguity: undefined,
    };
  }

  const candidates = buildUnitCandidates(big);
  const chosen = pickNumericPrimary(big, candidates);
  const cache = epochFromNs(chosen.ns);

  // A value like 1736956800123456789 (19 digits, ns) carries sub-millisecond
  // precision; keep the exact BigInt as `ns` but only a Date for display.
  if (!cache.date && chosen.score > 0) {
    return {
      ok: false,
      error: "Value is outside the representable date range (about year 275760).",
    };
  }

  const ambiguity = numericAmbiguity(big, candidates, chosen);
  return {
    ok: true,
    kind: chosen.kind,
    label: KIND_LABELS[chosen.kind],
    confidence: Math.round(chosen.score * 100),
    ns: chosen.ns,
    date: cache.date,
    raw: signed,
    ambiguity: ambiguity.length > 0 ? ambiguity : undefined,
  };
}

function utcFromYmd(y: number, mo: number, d: number, h: number, mi: number, s: number, ms: number): Date | null {
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > daysInMonth(y, mo)) return null;
  if (h < 0 || h > 23 || mi < 0 || mi > 59 || s < 0 || s > 59 || ms < 0 || ms > 999) return null;
  const date = new Date(0);
  date.setUTCFullYear(y, mo - 1, d);
  date.setUTCHours(h, mi, s, ms);
  if (y < -271821 || y > 275760 || Number.isNaN(date.getTime())) return null;
  return date;
}

const ISO_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?(?:[Zz]|([+-])(\d{2}):(\d{2}))?$/;

const RFC1123_RE =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}) (\d{2}):(\d{2}):(\d{2}) (?:GMT|UTC|([+-])(\d{2})(\d{2}))$/;

const US_SLASH_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:(?:\s|T)(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?)?$/;

const EU_DASH_RE = /^(\d{1,2})-(\d{1,2})-(\d{4})(?:(?:\s|T)(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?)?$/;

const TEXT_MONTH_RE =
  /^(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})(?:(?:\s|T)(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?)?$/;

function isoMilliseconds(fraction: string): number {
  return Number((fraction + "000000000").slice(0, 3));
}

/** Result of resolving a zone-less wall time in a named zone. */
function parseWall(
  tz: string,
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number,
  ms = 0,
): ParsedTimestamp {
  const result = wallToInstant(tz, y, mo, d, h, mi, s, ms);
  const cache = epochFromNs(BigInt(Math.round(result.instant)) * NS_PER_MS);
  const parsed: ParsedTimestamp = {
    ok: true,
    kind: "date",
    label: KIND_LABELS["date"],
    confidence: 95,
    ns: BigInt(Math.round(result.instant)) * NS_PER_MS,
    date: cache.date,
    wall: { tz },
    raw: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
  };
  if (result.state !== "unique") parsed.dstWarn = result;
  return parsed;
}

/** "2026-09-07 16:00:00 IST" → tz resolved + text without the suffix. */
function interpretZoneSuffix(input: string, primaryTz: string): { tz: string; rest: string } {
  const match = input.match(/^(.*?)\s+([A-Za-z]{2,5}|[+-]\d{2}:\d{2})$/);
  if (!match) return { tz: primaryTz, rest: input.trim() };
  const suffix = match[2];
  if (/^[+-]\d{2}:\d{2}$/.test(suffix)) return { tz: "offset:" + suffix, rest: match[1].trim() };
  const mapped = TZ_ABBREVIATIONS[suffix.toUpperCase()];
  if (mapped) return { tz: mapped, rest: match[1].trim() };
  return { tz: primaryTz, rest: input.trim() };
}

function parseExplicitOffset(offsetText: string, rest: string): ParsedTimestamp | null {
  const m = offsetText.match(/^([+-])(\d{2})(\d{2})$/);
  if (!m) return null;
  const iso = ISO_RE.exec(rest);
  if (!iso || iso[4] === undefined) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const offsetMin = sign * (Number(m[2]) * 60 + Number(m[3]));
  const date = utcFromYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]), Number(iso[4]), Number(iso[5]), iso[6] ? Number(iso[6]) : 0, iso[7] ? isoMilliseconds(iso[7]) : 0);
  if (!date) return null;
  const instant = date.getTime() - offsetMin * 60_000;
  const cache = epochFromNs(BigInt(instant) * NS_PER_MS);
  return { ok: true, kind: "iso-8601", label: KIND_LABELS["iso-8601"], confidence: 100, ns: BigInt(instant) * NS_PER_MS, date: cache.date, raw: rest };
}

/** RFC 1123 date-times: `Thu, 15 Jan 2026 12:00:00 GMT` (or `+0530`). */
function parseRfcDate(m: RegExpExecArray, raw: string): ParsedTimestamp | null {
  const month = MONTHS.indexOf(m[2]);
  if (month === -1) return null;
  if (Number(m[4]) > 23) return { ok: false, error: "Invalid hour in RFC date." };
  const date = utcFromYmd(Number(m[3]), month + 1, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6]), 0);
  if (!date) return { ok: false, error: "Invalid RFC 1123 date." };
  let instant = date.getTime();
  if (m[7]) {
    const sign = m[7] === "-" ? -1 : 1;
    instant -= sign * (Number(m[8]) * 60 + Number(m[9])) * 60_000;
  }
  const cache = epochFromNs(BigInt(instant) * NS_PER_MS);
  return { ok: true, kind: "rfc-1123", label: KIND_LABELS["rfc-1123"], confidence: 100, ns: BigInt(instant) * NS_PER_MS, date: cache.date, raw };
}

function parseAmPmWall(
  tz: string,
  year: number,
  mo: number,
  d: number,
  hRaw: string | undefined,
  minRaw: string | undefined,
  secRaw: string | undefined,
  ampm: string | undefined,
): ParsedTimestamp | null {
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(year, mo)) return null;
  if (hRaw === undefined) {
    const date = utcFromYmd(year, mo, d, 0, 0, 0, 0);
    if (!date) return null;
    const cache = epochFromNs(BigInt(date.getTime()) * NS_PER_MS);
    return { ok: true, kind: "date", label: KIND_LABELS["date"], confidence: 85, ns: BigInt(date.getTime()) * NS_PER_MS, date: cache.date, wall: { tz }, raw: `${year}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
  }
  let hour = Number(hRaw);
  if (ampm && ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (ampm && ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  return parseWall(tz, year, mo, d, hour, Number(minRaw ?? "0"), secRaw ? Number(secRaw) : 0);
}

function parseSingleInput(single: string, tz: string): ParsedTimestamp | null {
  const iso = ISO_RE.exec(single);
  if (iso) {
    const y = Number(iso[1]);
    const mo = Number(iso[2]);
    const d = Number(iso[3]);
    if (iso[4] === undefined) {
      const date = utcFromYmd(y, mo, d, 0, 0, 0, 0);
      if (!date) return { ok: false, error: "Invalid date components." };
      const cache = epochFromNs(BigInt(date.getTime()) * NS_PER_MS);
      return { ok: true, kind: "date", label: KIND_LABELS["date"], confidence: 100, ns: BigInt(date.getTime()) * NS_PER_MS, date: cache.date, wall: { tz }, raw: single };
    }
    const hasExplicitZone = /[Zz]$/.test(single) || iso[8] !== undefined;
    if (hasExplicitZone) {
      const sign = iso[8] === "-" ? -1 : 1;
      const offsetMin = /[Zz]$/.test(single) ? 0 : sign * (Number(iso[9]) * 60 + Number(iso[10]));
      const date = utcFromYmd(y, mo, d, Number(iso[4]), Number(iso[5]), iso[6] ? Number(iso[6]) : 0, iso[7] ? isoMilliseconds(iso[7]) : 0);
      if (!date) return { ok: false, error: "Invalid date components." };
      const instant = date.getTime() - offsetMin * 60_000;
      const cache = epochFromNs(BigInt(instant) * NS_PER_MS);
      return { ok: true, kind: "iso-8601", label: KIND_LABELS["iso-8601"], confidence: 100, ns: BigInt(instant) * NS_PER_MS, date: cache.date, raw: single };
    }
    return parseWall(tz, y, mo, d, Number(iso[4]), Number(iso[5]), iso[6] ? Number(iso[6]) : 0, iso[7] ? isoMilliseconds(iso[7]) : 0);
  }

  const rfc = RFC1123_RE.exec(single);
  if (rfc) return parseRfcDate(rfc, single);

  const us = US_SLASH_RE.exec(single);
  if (us) return parseAmPmWall(tz, Number(us[3]), Number(us[1]), Number(us[2]), us[4], us[5], us[6], us[7]);

  const eu = EU_DASH_RE.exec(single);
  if (eu) return parseAmPmWall(tz, Number(eu[3]), Number(eu[2]), Number(eu[1]), eu[4], eu[5], eu[6], eu[7]);

  const textMonth = TEXT_MONTH_RE.exec(single);
  if (textMonth) {
    const monthIdx = MONTHS.indexOf(textMonth[2]);
    if (monthIdx !== -1) return parseAmPmWall(tz, Number(textMonth[3]), monthIdx + 1, Number(textMonth[1]), textMonth[4], textMonth[5], textMonth[6], textMonth[7]);
  }

  const asDate = new Date(single);
  if (!Number.isNaN(asDate.getTime())) {
    const cache = epochFromNs(BigInt(asDate.getTime()) * NS_PER_MS);
    return { ok: true, kind: "date", label: KIND_LABELS["date"], confidence: 80, ns: BigInt(asDate.getTime()) * NS_PER_MS, date: cache.date, raw: single };
  }

  return null;
}

/** The single entry point: detect anything. */
export function parseTimestampText(text: string, opts: ParseOptions): ParsedTimestamp {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Paste a timestamp." };

  if (trimmed.toLowerCase() === "now") {
    return { ok: true, kind: "now", label: "Current time", confidence: 100, ns: BigInt(Date.now()) * NS_PER_MS, date: new Date(), isNow: true, raw: trimmed };
  }

  if (/^[+-]?\d+$/.test(trimmed)) return parseNumeric(trimmed);

  const rfc = RFC1123_RE.exec(trimmed);
  if (rfc) {
    const parsed = parseRfcDate(rfc, trimmed);
    if (parsed) return parsed;
  }

  const { tz, rest } = interpretZoneSuffix(trimmed, opts.primaryTz);

  if (tz.startsWith("offset:")) {
    const explicit = parseExplicitOffset(tz.slice(7), rest);
    if (explicit) return explicit;
    return { ok: false, error: "Couldn't parse a date with that offset." };
  }

  if (isValidZone(tz)) {
    const wall = parseSingleInput(rest, tz);
    if (wall) return wall;
  }

  return {
    ok: false,
    error:
      "Couldn't recognize that format. Try ISO-8601 (2026-09-07T16:00:00Z), RFC 1123, Unix seconds or milliseconds.",
  };
}