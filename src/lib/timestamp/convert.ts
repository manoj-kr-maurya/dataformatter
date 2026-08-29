/**
 * Timestamp converter — parse ISO strings, Unix seconds/milliseconds, HTTP
 * dates and common human formats; render in every common epoch unit plus the
 * local timezone. Fully client-side (uses the visitor's local zone).
 */

export interface TimestampParts {
  milliseconds: number;
  seconds: number;
  microseconds: number;
  nanoseconds: number;
  iso: string;
  utc: string;
  local: string;
  relative: string;
  isFuture: boolean;
}

export interface TimestampParseResult {
  valid: boolean;
  reason?: string;
  ms?: number;
}

/** Parse flexibly: ISO-8601, unix seconds (≤ 11 digits), unix ms (13), RFC-1123, common text. */
export function parseTimestamp(text: string): TimestampParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { valid: false, reason: "Paste a timestamp." };

  const onlyDigits = /^\d+$/.test(trimmed);
  if (onlyDigits) {
    const value = Number(trimmed);
    if (!Number.isSafeInteger(value) || value > 999999999999999) {
      return { valid: false, reason: "Number is too large to map to a date." };
    }
    if (trimmed.length <= 11) {
      return value < 0 ? { valid: false, reason: "Seconds must be non-negative." } : { valid: true, ms: value * 1000 };
    }
    return { valid: true, ms: value }; // 13-digit ms; larger treated as ms with a warning
  }

  const asDate = new Date(trimmed);
  if (!Number.isNaN(asDate.getTime())) {
    return { valid: true, ms: asDate.getTime() };
  }

  const rfc = trimmed.match(/(\w{3}), (\d{2}) (\w{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2})/);
  if (rfc) {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = MONTHS.indexOf(rfc[3]);
    if (month !== -1) {
      const parsed = new Date(Date.UTC(Number(rfc[4]), month, Number(rfc[2]), Number(rfc[5]), Number(rfc[6]), Number(rfc[7])));
      if (!Number.isNaN(parsed.getTime())) return { valid: true, ms: parsed.getTime() };
    }
  }

  return { valid: false, reason: "Couldn't recognize that format. Try an ISO string (2026-01-31T14:30:00Z) or a Unix value." };
}

export function toParts(ms: number, nowMs: number): TimestampParts {
  const seconds = Math.floor(ms / 1000);
  const date = new Date(ms);
  const diffMs = ms - nowMs;
  const sign = diffMs >= 0 ? 1 : -1;
  return {
    milliseconds: ms,
    seconds,
    microseconds: seconds * 1_000_000,
    nanoseconds: seconds * 1_000_000_000,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    relative: relativeTime(Math.abs(diffMs)) + (sign >= 0 ? " from now" : " ago"),
    isFuture: sign >= 0,
  };
}

export function relativeTime(ms: number): string {
  const seconds = Math.round(ms / 1000);
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

/** Wall-clock "now" breakdown in an arbitrary IANA zone. */
export function nowInZone(zone: string, nowMs: number): {
  time: string;
  date: string;
  offsetMinutes: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(nowMs);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const time = `${get("hour")}:${get("minute")}:${get("second")}`;
  const date = `${get("month")} ${get("day")}, ${get("year")}`;
  const format = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" });
  const offsetText = format.formatToParts(nowMs).find((p) => p.type === "timeZoneName")?.value ?? "";
  const offsetMatch = offsetText.match(/GMT([+-])(\d{2}):(\d{2})/);
  const offsetMinutes = offsetMatch
    ? (offsetMatch[1] === "-" ? -1 : 1) * (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3]))
    : 0;
  return { time, date, offsetMinutes };
}