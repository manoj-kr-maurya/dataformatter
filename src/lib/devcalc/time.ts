/**
 * Duration toolkit — parses "2h 35m 20s" style compound strings, breaks
 * millisecond quantities into weeks→milliseconds, and computes spans between
 * two timestamps. Pure client-side math, big values via plain numbers.
 */

const DURATION_UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60000,
  h: 3600000,
  d: 86400000,
  w: 604800000,
};

export interface DurationParts {
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

/**
 * Parse a compound human duration like "2h 35m 20s", "1w 2d", "500ms" or
 * "1.5h" into milliseconds. Throws with a friendly message otherwise.
 */
export function parseDurationString(text: string): number {
  const t = (text ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!t) throw new Error("Enter a duration like 2h 35m 20s.");
  const re = /(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)/g;
  let ms = 0;
  let matched = false;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(t))) {
    ms += Number(match[1]) * (DURATION_UNIT_MS[match[2]] ?? 0);
    matched = true;
    lastIndex = re.lastIndex;
  }
  if (!matched || lastIndex !== t.length) {
    throw new Error(`Cannot read "${text}". Use units like 2h 35m 20s, or one of ms, s, m, h, d, w.`);
  }
  return ms;
}

/** Split milliseconds into weeks → milliseconds components. */
export function breakdownDuration(ms: number): DurationParts {
  const total = Math.max(0, Math.floor(ms));
  const weeks = Math.floor(total / DURATION_UNIT_MS.w);
  const days = Math.floor((total % DURATION_UNIT_MS.w) / DURATION_UNIT_MS.d);
  const hours = Math.floor((total % DURATION_UNIT_MS.d) / DURATION_UNIT_MS.h);
  const minutes = Math.floor((total % DURATION_UNIT_MS.h) / DURATION_UNIT_MS.m);
  const seconds = Math.floor((total % DURATION_UNIT_MS.m) / DURATION_UNIT_MS.s);
  const milliseconds = total % DURATION_UNIT_MS.s;
  return { weeks, days, hours, minutes, seconds, milliseconds };
}

/** Compact rendering like "2d 3h 4m 5s" (zero units skipped above seconds). */
export function formatDurationBreakdown(ms: number, includeMs = true): string {
  const p = breakdownDuration(ms);
  const parts: string[] = [];
  if (p.weeks > 0) parts.push(`${p.weeks}w`);
  if (p.days > 0) parts.push(`${p.days}d`);
  if (p.hours > 0) parts.push(`${p.hours}h`);
  if (p.minutes > 0) parts.push(`${p.minutes}m`);
  if (p.seconds > 0) parts.push(`${p.seconds}s`);
  if (includeMs && (parts.length === 0 || p.milliseconds > 0)) parts.push(`${p.milliseconds}ms`);
  return parts.length > 0 ? parts.join(" ") : "0 ms";
}