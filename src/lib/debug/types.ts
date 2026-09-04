/**
 * Shared debugging architecture.
 *
 * Normalized model + structured findings used by the HAR debugger, the API
 * breaking-change detector and the production error workspace. Analyzers
 * return findings and a normalized DebugSession instead of driving the UI
 * directly, so future "Debug Anything" inputs can merge into the same shape.
 *
 * Everything here is pure and browser-side.
 */

export type DebugSeverity =
  | "critical"
  | "error"
  | "warning"
  | "info"
  | "success";

export type DebugConfidence = "high" | "medium" | "low";

/**
 * One structured observation. Severity labels rather than colors carry the
 * meaning; color is only an accent in the UI.
 */
export interface DebugFinding {
  severity: DebugSeverity;
  /** Machine tag for filtering, e.g. "performance" | "security" | "schema". */
  category: string;
  title: string;
  description: string;
  /** Raw excerpt or value backing the finding. */
  evidence?: string;
  /** Where in the input this finding points (URL, path, log line, ...). */
  location?: string;
  recommendation?: string;
  confidence?: DebugConfidence;
  /** Optional filter tags such as "slow" | "failed" | "security". */
  tags?: string[];
  /** Related normalized-request/response/log ids. */
  relatedIds?: string[];
}

/** One HTTP request, normalized across HAR / logs / API evidence. */
export interface DebugRequest {
  id: string;
  method: string;
  url: string;
  host: string;
  path: string;
  status?: number;
  statusText?: string;
  httpVersion?: string;
  /** Epoch ms when the request started (when the source provides it). */
  startedAtMs?: number;
  durationMs?: number;
  headers: [string, string][];
  query: [string, string][];
  cookies: [string, string][];
  bodyText?: string;
  bodyMediaType?: string;
  /** requestId / traceId / correlationId gleaned from headers or bodies. */
  traceId?: string;
  /** Partial HAR-style timing components (ms), each optional. */
  timings?: {
    blocked?: number;
    dns?: number;
    connect?: number;
    ssl?: number;
    send?: number;
    wait?: number;
    receive?: number;
  };
}

export interface DebugResponse {
  id: string;
  status: number;
  statusText?: string;
  httpVersion?: string;
  headers: [string, string][];
  bodyText?: string;
  bodyMediaType?: string;
  sizeBytes?: number;
  redirectUrl?: string;
}

export interface DebugLogEntry {
  /** 1-based line number in the source text (when applicable). */
  line: number;
  raw: string;
  timestampMs?: number;
  timestampText?: string;
  level?: string;
  message: string;
  service?: string;
  traceId?: string;
  requestId?: string;
}

export interface DebugError {
  kind: string;
  message: string;
  /** Human frames, most-recent-first, e.g. ["RewardController", "RewardService"]. */
  frames: string[];
  file?: string;
  line?: number;
  source?: string;
}

/** One entry on a shared chronological timeline. */
export interface DebugTimelineEvent {
  id: string;
  label: string;
  detail?: string;
  /** Epoch ms. Absent when the input had no timestamp to order by. */
  atMs?: number;
  category: string;
  severity?: DebugSeverity;
}

export type DebugSource = "har" | "api-diff" | "error-workspace" | "generic";

/**
 * The normalized debugging session. Each feature fills the slices it needs;
 * the structure is the extensible merge target for future "Debug Anything".
 */
export interface DebugSession {
  source: DebugSource;
  /** Freeform facts ("harVersion", "totalEntries", "activeTraceId", ...). */
  metadata: Record<string, string | number | boolean>;
  requests: DebugRequest[];
  responses: DebugResponse[];
  logs: DebugLogEntry[];
  errors: DebugError[];
  traceIds: string[];
  findings: DebugFinding[];
  timeline: DebugTimelineEvent[];
}