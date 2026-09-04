/**
 * HAR analysis — turns normalized entries into structured findings plus a
 * DebugSession (requests, responses, timeline). Heuristics are labeled as
 * observations, never diagnoses. Pure, browser-side.
 */

import type {
  DebugFinding,
  DebugRequest,
  DebugResponse,
  DebugSession,
  DebugTimelineEvent,
} from "@/lib/debug/types";
import { makeFinding, sortFindings } from "@/lib/debug/findings";
import { emptySession, formatBytes } from "@/lib/debug/session";
import type { HarEntryView, HarSummary } from "@/lib/har/parse";

export const DEFAULT_SLOW_THRESHOLD_MS = 1000;
export const DEFAULT_LARGE_THRESHOLD_BYTES = 1024 * 1024;
const MAX_DETAIL_FINDINGS = 40;

export interface HarAnalysisOptions {
  slowThresholdMs?: number;
  largeThresholdBytes?: number;
}

export interface HarAnalysis {
  session: DebugSession;
  findings: DebugFinding[];
  summary: HarSummary;
  /** Depends on the data, not the defaults — reused for the UI legend. */
  slowThresholdMs: number;
  largeThresholdBytes: number;
  maxDurationMs: number;
}

function headerValue(headers: [string, string][], lowerName: string): string | undefined {
  return headers.find(([name]) => name.toLowerCase() === lowerName)?.[1];
}

function hasHeader(headers: [string, string][], lowerName: string): boolean {
  return headers.some(([name]) => name.toLowerCase() === lowerName);
}

/** "normalized URL" = method + pathname (query dropped) for duplication. */
function normalizedEndpoint(entry: HarEntryView): string {
  return `${entry.method} ${entry.path}`;
}

export function analyzeHar(
  entries: HarEntryView[],
  summary: HarSummary,
  options: HarAnalysisOptions = {},
): HarAnalysis {
  const slowThresholdMs = options.slowThresholdMs ?? DEFAULT_SLOW_THRESHOLD_MS;
  const largeThresholdBytes = options.largeThresholdBytes ?? DEFAULT_LARGE_THRESHOLD_BYTES;
  const session = emptySession("har");
  session.metadata = {
    harVersion: "",
    totalEntries: summary.totalEntries,
    successful: summary.successful,
    failed: summary.failed,
    redirects: summary.redirects,
  };

  const requests: DebugRequest[] = [];
  const responses: DebugResponse[] = [];
  const timeline: DebugTimelineEvent[] = [];
  let maxDurationMs = 0;

  for (const entry of entries) {
    requests.push(entry.request);
    responses.push(entry.response);
    maxDurationMs = Math.max(maxDurationMs, entry.time ?? 0);
    if (entry.startedAtMs !== undefined) {
      timeline.push({
        id: `s${entry.id}`,
        atMs: entry.startedAtMs,
        label: `${entry.method} ${entry.path}`,
        detail: `Request started`,
        category: "request",
      });
      if (entry.time !== undefined) {
        timeline.push({
          id: `e${entry.id}`,
          atMs: entry.startedAtMs + entry.time,
          label: `${entry.method} ${entry.path}`,
          detail: `HTTP ${entry.status} after ${entry.time.toFixed(0)} ms`,
          category: "response",
          severity: entry.status >= 400 ? "error" : entry.status >= 300 ? "warning" : "success",
        });
      }
    }
  }

  session.requests = requests;
  session.responses = responses;
  session.timeline = timeline;

  const collected: DebugFinding[] = [];

  // ── Status failures ─────────────────────────────────────────────────────
  const failed = entries.filter((entry) => entry.status >= 400 || entry.status === 0);
  if (failed.length > 0) {
    collected.push(
      makeFinding({
        severity: failed.length > 20 ? "critical" : "error",
        category: "status",
        title: `${failed.length} failed ${failed.length === 1 ? "request" : "requests"}`,
        description:
          failed.length === 1
            ? `One request did not complete successfully.`
            : `${failed.length} of ${entries.length} requests returned a failure status (4xx/5xx or no status).`,
        tags: ["failed"],
        relatedIds: failed.slice(0, 20).map((entry) => entry.id),
      }),
    );
  }

  // Failed-by-endpoint breakdown (evidence, capped detail).
  const failuresByEndpoint = new Map<string, { count: number; statuses: Map<number, number>; entry: HarEntryView }>();
  for (const entry of failed) {
    const key = normalizedEndpoint(entry);
    const bucket = failuresByEndpoint.get(key) ?? {
      count: 0,
      statuses: new Map<number, number>(),
      entry,
    };
    bucket.count += 1;
    bucket.statuses.set(entry.status, (bucket.statuses.get(entry.status) ?? 0) + 1);
    failuresByEndpoint.set(key, bucket);
  }
  const repeatedFailures = Array.from(failuresByEndpoint.values())
    .filter((bucket) => bucket.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_DETAIL_FINDINGS);
  for (const bucket of repeatedFailures) {
    const statusList = Array.from(bucket.statuses.entries())
      .slice(0, 4)
      .map(([status, count]) => `${count} × ${status === 0 ? "no status" : status}`)
      .join(", ");
    collected.push(
      makeFinding({
        severity: "critical",
        category: "status",
        title: `${bucket.entry.method} ${bucket.entry.path} failed ${bucket.count} times`,
        description: `The same endpoint failed repeatedly (${statusList}).`,
        location: `${bucket.entry.method} ${bucket.entry.path}`,
        evidence: statusList,
        recommendation: "Inspect one failing request for the status and response body; check retry and circuit-breaker behavior.",
        tags: ["failed"],
        confidence: "medium",
        relatedIds: [bucket.entry.id],
      }),
    );
  }

  // Auth failures (401 / 403).
  const authFailures = entries.filter((entry) => entry.status === 401 || entry.status === 403);
  if (authFailures.length > 0) {
    collected.push(
      makeFinding({
        severity: "warning",
        category: "authentication",
        title: `${authFailures.length} authentication ${authFailures.length === 1 ? "failure" : "failures"}`,
        description: `${authFailures.length} request(s) returned 401 Unauthorized or 403 Forbidden. This often indicates an expired or missing credential in the captured session.`,
        tags: ["failed", "security", "authentication"],
        confidence: "medium",
        relatedIds: authFailures.slice(0, 10).map((entry) => entry.id),
      }),
    );
  }

  // 404 clusters.
  const notFound = entries.filter((entry) => entry.status === 404);
  if (notFound.length >= 2) {
    const paths = Array.from(new Set(notFound.map((entry) => entry.path))).slice(0, 5).join(", ");
    collected.push(
      makeFinding({
        severity: "info",
        category: "status",
        title: `${notFound.length} responses returned 404 Not Found`,
        description: `Requests hit ${paths}. 404s can be missing routes, renamed endpoints, or expected lookups that simply have no match.`,
        tags: ["failed", "not-found"],
        confidence: "medium",
        relatedIds: notFound.slice(0, 10).map((entry) => entry.id),
      }),
    );
  }

  // ── Slow requests ───────────────────────────────────────────────────────
  const withTiming = entries.filter((entry) => (entry.time ?? entry.request.durationMs) !== undefined);
  const slow = withTiming
    .filter((entry) => (entry.time ?? entry.request.durationMs ?? 0) > slowThresholdMs)
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
  if (slow.length > 0) {
    collected.push(
      makeFinding({
        severity: slow.length > 5 ? "warning" : "info",
        category: "performance",
        title: `${slow.length} slow ${slow.length === 1 ? "request" : "requests"} over ${slowThresholdMs} ms`,
        description: `Requests that took longer than the ${slowThresholdMs} ms threshold. This is a heuristic, not a diagnosis — inspect each request's timing breakdown.`,
        tags: ["slow", "performance"],
        confidence: "medium",
        relatedIds: slow.slice(0, 40).map((entry) => entry.id),
      }),
    );
    for (const entry of slow.slice(0, MAX_DETAIL_FINDINGS)) {
      const duration = entry.time ?? entry.request.durationMs ?? 0;
      const primary = primaryDelay(entry);
      collected.push(
        makeFinding({
          severity: "warning",
          category: "performance",
          title: `Slow request — ${duration.toFixed(0)} ms`,
          description: `${entry.method} ${entry.path} took ${formatDuration(duration)}.`,
          location: `${entry.method} ${entry.path}`,
          evidence: primary ? `Primary delay: ${primary.label}` : undefined,
          recommendation: primary
            ? `Almost all of the time was spent ${primary.label.toLowerCase()}. Verify the ${primary.label.toLowerCase()} service or resource.`
            : undefined,
          tags: ["slow", "performance"],
          confidence: "medium",
          relatedIds: [entry.id],
        }),
      );
    }
  } else if (withTiming.length > 0) {
    collected.push(
      makeFinding({
        severity: "success",
        category: "performance",
        title: "No slow requests detected",
        description: `Every timed request completed within ${slowThresholdMs} ms (the configurable slow threshold).`,
        tags: ["performance"],
      }),
    );
  }

  // ── Duplicate requests ──────────────────────────────────────────────────
  const byEndpoint = new Map<string, HarEntryView[]>();
  for (const entry of entries) {
    const key = normalizedEndpoint(entry);
    const bucket = byEndpoint.get(key) ?? [];
    bucket.push(entry);
    byEndpoint.set(key, bucket);
  }
  const duplicates = Array.from(byEndpoint.entries())
    .filter(([, bucket]) => bucket.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, MAX_DETAIL_FINDINGS);
  for (const [endpoint, bucket] of duplicates) {
    collected.push(
      makeFinding({
        severity: "warning",
        category: "duplicates",
        title: `Potential duplicate request — ${endpoint} called ${bucket.length} times`,
        description: `The same method and URL path appears ${bucket.length} times. Duplicates can be normal (pagination, polling, retries), so this is only flagged as a candidate for review.`,
        location: endpoint,
        evidence: `called ${bucket.length} times`,
        recommendation: "Check whether repeated calls are intentional polling/retries before removing anything.",
        tags: ["duplicates", "performance"],
        confidence: "medium",
        relatedIds: bucket.slice(0, 10).map((entry) => entry.id),
      }),
    );
  }

  // ── Large responses ─────────────────────────────────────────────────────
  const large = entries
    .filter((entry) => entry.transferSize > largeThresholdBytes)
    .sort((a, b) => b.transferSize - a.transferSize)
    .slice(0, MAX_DETAIL_FINDINGS);
  if (large.length > 0) {
    collected.push(
      makeFinding({
        severity: "warning",
        category: "performance",
        title: `${large.length} large response${large.length === 1 ? "" : "s"} over ${formatBytes(largeThresholdBytes)}`,
        description: `Responses that transferred more than ${formatBytes(largeThresholdBytes)}. Large payloads inflate load time and mobile data usage.`,
        tags: ["large", "performance"],
        confidence: "medium",
        relatedIds: large.slice(0, 40).map((entry) => entry.id),
      }),
    );
    for (const entry of large.slice(0, 10)) {
      collected.push(
        makeFinding({
          severity: "info",
          category: "performance",
          title: `Large response — ${formatBytes(entry.transferSize)}`,
          description: `${entry.method} ${entry.path} transferred ${formatBytes(entry.transferSize)}.`,
          location: `${entry.method} ${entry.path}`,
          tags: ["large", "performance"],
          confidence: "medium",
          relatedIds: [entry.id],
        }),
      );
    }
  }

  // ── Cache analysis ──────────────────────────────────────────────────────
  const repeatedEndpoints = Array.from(byEndpoint.values())
    .filter((bucket) => bucket.length > 1)
    .flat();
  const cacheableLookedUp = new Set<string>();
  for (const entry of repeatedEndpoints) {
    const key = `${entry.status}:${entry.path}`;
    if (cacheableLookedUp.has(key)) continue;
    cacheableLookedUp.add(key);
    const cacheControl = headerValue(entry.response.headers, "cache-control");
    const expires = headerValue(entry.response.headers, "expires");
    const etag = headerValue(entry.response.headers, "etag");
    if (cacheControl && /(max-age|public|s-maxage)/i.test(cacheControl)) {
      collected.push(
        makeFinding({
          severity: "info",
          category: "caching",
          title: `Response is cacheable — ${entry.method} ${entry.path}`,
          description: `Cache-Control: ${cacheControl}${etag ? `, ETag: ${etag}` : ""}`,
          location: `${entry.method} ${entry.path}`,
          evidence: `Cache-Control: ${cacheControl}`,
          tags: ["caching"],
        }),
      );
    } else if (!cacheControl && !expires && !etag) {
      collected.push(
        makeFinding({
          severity: "info",
          category: "caching",
          title: `Repeated resource has no obvious caching headers — ${entry.method} ${entry.path}`,
          description: "This resource is fetched more than once but carries no Cache-Control, Expires or ETag. Caches may apply heuristic expiry (possibly re-fetching it).",
          location: `${entry.method} ${entry.path}`,
          recommendation: "Consider an explicit Cache-Control policy if the resource is stable across requests.",
          tags: ["caching", "performance"],
          confidence: "low",
          relatedIds: [entry.id],
        }),
      );
    }
  }

  // ── CORS analysis ───────────────────────────────────────────────────────
  const corsHeaders = ["access-control-allow-origin", "access-control-allow-credentials", "access-control-allow-methods", "access-control-allow-headers"];
  const corsEntries = entries.filter((entry) => entry.response.headers.some(([name]) => corsHeaders.includes(name.toLowerCase())));
  for (const entry of corsEntries.slice(0, 8)) {
    const allowOrigin = headerValue(entry.response.headers, "access-control-allow-origin");
    const allowMethods = headerValue(entry.response.headers, "access-control-allow-methods");
    const allowCredentials = headerValue(entry.response.headers, "access-control-allow-credentials");
    collected.push(
      makeFinding({
        severity: allowOrigin === "*" && /^true$/i.test(allowCredentials ?? "") ? "warning" : "info",
        category: "cors",
        title: `CORS policy present — ${entry.method} ${entry.path}`,
        description: `Access-Control-Allow-Origin: ${allowOrigin ?? "not set"}${allowMethods ? `, methods: ${allowMethods}` : ""}${allowCredentials ? `, credentials: ${allowCredentials}` : ""}`,
        location: `${entry.method} ${entry.path}`,
        evidence: allowOrigin ? `Access-Control-Allow-Origin: ${allowOrigin}` : undefined,
        tags: ["cors", "security"],
        confidence: "medium",
        relatedIds: [entry.id],
      }),
    );
  }
  const preflightWithoutOrigin = entries.filter(
    (entry) => entry.method === "OPTIONS" && !hasHeader(entry.response.headers, "access-control-allow-origin"),
  );
  if (preflightWithoutOrigin.length > 0 && corsEntries.length > 0) {
    collected.push(
      makeFinding({
        severity: "warning",
        category: "cors",
        title: "Preflight (OPTIONS) responses lack Access-Control-Allow-Origin",
        description: `${preflightWithoutOrigin.length} OPTIONS response(s) in this HAR have no CORS allow-origin header. Browsers may block the subsequent request — only a reproduction in a real browser can confirm this.`,
        tags: ["cors", "security"],
        confidence: "low",
        relatedIds: preflightWithoutOrigin.slice(0, 10).map((entry) => entry.id),
      }),
    );
  }

  // ── Security headers ────────────────────────────────────────────────────
  const expectedSecurityHeaders = [
    "strict-transport-security",
    "content-security-policy",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
  ] as const;
  const sample = entries.find((entry) => entry.status >= 200 && entry.status < 400);
  if (sample) {
    const present = expectedSecurityHeaders.filter((name) => hasHeader(sample.response.headers, name));
    const absent = expectedSecurityHeaders.filter((name) => !hasHeader(sample.response.headers, name));
    for (const name of present) {
      const value = headerValue(sample.response.headers, name) ?? "";
      collected.push(
        makeFinding({
          severity: "success",
          category: "security",
          title: `${headerLabel(name)} present`,
          description: value ? `${headerLabel(name)}: ${value.slice(0, 160)}` : "",
          tags: ["security"],
        }),
      );
    }
    for (const name of absent) {
      collected.push(
        makeFinding({
          severity: "info",
          category: "security",
          title: `${headerLabel(name)} not detected`,
          description: "Header not detected on a sampled 2xx/3xx response. Absence is an observation, not a finding that the site is insecure.",
          tags: ["security"],
        }),
      );
    }
  }

  // ── JWT / auth detection ────────────────────────────────────────────────
  const withAuthHeader = entries.filter((entry) =>
    entry.request.headers.some(
      ([name, value]) => name.toLowerCase() === "authorization" && /bearer/i.test(value),
    ),
  );
  if (withAuthHeader.length > 0) {
    collected.push(
      makeFinding({
        severity: "warning",
        category: "authentication",
        title: "Authorization (Bearer) headers captured",
        description: `${withAuthHeader.length} request(s) carry an Authorization header. Values are masked by default. Hidden in this capture are credentials — treat the file itself as sensitive.`,
        recommendation: "Use a JWT decoder to inspect claims locally, and never share this HAR publicly.",
        tags: ["security", "authentication"],
        confidence: "high",
        relatedIds: withAuthHeader.slice(0, 10).map((entry) => entry.id),
      }),
    );
  }

  // ── Redirects ───────────────────────────────────────────────────────────
  if (summary.redirects > 0) {
    const redirects = entries.filter((entry) => entry.status >= 300 && entry.status < 400);
    const chains = countRedirectChains(redirects);
    collected.push(
      makeFinding({
        severity: "info",
        category: "status",
        title: `${summary.redirects} redirect${summary.redirects === 1 ? "" : "s"} (${chains} chain${chains === 1 ? "" : "s"})`,
        description: `${summary.redirects} response(s) redirected. Multiple chained redirects add latency to the requests that follow them.`,
        tags: ["redirects"],
        confidence: "high",
        relatedIds: redirects.slice(0, 20).map((entry) => entry.id),
      }),
    );
  } else if (entries.length > 0) {
    collected.push(
      makeFinding({
        severity: "success",
        category: "status",
        title: "No redirects detected",
        description: "Every entry completed without a 3xx redirect.",
        tags: ["redirects"],
      }),
    );
  }

  session.findings = sortFindings(collected);
  return {
    session,
    findings: session.findings,
    summary,
    slowThresholdMs,
    largeThresholdBytes,
    maxDurationMs,
  };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function primaryDelay(entry: HarEntryView): { label: string; ms: number } | undefined {
  const timings = entry.timings;
  const total = Object.values(timings).reduce((acc, value) => acc + value, 0);
  if (total <= 0) return undefined;
  let best: { label: string; ms: number } | undefined;
  const labels: Record<string, string> = {
    wait: "Waiting for server response",
    blocked: "Blocked (queueing, proxies)",
    connect: "Establishing connection",
    ssl: "TLS handshake",
    dns: "DNS lookup",
    send: "Sending request",
    receive: "Receiving response",
  };
  for (const [key, value] of Object.entries(timings)) {
    if (value > 0 && (best === undefined || value > best.ms)) {
      best = { label: labels[key] ?? key, ms: value };
    }
  }
  if (!best || best.ms / total < 0.4) return undefined;
  return best;
}

function headerLabel(lower: string): string {
  return lower
    .split("-")
    .map((part) => part.toUpperCase())
    .join("-");
}

function countRedirectChains(redirects: HarEntryView[]): number {
  const byUrl = new Map<string, HarEntryView>();
  for (const entry of redirects) {
    byUrl.set(entry.url, entry);
  }
  let chains = 0;
  const visited = new Set<string>();
  for (const entry of redirects) {
    if (visited.has(entry.url)) continue;
    chains += 1;
    let cursor: HarEntryView | undefined = entry;
    while (cursor) {
      visited.add(cursor.url);
      cursor = cursor.redirectUrl ? byUrl.get(cursor.redirectUrl) : undefined;
    }
  }
  return chains;
}