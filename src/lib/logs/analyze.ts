/**
 * Log analyzer — paste logs, get level counts, error groups and a timeline.
 * Handles JSON logs, Java/Node/console-preixed lines, nginx-style access logs
 * and generic timestamped lines. Everything runs locally.
 */

export interface LogLine {
  index: number;
  raw: string;
  level: string | null;
  timestamp: string | null;
  message: string;
  /** Canonical unique message for grouping duplicate errors. */
  groupKey: string | null;
  hour: number | null;
}

export interface LevelCount {
  level: string;
  count: number;
}

export interface ErrorGroup {
  key: string;
  message: string;
  count: number;
  sampleIndex: number;
  level: string;
}

export interface LogAnalysis {
  total: number;
  levels: LevelCount[];
  unknownLevel: number;
  uniqueErrors: number;
  errorGroups: ErrorGroup[];
  /** Hourly buckets (UTC hour values) or null when timestamps were undetectable. */
  timeline: { hour: number; total: number; error: number; warn: number }[] | null;
}

const LEVEL_ORDER = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"].map((l) => l);
const LEVEL_RE = /\b(FATAL|ERROR|WARN|WARNING|INFO|DEBUG|TRACE)\b/i;
/** ISO-ish / mmm dd HH:mm:ss timestamps. */
const TIME_RE = /(\d{4}[-/]\d{1,2}[-/]\d{1,2}[T ]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?)/;
const NGINX_RE = /^.*?\[(.+?)\].+?"(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS) .*?" (\d{3})/;
const RFC3339_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

function normalizeLevel(raw: string): string {
  const upper = raw.toUpperCase();
  return upper === "WARNING" ? "WARN" : upper;
}

function lineHour(timestamp: string | null): number | null {
  if (!timestamp) return null;
  if (RFC3339_RE.test(timestamp)) {
    let iso = timestamp.replace(" ", "T");
    if (!/Z$|[+-]\d{2}:\d{2}$/.test(iso)) iso += "Z";
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) return date.getUTCHours();
    return null;
  }
  const match = timestamp.match(/\d{1,2}:\d{2}(?::\d{2})?$/);
  if (match) return parseInt(match[0].split(":")[0], 10);
  return null;
}

function inferJsonLog(raw: string): { level: string | null; timestamp: string | null; message: string } {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const level =
      typeof parsed.level === "string"
        ? normalizedOf(parsed.level)
        : typeof parsed.level_name === "string"
          ? normalizedOf(parsed.level_name)
          : typeof parsed.severity === "string"
            ? normalizedOf(parsed.severity)
            : null;
    const timestamp =
      typeof parsed.timestamp === "string" || typeof parsed.time === "string" || typeof parsed["@timestamp"] === "string"
        ? String(parsed.timestamp ?? parsed.time ?? parsed["@timestamp"])
        : null;
    const message =
      typeof parsed.message === "string"
        ? parsed.message
        : typeof parsed.msg === "string"
          ? parsed.msg
          : JSON.stringify(parsed);
    return { level, timestamp, message };
  } catch {
    return { level: null, timestamp: null, message: raw };
  }
}

function normalizedOf(level: string): string {
  const upper = normalizeLevel(level);
  return LEVEL_ORDER.includes(upper) ? upper : upper;
}

/** Strip hex addresses, numbers and common noise so repeated errors match. */
function normalizeGroupKey(message: string): string {
  return message
    .replace(/0x[0-9a-fA-F]+/g, "0x..")
    .replace(/\bat\s+[\w$.<>]+:\d+(?::\d+)?/g, "at …")
    .replace(/\(?:line \d+\)/g, "")
    .replace(/\b\d+\b/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

interface Parsed {
  level: string | null;
  timestamp: string | null;
  message: string;
}

function parseLine(raw: string): Parsed {
  if (/^\s*[{[<"'"]/.test(raw) || /"level"\s*:/i.test(raw)) {
    const json = inferJsonLog(raw);
    if (json.level !== null || json.timestamp !== null) return json;
  }
  const trimmed = raw.trim();

  const nginx = trimmed.match(NGINX_RE);
  if (nginx) {
    return { level: "HTTP", timestamp: nginx[1], message: raw };
  }

  const level = trimmed.match(LEVEL_RE)?.[1] ?? null;
  const time = trimmed.match(TIME_RE)?.[1] ?? null;
  let rest = trimmed;
  if (level) {
    rest = trimmed.slice(trimmed.indexOf(level) + level.length).trim();
  }
  return { level: level ? normalizeLevel(level) : null, timestamp: time, message: rest || raw };
}

export function analyzeLogs(text: string, maxLines = 50_000): LogAnalysis {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.slice(0, maxLines);
  const parsed: LogLine[] = lines.map((raw, index) => {
    const detail = parseLine(raw);
    const groupKey =
      detail.level === "ERROR" || detail.level === "FATAL" ? normalizeGroupKey(detail.message || raw) : null;
    return {
      index,
      raw,
      level: detail.level,
      timestamp: detail.timestamp,
      message: detail.message,
      groupKey,
      hour: detail.level === "ERROR" || detail.level === "WARN" ? lineHour(detail.timestamp) : null,
    };
  });

  const counted = new Map<string, number>();
  let unknownLevel = 0;
  for (const line of parsed) {
    if (line.level) {
      counted.set(line.level, (counted.get(line.level) ?? 0) + 1);
    } else {
      unknownLevel += 1;
    }
  }
  const levels: LevelCount[] = LEVEL_ORDER.filter((l) => counted.has(l)).map((l) => ({
    level: l,
    count: counted.get(l) ?? 0,
  }));
  for (const [level, count] of counted) {
    if (!LEVEL_ORDER.includes(level)) levels.push({ level, count });
  }

  const errorLines = parsed.filter((l) => l.groupKey != null);
  const grouped = new Map<string, LogLine[]>();
  for (const line of errorLines) {
    const key = line.groupKey as string;
    const bucket = grouped.get(key) ?? [];
    bucket.push(line);
    grouped.set(key, bucket);
  }
  const errorGroups: ErrorGroup[] = Array.from(grouped.entries()).map(([key, bucket]) => ({
    key,
    message: bucket[0].message,
    count: bucket.length,
    sampleIndex: bucket[0].index,
    level: bucket[0].level ?? "ERROR",
  }));
  errorGroups.sort((a, b) => b.count - a.count);

  let timeline: LogAnalysis["timeline"] = null;
  const timed = parsed.filter((l) => l.level === "ERROR" || l.level === "WARN");
  if (timed.some((l) => l.hour != null)) {
    const byHour = new Map<number, { total: number; error: number; warn: number }>();
    for (const line of timed) {
      if (line.hour == null) continue;
      const bucket = byHour.get(line.hour) ?? { total: 0, error: 0, warn: 0 };
      bucket.total += 1;
      if (line.level === "ERROR") bucket.error += 1;
      if (line.level === "WARN") bucket.warn += 1;
      byHour.set(line.hour, bucket);
    }
    timeline = Array.from(byHour.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, counts]) => ({ hour, ...counts }));
  }

  return {
    total: lines.length,
    levels,
    unknownLevel,
    uniqueErrors: errorGroups.length,
    errorGroups,
    timeline,
  };
}