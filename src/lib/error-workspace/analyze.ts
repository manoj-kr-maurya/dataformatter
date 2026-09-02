/**
 * Production error workspace — paste a stack trace, service logs, request /
 * response evidence and metadata, get a correlated, prioritized debugging
 * session. Pure and fully browser-side.
 *
 * Reuses the shared debug model (DebugSession / DebugFinding) plus existing
 * analyzers: parseStackTrace, analyzeLogs, parseHeaderBlock and parseJson.
 */

import {
  type DebugSession,
  type DebugFinding,
  type DebugLogEntry,
  type DebugRequest,
  type DebugResponse,
  type DebugError,
  type DebugTimelineEvent,
} from "@/lib/debug/types";
import { parseStackTrace } from "@/lib/stacktrace/parse";
import { analyzeLogs, type LogAnalysis } from "@/lib/logs/analyze";
import { parseHeaderBlock } from "@/lib/http-headers/inspect";
import { parseJson } from "@/lib/json/validate";
import { newRow, type HttpMethod, type RequestDraft } from "@/lib/api-client/types";
import { draftToCurl, generateCurlCode, CURL_CODE_TARGETS } from "@/lib/curl-codegen/codegen";

export interface ErrorWorkspaceInput {
  errorText: string;
  logsText: string;
  requestUrl: string;
  requestMethod: string;
  requestHeadersText: string;
  requestBody: string;
  responseStatus: string;
  responseHeadersText: string;
  responseBody: string;
  metadataText: string;
}

const TRACE_RE =
  /(?:trace[-_]?id|trace-id|x-request-id|cid)["']?\s*[:=]\s*["']?([A-Za-z0-9][A-Za-z0-9._-]{3,})/gi;

function extractTraceIds(...texts: string[]): string[] {
  const out: string[] = [];
  for (const text of texts) {
    for (const match of text.matchAll(TRACE_RE)) {
      const value = match[1];
      if (!out.includes(value)) out.push(value);
    }
  }
  return out;
}

/** Service name from a consistent `[service-name]` prefix across log lines. */
function detectService(lines: DebugLogEntry[]): string | undefined {
  const scanned = lines.slice(0, 12);
  const counts = new Map<string, { total: number; found: number }>();
  for (const line of scanned) {
    const prefix = line.raw.match(/\[([A-Za-z0-9_.-]{2,})\]/);
    const key = prefix ? prefix[1] : "(none)";
    const entry = counts.get(key) ?? { total: 0, found: 0 };
    entry.total += 1;
    if (prefix || entry.total === 1) entry.found += 1;
    counts.set(key, entry);
  }
  let best: { name: string; found: number; total: number } | null = null;
  for (const [name, value] of counts) {
    if (name === "(none)") continue;
    if (value.found < 3 || value.found / value.total < 0.6) continue;
    if (!best || value.found > best.found) best = { name, found: value.found, total: value.total };
  }
  return best?.name;
}

function timelineFrom(logs: LogAnalysis): DebugTimelineEvent[] {
  if (!logs.timeline) return [];
  return logs.timeline.map((bucket, index) => ({
    id: `tl-${index}`,
    label: `${String(bucket.hour).padStart(2, "0")}:00`,
    detail: `${bucket.total} lines · ${bucket.error} error(s) · ${bucket.warn} warn(s)`,
    atMs: Date.UTC(1970, 0, 1, bucket.hour),
    category: "timeline",
    severity: bucket.error > 0 ? "error" : bucket.warn > 0 ? "warning" : "info",
  }));
}

function statusNumber(raw: string): number | null {
  const match = String(raw).trim().match(/\b(\d{3})\b/);
  return match ? Number(match[1]) : null;
}

const METHOD_VALID = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

/**
 * Normalize every pasted slice into a DebugSession (errors, logs, a request /
 * response pair, trace ids, findings, timeline) plus the raw LogAnalysis for
 * renderers that want the hourly buckets.
 */
export function analyzeErrorWorkspace(
  input: ErrorWorkspaceInput,
): { session: DebugSession; logAnalysis: LogAnalysis } {
  const findings: DebugFinding[] = [];
  const metadata: Record<string, string | number | boolean> = {};

  const stack = input.errorText.trim() ? parseStackTrace(input.errorText) : null;
  const errors: DebugError[] = [];
  if (stack) {
    const parsed = stack;
    errors.push({
      kind: parsed.exceptionType?.split(".").pop() ?? "Error",
      message: parsed.message ?? "[no message extracted]",
      frames: parsed.frames.map((frame) =>
        `${frame.function}${frame.file ? ` (${frame.file}${frame.line ? `:${frame.line}` : ""})` : ""}`,
      ),
      file: parsed.location?.file,
      line: parsed.location?.line ?? undefined,
      source: parsed.language,
    });
    metadata.stackLanguage = parsed.language;
    if (parsed.exceptionType) metadata.exceptionType = parsed.exceptionType;
    if (parsed.location?.file) {
      findings.push({
        severity: "info",
        category: "error",
        title: `Stack trace parsed — ${parsed.language}`,
        description: `Exception "${parsed.exceptionType ?? "Error"}" raised at ${parsed.location.file}${parsed.location.line != null ? `:${parsed.location.line}` : ""}, with ${parsed.frames.length} frame(s) in the simplified call chain.`,
        location: parsed.location.file + (parsed.location.line != null ? `:${parsed.location.line}` : ""),
        confidence: "high",
        tags: ["error"],
      });
    }
  }

  const logAnalysis = input.logsText.trim()
    ? analyzeLogs(input.logsText)
    : {
        total: 0,
        levels: [],
        unknownLevel: 0,
        uniqueErrors: 0,
        errorGroups: [],
        timeline: null,
      } satisfies LogAnalysis;
  metadata.logLines = logAnalysis.total;

  const logEntries: DebugLogEntry[] = (() => {
    const out: DebugLogEntry[] = [];
    const traceIds = extractTraceIds(input.logsText);
    const lines = input.logsText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    for (let index = 0; index < lines.length; index += 1) {
      const raw = lines[index];
      const lineLevel = raw.match(/\b(FATAL|ERROR|WARN|WARNING|INFO|DEBUG|TRACE)\b/i);
      const time = raw.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}[T ]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?)/);
      const traceId = extractTraceIds(raw)[0] ?? (traceIds.length === 1 ? traceIds[0] : undefined);
      out.push({
        line: index + 1,
        raw,
        timestampText: time?.[1] ?? undefined,
        level: lineLevel ? lineLevel[1].toUpperCase().replace("WARNING", "WARN") : undefined,
        message: raw.slice(0, 240),
        traceId,
      });
    }
    return out;
  })();

  const service = detectService(logEntries);
  if (service) {
    metadata.service = service;
    for (const entry of logEntries) if (!entry.service) entry.service = service;
  }

  // Repeated identical error message in logs.
  const errorGroups = logAnalysis.errorGroups.filter((group) => group.count > 1);
  if (errorGroups.length > 0) {
    const worst = errorGroups.reduce((a, b) => a.count >= b.count ? a : b);
    findings.push({
      severity: "warning",
      category: "error",
      title: `Error repeated ${worst.count} times in logs`,
      description: `The message "${worst.message}" appears ${worst.count} time(s) in the pasted logs. Repetition usually points to a tight crash-loop or retry storm rather than a one-off.`,
      evidence: worst.message,
      location: `line ${worst.sampleIndex + 1}`,
      recommendation: "Check for a retry loop or a head-of-line-blocking producer around the same window.",
      confidence: "high",
      tags: ["error", "repeat"],
    });
  }

  // Worst-severity log level present.
  const worstLevel = logAnalysis.levels
    .filter((l) => l.count > 0)
    .sort((a, b) => orderOf(b.level) - orderOf(a.level))[0];
  if (worstLevel && ["FATAL", "ERROR"].includes(worstLevel.level)) {
    findings.push({
      severity: worstLevel.level === "FATAL" ? "critical" : "error",
      category: "error",
      title: `${worstLevel.count} ERROR/FATAL log line(s) detected`,
      description: `The pasted logs contain ${worstLevel.count} line(s) at the ${worstLevel.level} level out of ${logAnalysis.total} total — a signal this isn't a clean run.`,
      recommendation: "",
      confidence: "medium",
      tags: ["error"],
    });
  }

  // Logs without trace correlation.
  const uniqueTraceIds = [...new Set(extractTraceIds(input.logsText))];
  metadata.uniqueTraceIds = uniqueTraceIds.length;
  if (logEntries.length > 0 && uniqueTraceIds.length === 0 && logAnalysis.total > 0) {
    findings.push({
      severity: "info",
      category: "correlation",
      title: "No trace IDs found in the pasted logs",
      description: "The log lines carry neither a traceId, trace_id nor x-request-id. Correlation across services will be guesswork — add a trace ID to your log formatter.",
      tags: ["correlation"],
      confidence: "low",
    });
  }

  const sessionErrors = errors;
  const sessionLogs = logEntries;
  const sessionRequests: DebugRequest[] = [];
  const sessionResponses: DebugResponse[] = [];
  const sessionTimeline = timelineFrom(logAnalysis);

  // Request evidence.
  const requestUrlRaw = input.requestUrl.trim();
  const requestMethodRaw = input.requestMethod.trim().toUpperCase();
  const requestHeadersRaw = input.requestHeadersText;
  let requestUrl = requestUrlRaw;
  let requestMethod = requestMethodRaw;
  if (requestHeadersRaw.trim()) {
    const requestLine = requestHeadersRaw.trim().split(/\r?\n/)[0];
    const requestLineMatch = requestLine.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/);
    if (requestLineMatch) {
      if (!requestUrl) requestUrl = requestLineMatch[2];
      if (!requestMethod) requestMethod = requestLineMatch[1];
    }
  }
  const hasRequest = Boolean(requestUrl || requestHeadersRaw.trim() || input.requestBody.trim() || requestMethod);
  if (hasRequest) {
    const headers = requestHeadersRaw.trim() ? parseHeaderBlock(requestHeadersRaw) : [];
    let host = "";
    let path = "";
    try {
      host = requestUrl ? new URL(requestUrl).host : "";
      path = requestUrl ? new URL(requestUrl).pathname : "";
    } catch {
      host = "";
      path = requestUrl.split("?")[0] ?? "";
    }
    const traceId = extractTraceIds(...headers.map(([name, value]) => `${name}: ${value}`))[0];
    sessionRequests.push({
      id: "rz-1",
      method: (METHOD_VALID.includes(requestMethod) ? requestMethod : "POST") as HttpMethod,
      url: requestUrl || "[no URL pasted]",
      host,
      path,
      headers,
      query: [],
      cookies: [],
      bodyText: input.requestBody.trim().length > 0 ? input.requestBody : undefined,
      traceId,
    });
    if (requestUrl) {
      findings.push({
        severity: "info",
        category: "request",
        title: `Request captured — ${requestMethod || "POST"} ${path || requestUrl}`,
        description: `URL: ${requestUrl} · Host: ${host || "unknown"} · ${headers.length} header(s) pasted. Use the Reproduction tab to convert this into a runnable cURL or code snippet.`,
        location: requestUrl,
        confidence: "medium",
        tags: ["request"],
        relatedIds: ["rz-1"],
      });
    }
  }

  // Response evidence.
  const status = statusNumber(input.responseStatus);
  if (input.responseStatus.trim() || input.responseBody.trim() || input.responseHeadersText.trim()) {
    const headers = input.responseHeadersText.trim() ? parseHeaderBlock(input.responseHeadersText) : [];
    const body = input.responseBody.trim();
    const mediaType = (() => {
      const hit = headers.find(([name]) => name.toLowerCase() === "content-type");
      return hit ? hit[1] : body.length > 0 && body.startsWith("{") ? "application/json" : undefined;
    })();
    if (status != null && status >= 500) {
      findings.push({
        severity: "critical",
        category: "response",
        title: `Response status ${status} — server-side failure`,
        description: "A 5xx response means the failure was on the server, not the caller. Pair this with the stack trace and the matching service log lines.",
        location: input.responseStatus,
        confidence: "high",
        tags: ["failed"],
        relatedIds: ["rz-response-1"],
      });
    }
    sessionResponses.push({
      id: "rz-response-1",
      status: status ?? 0,
      headers,
      bodyText: body.length > 0 ? body : undefined,
      bodyMediaType: mediaType,
      sizeBytes: new Blob([body]).size,
    });
  }

  // Metadata key=value pairs.
  const metadataPairs: [string, string][] = [];
  for (const rawLine of input.metadataText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const sep = line.indexOf("=");
    if (sep > 0) metadataPairs.push([line.slice(0, sep).trim(), line.slice(sep + 1).trim()]);
  }
  for (const [key, value] of metadataPairs) metadata[key] = value;
  if (metadataPairs.length > 0) metadata.contextPairs = metadataPairs.length;

  // Correlation: does the parsed exception appear in the logs too?
  const exceptionTouch = stack?.exceptionType
    ? logAnalysis.errorGroups.find(
        (group) => group.message.toLowerCase().includes(stack.exceptionType!.toLowerCase()),
      )
    : null;
  if (stack && exceptionTouch && errorGroups.length === 0) {
    findings.push({
      severity: "success",
      category: "correlation",
      title: "Stack trace and logs point at the same failure",
      description: `The exception "${stack.exceptionType}" also appears in the logs (${exceptionTouch.count} matching line(s)), so the crash is consistent with the observed log errors.`,
      evidence: exceptionTouch.message,
      confidence: "medium",
      tags: ["correlation"],
    });
  }

  // JSON validation of response / request bodies.
  const bodyToValidate = input.responseBody.trim() ? input.responseBody : input.requestBody;
  if (bodyToValidate.trim() && bodyToValidate.trim().startsWith("{")) {
    const result = parseJson(bodyToValidate);
    if (!result.ok) {
      findings.push({
        severity: "warning",
        category: "json",
        title: "Pasted body is not valid JSON",
        description: result.error.message,
        evidence: result.error.message,
        tags: ["json"],
        confidence: "high",
      });
    }
  }

  // Overall session summary.
  metadata.totalFindings = findings.length;
  metadata.totalLogLines = logAnalysis.total;
  metadata.resultBreakdown = `${errors.length} error(s), ${sessionRequests.length} request(s), ${sessionResponses.length} response(s)`;

  const session: DebugSession = {
    source: "error-workspace",
    metadata,
    requests: sessionRequests,
    responses: sessionResponses,
    logs: sessionLogs,
    errors: sessionErrors,
    traceIds: uniqueTraceIds,
    findings,
    timeline: sessionTimeline,
  };

  return { session, logAnalysis };
}

function orderOf(level: string): number {
  return ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"].indexOf(level);
}

export const EMPTY_ERROR_WORKSPACE_INPUT: ErrorWorkspaceInput = {
  errorText: "",
  logsText: "",
  requestUrl: "",
  requestMethod: "",
  requestHeadersText: "",
  requestBody: "",
  responseStatus: "",
  responseHeadersText: "",
  responseBody: "",
  metadataText: "",
};

/** Build a reproduction RequestDraft from the request slice. */
export function buildReproductionDraft(
  input: ErrorWorkspaceInput,
): RequestDraft | null {
  void input;
  const session = analyzeErrorWorkspace(input);
  const req = session.session.requests[0];
  if (!req || req.url === "[no URL pasted]") return null;
  const draft: RequestDraft = {
    method: (METHOD_VALID.includes(req.method) ? req.method : "POST") as HttpMethod,
    url: req.url,
    query: [newRow()],
    headers: req.headers.length > 0 ? req.headers.map(([name, value]) => newRow(name, value)) : [],
    bodyMode: req.bodyText !== undefined && req.bodyText.trim().startsWith("{") ? "json" : req.bodyText ? "text" : "none",
    bodyText: req.bodyText ?? "",
    formRows: [newRow()],
    authMode: "none",
    bearerToken: "",
    basicUsername: "",
    basicPassword: "",
  };
  return draft;
}

export interface ReproductionBundle {
  curl: string;
  codeSnippets: { id: string; label: string; code: string }[];
}

export function buildReproductionBundle(input: ErrorWorkspaceInput): ReproductionBundle | null {
  const draft = buildReproductionDraft(input);
  if (!draft) return null;
  return {
    curl: draftToCurl(draft),
    codeSnippets: CURL_CODE_TARGETS.map((target) => ({
      id: target.id,
      label: target.label,
      code: generateCurlCode(target.id, draft),
    })),
  };
}

export function exportMarkdown(session: DebugSession): string {
  const lines: string[] = [];
  lines.push(`# Production error workspace report`);
  lines.push("");
  lines.push(
    `Source: ${session.source} · generated ${new Date().toISOString()} · ${session.findings.length} finding(s)`,
  );
  lines.push("");
  lines.push("## Findings");
  if (session.findings.length === 0) lines.push("- none");
  for (const finding of session.findings) {
    lines.push(`- **[${finding.severity}]** ${finding.title}`);
    if (finding.description) lines.push(`  - ${finding.description}`);
    if (finding.evidence) lines.push(`  - Evidence: \`${finding.evidence}\``);
    if (finding.location) lines.push(`  - Location: ${finding.location}`);
  }
  lines.push("");
  lines.push("## Errors");
  if (session.errors.length === 0) lines.push("- none");
  for (const error of session.errors) {
    lines.push(`- **${error.kind}**: ${error.message}`);
    if (error.file) lines.push(`  - ${error.file}${error.line ? `:${error.line}` : ""}`);
    for (const frame of error.frames) lines.push(`  - ${frame}`);
  }
  lines.push("");
  lines.push(`## Requests (${session.requests.length})`);
  for (const req of session.requests) {
    lines.push(`- ${req.method} ${req.url}${req.status ? ` → ${req.status}` : ""}`);
    if (req.traceId) lines.push(`  - traceId: ${req.traceId}`);
  }
  lines.push("");
  lines.push(`## Responses (${session.responses.length})`);
  for (const res of session.responses) {
    lines.push(`- **${res.status}**${res.statusText ? ` ${res.statusText}` : ""}`);
    if (res.sizeBytes != null) lines.push(`  - ${res.sizeBytes} bytes`);
  }
  lines.push("");
  lines.push(`## Logs (${session.logs.length} lines)`);
  for (const entry of session.logs.slice(0, 50)) {
    const stamp = entry.timestampText ? `${entry.timestampText} ` : "";
    const level = entry.level ? `[${entry.level}] ` : "";
    lines.push(`- ${stamp}${level}${entry.message}`);
  }
  if (session.logs.length > 50) lines.push(`- … and ${session.logs.length - 50} more`);
  lines.push("");
  lines.push("## Metadata");
  for (const [key, value] of Object.entries(session.metadata)) {
    lines.push(`- ${key}: ${String(value)}`);
  }
  return lines.join("\n");
}

export function exportJson(session: DebugSession): string {
  const { timeline, ...rest } = session;
  return JSON.stringify({ ...rest, timeline: timeline.map((event) => ({ label: event.label, detail: event.detail, atMs: event.atMs, category: event.category })) }, null, 2);
}