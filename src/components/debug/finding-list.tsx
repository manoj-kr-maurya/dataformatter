"use client";

import { useMemo, useState } from "react";

import type { DebugFinding, DebugSeverity } from "@/lib/debug/types";
import { SEVERITY_META, countBySeverity } from "@/lib/debug/findings";

const TONE_STYLES: Record<DebugSeverity, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  error: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
};

/** Accessible severity chip — text label is always present, color is accent. */
export function SeverityBadge({ severity }: { severity: DebugSeverity }) {
  const meta = SEVERITY_META[severity];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${TONE_STYLES[severity]}`}
    >
      <span aria-hidden="true">{severity === "critical" ? "◆" : severity === "error" ? "✕" : severity === "warning" ? "▲" : severity === "info" ? "ℹ" : "✓"}</span>
      {meta.label}
    </span>
  );
}

export type FindingFilter = "all" | DebugSeverity;

export const FINDING_FILTERS: { key: FindingFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "error", label: "Errors" },
  { key: "warning", label: "Warnings" },
  { key: "info", label: "Info" },
  { key: "success", label: "Healthy" },
];

export interface FindingListProps {
  findings: DebugFinding[];
  /** Optional per-finding action (e.g. select the related request). */
  onSelect?: (finding: DebugFinding) => void;
  emptyMessage?: string;
  search?: string;
  match?: (finding: DebugFinding, query: string) => boolean;
}

/** Shared findings panel: severity filter chips + search + rows. */
export function FindingList({
  findings,
  onSelect,
  emptyMessage,
  search: searchText = "",
  match,
}: FindingListProps) {
  const [filter, setFilter] = useState<FindingFilter>("all");
  const counts = useMemo(() => countBySeverity(findings), [findings]);

  const visible = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return findings.filter((finding) => {
      if (filter !== "all" && finding.severity !== filter) return false;
      if (!query) return true;
      if (match) return match(finding, query);
      const haystack = `${finding.title} ${finding.description} ${finding.location ?? ""} ${finding.evidence ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [findings, filter, searchText, match]);

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter findings by severity">
        {FINDING_FILTERS.map((option) => {
          const count = option.key === "all" ? findings.length : counts[option.key];
          const active = filter === option.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.key)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                active
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {option.label}
              <span className={active ? "text-white/80" : "text-zinc-400"} aria-hidden="true">
                {" "}
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {emptyMessage ?? "No findings match the current filters."}
        </p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-px overflow-y-auto">
          {visible.map((finding, index) => (
            <FindingRow key={`${finding.title}-${index}`} finding={finding} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FindingRow({
  finding,
  onSelect,
}: {
  finding: DebugFinding;
  onSelect?: (finding: DebugFinding) => void;
}) {
  const row = (
    <div
      className={`flex gap-2 rounded-md p-2 text-left ${
        onSelect ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60" : ""
      }`}
    >
      <SeverityBadge severity={finding.severity} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {finding.title}
          {finding.tags && finding.tags.length > 0 && (
            <span className="ml-2 hidden text-[10px] font-normal uppercase tracking-wide text-zinc-400 sm:inline">
              {finding.tags.join(" · ")}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
          {finding.description}
        </p>
        {finding.evidence && (
          <pre className="mt-1 truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {finding.evidence}
          </pre>
        )}
        {finding.recommendation && (
          <p className="mt-1 text-xs italic text-zinc-500 dark:text-zinc-400">
            Recommendation: {finding.recommendation}
          </p>
        )}
      </div>
    </div>
  );

  if (!onSelect) return <li>{row}</li>;
  return (
    <li>
      <button type="button" onClick={() => onSelect(finding)} className="w-full rounded-md">
        {row}
      </button>
    </li>
  );
}