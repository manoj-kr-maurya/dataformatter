/**
 * Cron expression engine — parse 5- or 6-field cron, validate, compute the
 * next/previous run times in a chosen timezone (DST-safe via Intl), plus a
 * human-readable description. No dependencies, pure client-side.
 */

export const MONTH_NAMES: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export const DAY_NAMES: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

export interface CronField {
  values: number[];
  star: boolean;
}

export interface ParsedCron {
  seconds: CronField;
  minutes: CronField;
  hours: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
  hasSeconds: boolean;
}

export interface CronValidation {
  valid: boolean;
  message: string;
}

function parseField(raw: string, min: number, max: number, names?: Record<string, number>): CronField | string {
  const label = raw.trim().toLowerCase();
  const set = new Set<number>();
  let star = false;
  for (const part of label.split(",")) {
    const piece = part.trim();
    if (piece.length === 0) return "empty field segment";
    if (piece === "*" || piece === "?") {
      for (let i = min; i <= max; i++) set.add(i);
      star = true;
      continue;
    }
    const slash = piece.split("/");
    const left = slash[0];
    const stepRaw = slash[1];
    if (slash.length > 2) return `bad step in "${piece}"`;
    if (stepRaw !== undefined && !/^\d+$/.test(stepRaw)) return `bad step "${stepRaw}"`;
    const step = stepRaw === undefined ? 1 : parseInt(stepRaw, 10);
    if (step < 1) return "step must be ≥ 1";

    const expandName = (token: string): number | null => {
      if (names?.[token]) return names[token];
      if (!/^\d+$/.test(token)) return null;
      const n = parseInt(token, 10);
      return n;
    };

    if (piece.includes("*/") && left === "*") {
      for (let i = min; i <= max; i += step) set.add(i);
      star = true;
      continue;
    }
    if (left.includes("-")) {
      const [aRaw, bRaw] = left.split("-");
      const a = expandName(aRaw);
      const b = expandName(bRaw);
      if (a == null || b == null) return `bad range "${left}"`;
      for (let i = a; i <= b; i += step) {
        if (i > max) break;
        set.add(i);
      }
      continue;
    }
    const single = expandName(piece.replace(/\/\d+$/, ""));
    if (single == null) return `unknown token "${piece}"`;
    if (single < min || single > max) return `value ${single} out of range ${min}–${max}`;
    star = false;
    set.add(single);
  }
  return { values: Array.from(set).sort((a, b) => a - b), star };
}

export function parseCron(expr: string): ParsedCron | { error: string } {
  const fields = expr.trim().split(/\s+/).filter(Boolean);
  if (fields.length !== 5 && fields.length !== 6) {
    return { error: "Expected 5 fields (minute hour day-of-month month day-of-week) or 6 with seconds." };
  }
  const [minuteRaw, hourRaw, domRaw, monthRaw, dowRaw] = fields.slice(-5);
  const secondsRaw = fields.length === 6 ? fields[0] : "0";

  const minutes = parseField(minuteRaw, 0, 59);
  const hours = parseField(hourRaw, 0, 23);
  const dayOfMonth = parseField(domRaw, 1, 31);
  const month = parseField(monthRaw, 1, 12, MONTH_NAMES);
  const dayOfWeek = parseField(dowRaw, 0, 7, DAY_NAMES);
  const seconds = parseField(secondsRaw, 0, 59);

  for (const [label, field] of Object.entries({ seconds, minutes, hours, dayOfMonth, month, dayOfWeek })) {
    if (typeof field === "string") return { error: `${label}: ${field}` };
  }
  return {
    seconds: seconds as CronField,
    minutes: minutes as CronField,
    hours: hours as CronField,
    dayOfMonth: dayOfMonth as CronField,
    month: month as CronField,
    dayOfWeek: dayOfWeek as CronField,
    hasSeconds: fields.length === 6,
  };
}

export function validateCron(expr: string): CronValidation {
  const result = parseCron(expr);
  if ("error" in result) return { valid: false, message: result.error };
  return { valid: true, message: "Valid cron expression." };
}

/** Day-of-week match honoring Vixie cron rules (0 and 7 both mean Sunday). */
function dayMatches(p: ParsedCron, dom: number, weekday: number): boolean {
  const domMatch = p.dayOfMonth.values.includes(dom);
  const dowMatch = p.dayOfWeek.values.includes(weekday) || (p.dayOfWeek.values.includes(7) && weekday === 0);
  const domStar = p.dayOfMonth.star;
  const dowStar = p.dayOfWeek.star;
  if (!domStar && !dowStar) return domMatch || dowMatch;
  if (!domStar) return domMatch;
  if (!dowStar) return dowMatch;
  return true;
}

interface WallTime {
  y: number;
  m: number;
  d: number;
  h: number;
  min: number;
  s: number;
}

function wallOf(ts: number, tz: string): WallTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(ts);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  let hour = get("hour");
  if (hour === 24) hour = 0;
  return { y: get("year"), m: get("month"), d: get("day"), h: hour, min: get("minute"), s: get("second") };
}

function matchesField(values: number[], value: number): boolean {
  return values.includes(value);
}

function runAfter(p: ParsedCron, from: number, tz: string): number | null {
  const maxTries = 6_000_000;
  let cursor = from + 1;
  for (let guard = 0; guard < maxTries; guard++) {
    const wall = wallOf(cursor, tz);
    if (!matchesField(p.month.values, wall.m)) {
      cursor = wallToMs(wall.y, wall.m + 1, 1, 0, 0, 0, tz);
      continue;
    }
    if (!dayMatches(p, wall.d, new Date(Date.UTC(wall.y, wall.m - 1, wall.d)).getUTCDay())) {
      cursor = wallToMs(wall.y, wall.m, wall.d + 1, 0, 0, 0, tz);
      continue;
    }
    if (!matchesField(p.hours.values, wall.h)) {
      cursor = wallToMs(wall.y, wall.m, wall.d, wall.h + 1, 0, 0, tz);
      continue;
    }
    if (!matchesField(p.minutes.values, wall.min)) {
      const minuteStart = wallToMs(wall.y, wall.m, wall.d, wall.h, wall.min, 0, tz);
      cursor = minuteStart + 60_000;
      continue;
    }
    const minuteStart = wallToMs(wall.y, wall.m, wall.d, wall.h, wall.min, 0, tz);
    const nextSec = p.seconds.values.find((s) => minuteStart + s * 1000 > from);
    if (nextSec !== undefined) return minuteStart + nextSec * 1000;
    cursor = minuteStart + 60_000;
  }
  return null;
}

function runBefore(p: ParsedCron, from: number, tz: string): number | null {
  const maxTries = 6_000_000;
  let cursor = from - 1;
  for (let guard = 0; guard < maxTries; guard++) {
    const wall = wallOf(cursor, tz);
    if (!matchesField(p.month.values, wall.m)) {
      cursor = wallToMs(wall.y, wall.m - 1, 1, 0, 0, 0, tz) - 1;
      continue;
    }
    if (!dayMatches(p, wall.d, new Date(Date.UTC(wall.y, wall.m - 1, wall.d)).getUTCDay())) {
      cursor = wallToMs(wall.y, wall.m, wall.d - 1, 0, 0, 0, tz) - 1;
      continue;
    }
    if (!matchesField(p.hours.values, wall.h)) {
      cursor = wallToMs(wall.y, wall.m, wall.d, wall.h, 0, 0, tz) - 1;
      continue;
    }
    if (!matchesField(p.minutes.values, wall.min)) {
      cursor = wallToMs(wall.y, wall.m, wall.d, wall.h, wall.min, 0, tz) - 1;
      continue;
    }
    const minuteStart = wallToMs(wall.y, wall.m, wall.d, wall.h, wall.min, 0, tz);
    const prevSec = [...p.seconds.values].reverse().find((s) => minuteStart + s * 1000 < from);
    if (prevSec !== undefined) return minuteStart + prevSec * 1000;
    cursor = minuteStart - 1;
  }
  return null;
}

/** Inverse of wallOf via successive approximation (converges within ms). */
function wallToMs(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
  s: number,
  tz: string,
): number {
  let guess = Date.UTC(y, m - 1, d, h, min, s);
  for (let i = 0; i < 3; i++) {
    const w = wallOf(guess, tz);
    const naive = Date.UTC(w.y, w.m - 1, w.d, w.h, w.min, w.s);
    const drift = Date.UTC(y, m - 1, d, h, min, s) - naive;
    if (drift === 0) break;
    guess += drift;
  }
  return guess;
}

export function nextRuns(expr: string, from: Date | number, count: number, tz: string): number[] {
  const result = parseCron(expr);
  if ("error" in result) throw new Error(result.error);
  const start = typeof from === "number" ? from : from.getTime();
  const out: number[] = [];
  let cursor = start;
  for (let i = 0; i < count; i++) {
    if (cursor <= start) cursor = start;
    const next = runAfter(result, cursor, tz);
    if (next == null) break;
    out.push(next);
    cursor = next;
  }
  return out;
}

export function previousRuns(expr: string, from: Date | number, count: number, tz: string): number[] {
  const result = parseCron(expr);
  if ("error" in result) throw new Error(result.error);
  const start = typeof from === "number" ? from : from.getTime();
  const out: number[] = [];
  let cursor = start;
  for (let i = 0; i < count; i++) {
    if (cursor >= start) cursor = start;
    const prev = runBefore(result, cursor, tz);
    if (prev == null) break;
    out.push(prev);
    cursor = prev;
  }
  return out;
}

export function describeCron(expr: string): string {
  const result = parseCron(expr);
  if ("error" in result) return result.error;
  const p = result as ParsedCron;
  const bits: string[] = [];
  const minuteOfHour = p.minutes.values.length === 1 ? `at minute ${p.minutes.values[0]}` : `minutes ${p.minutes.values.join(", ")}`;
  const hourText = p.hours.star ? "every hour" : `at ${p.hours.values.map((h) => String(h).padStart(2, "0")).join(" and ")}:00`;
  bits.push(p.minutes.star && p.hours.star ? "every minute" : `${hourText} ${minuteOfHour}`);
  if (!p.dayOfMonth.star) bits.push(`day-of-month ${p.dayOfMonth.values.join(",")}`);
  if (!p.month.star) bits.push(`month ${p.month.values.map((m) => Object.keys(MONTH_NAMES).find((k) => MONTH_NAMES[k] === m) ?? m).join(",")}`);
  if (!p.dayOfWeek.star) bits.push(`day-of-week ${p.dayOfWeek.values.map((d) => Object.keys(DAY_NAMES).find((k) => DAY_NAMES[k] === d) ?? d).join(",")}`);
  if (p.hasSeconds && !p.seconds.star) bits.push(`seconds ${p.seconds.values.join(",")}`);
  return bits.join(", ") + ".";
}