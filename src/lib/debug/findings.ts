/**
 * Finding helpers shared by every analyzer. Pure, browser-side.
 */

import type {
  DebugConfidence,
  DebugFinding,
  DebugSeverity,
} from "@/lib/debug/types";

export const DEBUG_SEVERITIES: readonly DebugSeverity[] = [
  "critical",
  "error",
  "warning",
  "info",
  "success",
];

/**
 * Text labels and accent tones for severities. Text/icon always accompany
 * color so meaning never depends on color alone.
 */
export const SEVERITY_META: Record<
  DebugSeverity,
  { label: string; tone: "red" | "amber" | "sky" | "emerald" | "zinc" }
> = {
  critical: { label: "Critical", tone: "red" },
  error: { label: "Error", tone: "red" },
  warning: { label: "Warning", tone: "amber" },
  info: { label: "Info", tone: "sky" },
  success: { label: "Healthy", tone: "emerald" },
};

export const SEVERITY_ORDER: Record<DebugSeverity, number> = {
  critical: 0,
  error: 1,
  warning: 2,
  info: 3,
  success: 4,
};

export interface FindingInput {
  severity: DebugSeverity;
  category: string;
  title: string;
  description: string;
  evidence?: string;
  location?: string;
  recommendation?: string;
  confidence?: DebugConfidence;
  tags?: string[];
  relatedIds?: string[];
}

export function makeFinding(input: FindingInput): DebugFinding {
  return {
    confidence: input.confidence ?? (input.severity === "info" || input.severity === "success" ? undefined : "high"),
    severity: input.severity,
    category: input.category,
    title: input.title,
    description: input.description,
    ...(input.evidence !== undefined ? { evidence: input.evidence } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    ...(input.recommendation !== undefined ? { recommendation: input.recommendation } : {}),
    ...(input.tags !== undefined && input.tags.length > 0 ? { tags: input.tags } : {}),
    ...(input.relatedIds !== undefined && input.relatedIds.length > 0
      ? { relatedIds: input.relatedIds }
      : {}),
  };
}

/** Deduplicates by title + location and orders critical → info → healthy. */
export function sortFindings(findings: DebugFinding[]): DebugFinding[] {
  const seen = new Set<string>();
  const unique: DebugFinding[] = [];
  for (const finding of findings) {
    const key = `${finding.severity}|${finding.title}|${finding.location ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }
  return [...unique].sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.title.localeCompare(b.title);
  });
}

export function countBySeverity(findings: DebugFinding[]): Record<DebugSeverity, number> {
  const counts: Record<DebugSeverity, number> = {
    critical: 0,
    error: 0,
    warning: 0,
    info: 0,
    success: 0,
  };
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }
  return counts;
}