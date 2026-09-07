/**
 * IANA-timezone wall-clock primitives built on the runtime's own ICU data
 * (Intl.DateTimeFormat). No third-party dependency and no hardcoded offsets:
 * all arithmetic is a round-trip through the zone's real transition rules, so
 * DST gap/overlap windows and historical offsets come out correctly.
 */

export interface WallParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  ms: number;
  /** Monday = 1 … Sunday = 7. */
  weekday: number;
  weekdayName: string;
  offsetMinutes: number;
  /** Abbreviation such as "IST", "CET"; falls back to "UTC±HH:MM". */
  shortName: string;
  /** Offset label such as "UTC+05:30". */
  offsetLabel: string;
  /** Combined label like "IST (UTC+05:30)" (plain "UTC" for UTC). */
  displayName: string;
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function offsetMinutesFromName(text: string): number {
  const match = text.match(/GMT([+-])(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** Offset (signed minutes) of `zone` at the instant `ms`. */
export function zoneOffsetMinutes(zone: string, ms: number): number {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" });
  const text = fmt.formatToParts(ms).find((p) => p.type === "timeZoneName")?.value ?? "";
  return offsetMinutesFromName(text);
}

/** True when `zone` is a valid IANA identifier understood by Intl. */
export function isValidZone(zone: string): boolean {
  if (!zone || typeof zone !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock breakdown of the instant `ms` in `zone`. */
export function wallParts(zone: string, ms: number): WallParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "long",
    timeZoneName: "short",
  });
  const parts = fmt.formatToParts(ms);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const num = (type: string) => Number(get(type));

  const weekdayName = get("weekday");
  const weekdayIndex = WEEKDAY_NAMES.indexOf(weekdayName);
  const weekday = weekdayIndex === -1 ? 7 : (weekdayIndex + 6) % 7 + 1;

  const offsetMinutes = zoneOffsetMinutes(zone, ms);

  let shortName = get("timeZoneName");
  if (/^(GMT|UTC)/.test(shortName)) {
    shortName = zone === "UTC" ? "UTC" : `UTC${formatOffset(offsetMinutes)}`;
  }

  const offsetLabel = zone === "UTC" ? "UTC+00:00" : `UTC${formatOffset(offsetMinutes)}`;
  const displayName =
    zone === "UTC" ? "UTC" : shortName === offsetLabel ? `${offsetLabel} · ${zone}` : `${shortName} (${offsetLabel}) · ${zone}`;

  return {
    year: num("year"),
    month: num("month"),
    day: num("day"),
    hour: num("hour"),
    minute: num("minute"),
    second: num("second"),
    ms,
    weekday,
    weekdayName,
    offsetMinutes,
    shortName,
    offsetLabel,
    displayName,
  };
}

/** "-05:30" / "+09:00" for a signed-minutes offset. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

export type WallState = "unique" | "ambiguous" | "nonexistent";

export interface WallToInstantResult {
  state: WallState;
  /** Best instant (first occurrence when ambiguous; forward-resolved when nonexistent). */
  instant: number;
  /** Both occurrences for ambiguous local times. */
  ambiguousInstants?: number[];
  /** Human description of the DST event, for the debugger. */
  text?: string;
}

function daySerial(w: { year: number; month: number; day: number }): number {
  return ((w.year * 372 + w.month) * 31 + w.day);
}

function sameWall(a: { year: number; month: number; day: number; hour: number; minute: number; second: number }, target: { year: number; month: number; day: number; hour: number; minute: number; second: number }): boolean {
  return (
    a.year === target.year &&
    a.month === target.month &&
    a.day === target.day &&
    a.hour === target.hour &&
    a.minute === target.minute &&
    a.second === target.second
  );
}

/**
 * Convert a wall-clock time in `zone` to an instant, using the zone's real
 * transition data (sampled hourly around the naive guess) so that times inside
 * a DST gap and an overlap window are detected rather than guessed.
 */
export function wallToInstant(
  zone: string,
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number,
  ms = 0,
): WallToInstantResult {
  const target = { year: y, month: mo, day: d, hour: h, minute: mi, second: s };
  const naive = Date.UTC(y, mo - 1, d, h, mi, s, ms);

  const offsets = new Set<number>();
  for (let t = naive - 30 * 3_600_000; t <= naive + 30 * 3_600_000; t += 3_600_000) {
    offsets.add(zoneOffsetMinutes(zone, t));
  }

  const candidates: number[] = [];
  const seen = new Set<number>();
  for (const off of offsets) {
    const cand = naive - off * 60_000;
    const w = wallParts(zone, cand);
    if (sameWall(w, target)) {
      const rounded = Math.round(cand / 1000) * 1000;
      if (!seen.has(rounded)) {
        seen.add(rounded);
        candidates.push(cand);
      }
    }
  }
  candidates.sort((a, b) => a - b);

  if (candidates.length === 1) {
    return { state: "unique", instant: candidates[0] };
  }
  if (candidates.length >= 2) {
    return {
      state: "ambiguous",
      instant: candidates[0],
      ambiguousInstants: candidates.slice(0, 2),
      text: `${formatWall(target)} occurs twice because the clock falls back during the DST transition.`,
    };
  }

  const transition = findTransition(zone, naive);
  return {
    state: "nonexistent",
    instant: resolveNonexistent(zone, naive),
    text: transition
      ? `${formatWall(target)} does not exist because the timezone transitioned from ${transition.before} to ${transition.after}.`
      : `${formatWall(target)} does not exist in ${zone}.`,
  };
}

export function formatWall(w: { hour: number; minute: number; second: number }): string {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${p2(w.hour)}:${p2(w.minute)}:${p2(w.second)}`;
}

function findTransition(
  zone: string,
  aroundMs: number,
): { before: string; after: string } | null {
  const start = aroundMs - 24 * 3_600_000;
  let prevOffset = zoneOffsetMinutes(zone, start);
  for (let t = start; t <= aroundMs + 24 * 3_600_000; t += 3_600_000) {
    const off = zoneOffsetMinutes(zone, t);
    if (off !== prevOffset) {
      const before = wallParts(zone, t - 1000);
      const after = wallParts(zone, t + 1000);
      return { before: formatWall(before), after: formatWall(after) };
    }
    prevOffset = off;
  }
  return null;
}

function resolveNonexistent(zone: string, naive: number): number {
  let guess = naive - zoneOffsetMinutes(zone, naive) * 60_000;
  for (let i = 0; i < 26; i++) {
    guess = naive - zoneOffsetMinutes(zone, guess) * 60_000;
    const w = wallParts(zone, guess);
    const diffSerial = daySerial(w) - daySerial({ year: new Date(naive).getUTCFullYear(), month: new Date(naive).getUTCMonth() + 1, day: new Date(naive).getUTCDate() });
    const diffMinutes = diffSerial * 1440 + (w.hour * 60 + w.minute + w.second / 60) - (new Date(naive).getUTCHours() * 60 + new Date(naive).getUTCMinutes() + new Date(naive).getUTCSeconds() / 60);
    if (Math.abs(diffMinutes) < 1) return guess;
    guess += diffMinutes * 60_000;
  }
  return guess;
}

/** Common zones offered in pickers, with UTC and Asia/Kolkata pinned first. */
export const COMMON_ZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;

export const EXTRA_ZONES = [
  "Africa/Cairo",
  "Africa/Johannesburg",
  "America/Sao_Paulo",
  "America/Denver",
  "America/Phoenix",
  "America/Toronto",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Tehran",
  "Australia/Perth",
  "Europe/Amsterdam",
  "Europe/Dublin",
  "Europe/Istanbul",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Stockholm",
  "Europe/Zurich",
  "Pacific/Auckland",
  "Pacific/Honolulu",
] as const;

export const DEFAULT_PRIMARY_TZ = "Asia/Kolkata";

/** Abbreviations recognized inside free-form dates (human timezone hints). */
export const TZ_ABBREVIATIONS: Record<string, string> = {
  UTC: "UTC",
  GMT: "UTC",
  IST: "Asia/Kolkata",
  EST: "America/New_York",
  EDT: "America/New_York",
  ET: "America/New_York",
  CST: "America/Chicago",
  CDT: "America/Chicago",
  PST: "America/Los_Angeles",
  PDT: "America/Los_Angeles",
  PT: "America/Los_Angeles",
  MST: "America/Denver",
  MDT: "America/Denver",
  GMT0: "UTC",
};