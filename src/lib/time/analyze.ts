/**
 * Multi-input analysis: timestamp difference, comparison, arithmetic, log
 * extraction and JWT/HTTP claim decoding. Epoch math is BigInt-exact; wall
 * rendering delegates to the crate's zone helpers.
 */

import { parseTimestampText, epochFromNs, type ParseOptions, type ParsedTimestamp, type TimestampKind } from "@/lib/time/parse";
import { formatZoned } from "@/lib/time/inspect";
import { parseJwt } from "@/lib/jwt/decode";

const NS_PER_SEC = 1_000_000_000n;
const NS_PER_MS = 1_000_000n;

function floorDiv(a: bigint, b: bigint): bigint {
  return a >= 0n ? a / b : -((-a + b - 1n) / b);
}

export interface DifferenceResult {
  aRaw: string;
  bRaw: string;
  /** b − a in nanoseconds. */
  deltaNs: bigint;
  totalSeconds: string;
  totalMilliseconds: string;
  totalMinutes: string;
  totalHours: string;
  totalDays: string;
  human: string;
  future: boolean;
}

export function difference(a: ParsedTimestamp, b: ParsedTimestamp): DifferenceResult | null {
  if (!a.ok || !b.ok || a.ns === undefined || b.ns === undefined) return null;
  const deltaNs = b.ns - a.ns;
  const abs = deltaNs < 0n ? -deltaNs : deltaNs;
  const seconds = floorDiv(abs, NS_PER_SEC);
  const days = floorDiv(seconds, 86_400n);
  const hours = floorDiv(seconds, 3_600n);
  const minutes = floorDiv(seconds, 60n);
  const human = humanizeDurationBig(seconds);
  return {
    aRaw: a.raw ?? "",
    bRaw: b.raw ?? "",
    deltaNs,
    totalSeconds: seconds.toString(),
    totalMilliseconds: floorDiv(abs, NS_PER_MS).toString(),
    totalMinutes: minutes.toString(),
    totalHours: hours.toString(),
    totalDays: days.toString(),
    human,
    future: deltaNs >= 0n,
  };
}

/** "28 days 4 hours 32 minutes 17 seconds" from whole seconds (BigInt-safe). */
export function humanizeDurationBig(totalSeconds: bigint): string {
  const buckets: [bigint, string][] = [
    [86_400n, "day"],
    [3_600n, "hour"],
    [60n, "minute"],
    [1n, "second"],
  ];
  let remaining = totalSeconds;
  const parts: string[] = [];
  for (const [size, label] of buckets) {
    const count = floorDiv(remaining, size);
    remaining %= size;
    if (size === 1n) {
      if (count > 0n || parts.length === 0) parts.push(`${count} ${label}${count === 1n ? "" : "s"}`);
    } else if (count > 0n) {
      parts.push(`${count} ${label}${count === 1n ? "" : "s"}`);
    }
  }
  return parts.join(" ") || "0 seconds";
}

export interface CompareRow {
  label: string;
  raw: string;
  valid: boolean;
  error?: string;
  ns: bigint;
  date: Date | null;
  outOfOrder: boolean;
  order?: number;
}

export interface CompareResult {
  rows: CompareRow[];
  chronological: string;
  earliest: string;
  latest: string;
  spanHuman: string;
  invalidCount: number;
}

export function compareTimestamps(text: string, opts: ParseOptions): CompareResult {
  const labels = ["A", "B", "C", "D"] as const;
  const rows: CompareRow[] = [];
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 100);

  lines.forEach((line, index) => {
    const parsed = parseTimestampText(line, opts);
    if (parsed.ok && parsed.ns !== undefined) {
      rows.push({
        label: String(labels[index] ?? index + 1),
        raw: line,
        valid: true,
        ns: parsed.ns,
        date: parsed.date ?? null,
        outOfOrder: false,
      });
    } else {
      rows.push({ label: String(labels[index] ?? index + 1), raw: line, valid: false, error: parsed.error, ns: 0n, date: null, outOfOrder: false });
    }
  });

  let runningMax: bigint | null = null;
  rows.forEach((row) => {
    if (row.valid) {
      if (runningMax !== null && row.ns < runningMax) row.outOfOrder = true;
      if (runningMax === null || row.ns > runningMax) runningMax = row.ns;
    }
  });

  const sorted = rows.filter((r) => r.valid).map((r) => r.ns).sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  let chronological = "";
  if (sorted.length > 0) {
    const order = new Map<bigint, number>();
    sorted.forEach((ns, i) => {
      if (!order.has(ns)) order.set(ns, i);
    });
    chronological = rows.filter((r) => r.valid).map((r) => `'${r.label}' (${order.get(r.ns)! + 1})`).join(" → ");
  }

  let earliest = "—";
  let latest = "—";
  let spanHuman = "—";
  if (sorted.length > 0) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    earliest = first.toString();
    latest = last.toString();
    spanHuman = humanizeDurationBig(last - first);
  }

  return { rows, chronological: chronological || "—", earliest, latest, spanHuman, invalidCount: rows.length - sorted.length };
}

const OP_FACTOR_NS: Record<string, bigint> = {
  ns: 1n,
  us: 1_000n,
  ms: NS_PER_MS,
  s: NS_PER_SEC,
  m: 60n * NS_PER_SEC,
  h: 3_600n * NS_PER_SEC,
  d: 86_400n * NS_PER_SEC,
  w: 604_800n * NS_PER_SEC,
};

export interface ArithmeticResult {
  ok: boolean;
  error?: string;
  baseText: string;
  ops: string[];
  ns: bigint;
  nsAfter?: bigint;
  date: Date | null;
  expr: string;
}

const ARITH_OP_RE = /([+-])\s*(\d+(?:\.\d+)?)\s*(ns|us|ms|s|m|h|d|w)\b/g;

export function evaluateArithmetic(expr: string, opts: ParseOptions, nowMs: number): ArithmeticResult {
  const text = expr.trim();
  if (!text) return { ok: false, error: "Type an expression, e.g. now + 2h or 2026-09-07T10:00:00Z + 5d.", ns: 0n, baseText: "", ops: [], date: null, expr };

  let baseText = "";
  let opsText = "";
  if (/^now(?:\b|$)/i.test(text)) {
    baseText = "now";
    opsText = text.replace(/^now/i, "");
  } else {
    ARITH_OP_RE.lastIndex = 0;
    const match = ARITH_OP_RE.exec(text);
    if (match) {
      baseText = text.slice(0, match.index).trim();
      opsText = text.slice(match.index);
    } else {
      baseText = text;
      opsText = "";
    }
  }

  if (!baseText) return { ok: false, error: "Missing a base timestamp or 'now'.", ns: 0n, baseText: "", ops: [], date: null, expr };

  let baseNs: bigint;
  if (baseText.toLowerCase() === "now") {
    baseNs = BigInt(nowMs) * NS_PER_MS;
  } else {
    const parsed = parseTimestampText(baseText, opts);
    if (!parsed.ok || parsed.ns === undefined) {
      return { ok: false, error: parsed.error ?? "Couldn't parse the base timestamp.", ns: 0n, baseText, ops: [], date: null, expr };
    }
    baseNs = parsed.ns;
  }

  const ops: string[] = [];
  let totalDelta = 0n;
  ARITH_OP_RE.lastIndex = 0;
  let opMatch: RegExpExecArray | null;
  const scanOps = opsText.length > 0 ? opsText : text;
  while ((opMatch = ARITH_OP_RE.exec(scanOps)) !== null) {
    const sign = opMatch[1] === "-" ? -1n : 1n;
    const amountNumber = Number(opMatch[2]);
    const unit = opMatch[3];
    const factor = OP_FACTOR_NS[unit] ?? NS_PER_SEC;
    totalDelta += sign * (BigInt(Math.round(amountNumber * Number(factor))) as bigint);
    ops.push(`${opMatch[1]}${opMatch[2]}${unit}`);
  }

  const nsAfter = baseNs + totalDelta;
  const cache = epochFromNs(nsAfter);
  return { ok: true, baseText, ops, ns: baseNs, nsAfter, date: cache.date, expr };
}

export interface LogRow {
  line: number;
  original: string;
  format: string;
  utc: string;
  local: string;
  ns: bigint;
}

export interface LogExtractResult {
  count: number;
  rows: LogRow[];
  chronological: LogRow[];
  firstEvent: string;
  lastEvent: string;
  totalDuration: string;
  largestGap: string;
}

const ISO_IN_TEXT_RE = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?/g;
const RFC_IN_TEXT_RE = /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{1,2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} (?:GMT|UTC|[+-]\d{4})/g;
const UNIX_IN_TEXT_RE = /(?:^|(?<=\s|\[|:))(-?\d{9,11})(?=\s|$|\]|,)/g;

export function extractLogTimestamps(text: string, opts: ParseOptions, localZone: string): LogExtractResult {
  const rows: LogRow[] = [];
  const lines = text.split("\n");
  lines.forEach((line, lineIndex) => {
    const candidates: { index: number; raw: string; parsed: ParsedTimestamp }[] = [];
    const scan = (regex: RegExp) => {
      let m: RegExpExecArray | null;
      while ((m = regex.exec(line)) !== null) {
        candidates.push({ index: m.index, raw: m[0], parsed: parseTimestampText(m[0], opts) });
      }
    };
    scan(ISO_IN_TEXT_RE);
    scan(RFC_IN_TEXT_RE);
    scan(UNIX_IN_TEXT_RE);
    candidates.sort((a, b) => a.index - b.index);
    const found = candidates.find((c) => c.parsed.ok && c.parsed.ns !== undefined);
    if (found) {
      const ns = found.parsed.ns!;
      const ms = epochFromNs(ns).msNumber ?? 0;
      rows.push({
        line: lineIndex + 1,
        original: found.raw,
        format: found.parsed.label ?? "Auto",
        utc: formatZoned("UTC", ms),
        local: formatZoned(localZone, ms),
        ns,
      });
    }
  });

  const chronological = [...rows].sort((a, b) => (a.ns < b.ns ? -1 : a.ns > b.ns ? 1 : 0));
  let firstEvent = "—";
  let lastEvent = "—";
  let totalDuration = "—";
  let largestGap = "—";
  if (chronological.length > 0) {
    firstEvent = `#${chronological[0].line} · ${chronological[0].utc}`;
    lastEvent = `#${chronological[chronological.length - 1].line} · ${chronological[chronological.length - 1].utc}`;
    const span = chronological[chronological.length - 1].ns - chronological[0].ns;
    totalDuration = humanizeDurationBig(floorDiv(span < 0n ? -span : span, NS_PER_SEC));
    let maxGap = 0n;
    for (let i = 1; i < chronological.length; i++) {
      const gap = chronological[i].ns - chronological[i - 1].ns;
      if (gap > maxGap) maxGap = gap;
    }
    if (maxGap > 0n) largestGap = humanizeDurationBig(floorDiv(maxGap, NS_PER_SEC));
  }

  return { count: rows.length, rows, chronological, firstEvent, lastEvent, totalDuration, largestGap };
}

export interface ClaimTime {
  raw: string;
  ns: bigint;
  date: Date | null;
}

export interface JwtReport {
  ok: boolean;
  error?: string;
  iss?: string;
  sub?: string;
  aud?: string;
  iat?: ClaimTime;
  exp?: ClaimTime;
  nbf?: ClaimTime;
  ttl?: string;
  status: "valid" | "expired" | "not-yet-valid" | "unknown";
  nowMs: number;
}

function claimFromValue(value: unknown): ClaimTime | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  const ns = BigInt(Math.round(value)) * NS_PER_SEC;
  const date = epochFromNs(ns).date;
  return { raw: String(value), ns, date };
}

export function analyzeJwt(jsonText: string, nowMs: number): JwtReport {
  let payload: Record<string, unknown>;
  if (jsonText.trim().startsWith("{")) {
    try {
      payload = JSON.parse(jsonText);
    } catch {
      return { ok: false, error: "The text is not valid JSON and not a JWT.", status: "unknown", nowMs };
    }
  } else {
    const parsed = parseJwt(jsonText);
    if (!parsed.ok) return { ok: false, error: parsed.error, status: "unknown", nowMs };
    payload = parsed.value.payload;
  }
  if (typeof payload !== "object" || payload === null) return { ok: false, error: "Expected a JSON object of claims.", status: "unknown", nowMs };

  const iat = claimFromValue(payload.iat) ?? undefined;
  const exp = claimFromValue(payload.exp) ?? undefined;
  const nbf = claimFromValue(payload.nbf) ?? undefined;

  let status: JwtReport["status"] = "unknown";
  const nowBig = BigInt(nowMs) * NS_PER_MS;
  if (exp && nowBig > exp.ns) status = "expired";
  else if (nbf && nowBig < nbf.ns) status = "not-yet-valid";
  else if (iat || exp || nbf) status = "valid";

  let ttl: string | undefined;
  if (iat && exp) ttl = humanizeDurationBig(floorDiv(exp.ns - iat.ns, NS_PER_SEC));

  const str = (k: string) => (typeof payload[k] === "string" ? (payload[k] as string) : undefined);

  return {
    ok: true,
    iss: str("iss"),
    sub: str("sub"),
    aud: str("aud"),
    iat,
    exp,
    nbf,
    ttl,
    status,
    nowMs,
  };
}

export interface HttpHeaderResult {
  rows: { name: string; value: string; source: string; ist: string | null; ok: boolean; error?: string }[];
}

const HTTP_HEADER_NAMES = new Set(["date", "expires", "last-modified", "if-modified-since", "retry-after", "iat", "exp", "nbf"]);

export function parseHttpTimestamps(text: string, opts: ParseOptions, nowMs: number): HttpHeaderResult {
  const rows: HttpHeaderResult["rows"] = [];
  text.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const m = trimmed.match(/^([A-Za-z-]+)\s*:\s*(.+)$/);
    const name = m ? m[1].toLowerCase() : "";
    const value = m ? m[2].trim() : trimmed;
    if (!HTTP_HEADER_NAMES.has(name)) return;

    if (name === "retry-after" && /^\d+$/.test(value)) {
      const seconds = Number(value) * 1000;
      const instant = nowMs + seconds;
      rows.push({
        name: m![1],
        value,
        source: `${formatZoned("UTC", instant)} UTC`,
        ist: `${formatZoned("Asia/Kolkata", instant)} IST`,
        ok: true,
      });
      return;
    }
    const parsed = parseTimestampText(value, opts);
    if (parsed.ok && parsed.ns !== undefined && parsed.date) {
      rows.push({
        name: m ? m[1] : "value",
        value,
        source: `${formatZoned("UTC", parsed.date.getTime())} UTC`,
        ist: `${formatZoned("Asia/Kolkata", parsed.date.getTime())} IST`,
        ok: true,
      });
    } else {
      rows.push({ name: m ? m[1] : "value", value, source: "", ok: false, error: parsed.error ?? "Couldn't parse.", ist: null });
    }
  });
  return { rows };
}

export function epochUnits(ns: bigint): { seconds: string; milliseconds: string; microseconds: string; nanoseconds: string } {
  return {
    seconds: floorDiv(ns, NS_PER_SEC).toString(),
    milliseconds: floorDiv(ns, NS_PER_MS).toString(),
    microseconds: floorDiv(ns, 1_000n).toString(),
    nanoseconds: ns.toString(),
  };
}

export type { TimestampKind };