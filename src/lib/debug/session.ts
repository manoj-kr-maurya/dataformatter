/**
 * Session construction helpers + byte/duration formatting shared by analyzers.
 * Pure, browser-side.
 */

import type { DebugSession, DebugSource } from "@/lib/debug/types";

export function emptySession(source: DebugSource): DebugSession {
  return {
    source,
    metadata: {},
    requests: [],
    responses: [],
    logs: [],
    errors: [],
    traceIds: [],
    findings: [],
    timeline: [],
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = "B";
  for (const next of units) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  const text = value >= 100 ? Math.round(value).toString() : value.toFixed(1);
  return `${text} ${unit}`;
}

export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms < 1) return "<1 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
}