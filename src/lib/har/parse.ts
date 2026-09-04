/**
 * HAR parsing + normalization. Accepts HAR 1.2 documents from Chrome,
 * Firefox, curl and most export tools, tolerating missing optional fields.
 * Uses the shared JSON parser for line/column-accurate errors.
 * Pure, browser-side.
 */

import { parseJson } from "@/lib/json/validate";
import type { DebugRequest, DebugResponse } from "@/lib/debug/types";

export interface HarTimingsPartial {
  blocked?: number;
  dns?: number;
  connect?: number;
  ssl?: number;
  send?: number;
  wait?: number;
  receive?: number;
}

export interface HarEntryView {
  id: string;
  method: string;
  url: string;
  host: string;
  path: string;
  status: number;
  statusText: string;
  startedAtMs?: number;
  time?: number;
  httpVersion: string;
  protocol: string;
  headersSize: number;
  bodySize: number;
  transferSize: number;
  mimeType: string;
  redirectUrl: string;
  request: DebugRequest;
  response: DebugResponse;
  timings: HarTimingsPartial;
}

export interface HarSummary {
  totalEntries: number;
  successful: number;
  failed: number;
  redirects: number;
  totalTransferred: number;
  totalContentSize: number;
  byStatus: { group: string; count: number }[];
}

export type HarParseResult =
  | {
      ok: true;
      entries: HarEntryView[];
      summary: HarSummary;
      harVersion?: string;
      pageCount: number;
    }
  | {
      ok: false;
      /** "invalid" = unparseable JSON, "not-har" = valid JSON that is not a HAR. */
      reason: "invalid" | "not-har";
      message: string;
      line?: number;
      column?: number;
    };

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function str(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function headerPairs(raw: unknown): [string, string][] {
  if (!Array.isArray(raw)) return [];
  const out: [string, string][] = [];
  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const name = str(record.name ?? record.key ?? "").trim();
    const value = str(record.value ?? "");
    if (name) out.push([name, value]);
  }
  return out;
}

/** Parse a header value as a boolean-ish primitive when it looks like one. */
export function headerValueIsTrue(value: string): boolean {
  return /^true$/i.test(value.trim()) || value.trim() === "1";
}

export function looksLikeHar(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  const log = (value as Record<string, unknown>).log;
  if (log === null || typeof log !== "object") return false;
  return Array.isArray((log as Record<string, unknown>).entries);
}

function startedAt(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

function normalizedTimings(raw: unknown): HarTimingsPartial {
  if (raw === null || typeof raw !== "object") return {};
  const record = raw as Record<string, unknown>;
  const out: HarTimingsPartial = {};
  for (const key of ["blocked", "dns", "connect", "ssl", "send", "wait", "receive"]) {
    const n = num(record[key]);
    if (n !== undefined) out[key as keyof HarTimingsPartial] = Math.max(0, n);
  }
  return out;
}

function postDataBody(raw: unknown): { text: string; mimeType: string } | undefined {
  if (raw === null || typeof raw !== "object") return undefined;
  const record = raw as Record<string, unknown>;
  const text = str(record.text);
  if (text === "") return undefined;
  return { text, mimeType: str(record.mimeType) };
}

function contentSizeOf(response: Record<string, unknown>, content: Record<string, unknown>): number {
  const declaredSize = num(content.size ?? content.compression);
  if (declaredSize !== undefined && declaredSize >= 0) return declaredSize;
  const bodySize = num(response.bodySize);
  if (bodySize !== undefined && bodySize > 0) return bodySize;
  const text = str(content.text);
  if (text) return new TextEncoder().encode(text).byteLength;
  return 0;
}

export function parseHar(input: string): HarParseResult {
  if (input.trim() === "") {
    return { ok: false, reason: "invalid", message: "No input supplied." };
  }
  const parsed = parseJson(input);
  if (!parsed.ok) {
    return {
      ok: false,
      reason: "invalid",
      message: parsed.error.message,
      line: parsed.error.line,
      column: parsed.error.column,
    };
  }
  if (!looksLikeHar(parsed.value)) {
    return {
      ok: false,
      reason: "not-har",
      message: "This does not appear to be a valid HAR document.",
    };
  }

  const log = (parsed.value as { log: Record<string, unknown> }).log;
  const rawEntries = Array.isArray(log.entries) ? log.entries : [];
  const harVersion = str(log.version);
  const pageCount = Array.isArray(log.pages) ? log.pages.length : 0;

  let seq = 0;
  const entries: HarEntryView[] = rawEntries
    .map((raw): HarEntryView | null => {
    if (raw === null || typeof raw !== "object") return null;
    const record = raw as Record<string, unknown>;
    const req = (record.request ?? {}) as Record<string, unknown>;
    const res = (record.response ?? {}) as Record<string, unknown>;
    const content = (res.content ?? {}) as Record<string, unknown>;

    const method = str(req.method).toUpperCase() || "GET";
    const url = str(req.url);
    let host = "";
    let pathname = url;
    try {
      const parsedUrl = new URL(url);
      host = parsedUrl.host;
      pathname = parsedUrl.pathname;
    } catch {
      // Keep the raw url; extraction below still works for absolute URLs.
      const afterScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").split("/")[0];
      host = afterScheme;
      const slash = url.indexOf("/", url.indexOf("://") === -1 ? 0 : url.indexOf("://") + 3);
      if (slash > 0) pathname = url.slice(slash);
    }

    const headers = headerPairs(req.headers);
    const query = headerPairs(req.queryString).map(([name, value]) => [
      name,
      value,
    ] as [string, string]);
    const cookies = headerPairs(req.cookies);
    const responseHeaders = headerPairs(res.headers);

    const postData = postDataBody(req.postData);
    const status = num(res.status) ?? 0;
    const statusText = str(res.statusText);
    const mimeType = str(content.mimeType);
    const bodyText = str(content.text);
    const transferSize = contentSizeOf(res, content);
    const headersSize = (num(res.headersSize) ?? 0) + (num(req.headersSize) ?? 0);
    const bodySize = num(req.bodySize ?? res.bodySize) ?? 0;
    const startedAtMs = startedAt(record.startedDateTime);
    const timings = normalizedTimings(record.timings);
    const time = num(record.time);

    const id = `r${++seq}`;
    const httpVersion = str(req.httpVersion) || str(res.httpVersion) || "";
    const traceId = detectTraceId(headers, postData?.text);

    return {
      id,
      method,
      url,
      host,
      path: pathname,
      status,
      statusText,
      startedAtMs,
      time,
      httpVersion,
      protocol: str((req as Record<string, unknown>).protocol) || httpVersion || "HTTP",
      headersSize,
      bodySize,
      transferSize,
      mimeType,
      redirectUrl: str(res.redirectURL),
      request: {
        id,
        method,
        url,
        host,
        path: pathname,
        status,
        statusText,
        httpVersion,
        startedAtMs,
        durationMs: time !== undefined ? time : totalTimingMs(timings),
        headers,
        query,
        cookies,
        bodyText: postData?.text,
        bodyMediaType: postData?.mimeType,
        traceId,
        timings,
      },
response: {
        id,
        status,
        statusText,
        httpVersion: str(res.httpVersion),
        headers: responseHeaders,
        bodyText,
        bodyMediaType: mimeType,
        sizeBytes: transferSize,
        redirectUrl: str(res.redirectURL),
      },
      timings,
    };
  })
  .filter((entry): entry is HarEntryView => entry !== null);

  const nonEmpty = entries.filter((entry): entry is HarEntryView => entry !== null);

  const totalEntries = nonEmpty.length;
  let successful = 0;
  let failed = 0;
  let redirects = 0;
  let totalTransferred = 0;
  let totalContentSize = 0;
  const statusBuckets = new Map<string, number>();

  for (const entry of nonEmpty) {
    if (entry.status >= 200 && entry.status < 300) successful += 1;
    if (entry.status >= 400 || entry.status === 0) failed += 1;
    if (entry.status >= 300 && entry.status < 400) redirects += 1;
    totalTransferred += entry.transferSize;
    totalContentSize += entry.transferSize;
    const group = entry.status === 0 ? "other" : `${Math.floor(entry.status / 100)}xx`;
    statusBuckets.set(group, (statusBuckets.get(group) ?? 0) + 1);
  }

  return {
    ok: true,
    harVersion,
    pageCount,
    summary: {
      totalEntries,
      successful,
      failed,
      redirects,
      totalTransferred,
      totalContentSize,
      byStatus: Array.from(statusBuckets.entries())
        .map(([group, count]) => ({ group, count }))
        .sort((a, b) => groupSort(a.group) - groupSort(b.group)),
    },
    entries: Array.from(nonEmpty).sort(
      (a, b) => (a.startedAtMs ?? 0) - (b.startedAtMs ?? 0),
    ),
  };
}

function groupSort(group: string): number {
  const order = ["2xx", "3xx", "4xx", "5xx", "other"];
  const index = order.indexOf(group);
  return index === -1 ? 99 : index;
}

function totalTimingMs(timings: HarTimingsPartial): number | undefined {
  const values = Object.values(timings);
  if (values.length === 0) return undefined;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round(sum * 100) / 100;
}

const TRACE_HEADERS = ["x-request-id", "x-trace-id", "x-correlation-id", "x-amzn-traceid", "traceparent"];

function detectTraceId(headers: [string, string][], body: string | undefined): string | undefined {
  for (const [name, value] of headers) {
    const lower = name.toLowerCase();
    if (TRACE_HEADERS.includes(lower) && value.trim()) return value.trim();
  }
  if (body) {
    const match = body.match(/"traceId"\s*:\s*"([^"]+)"|"requestId"\s*:\s*"([^"]+)"/);
    if (match) return match[1] ?? match[2];
  }
  return undefined;
}