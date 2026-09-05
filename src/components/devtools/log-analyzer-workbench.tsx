"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CodeEditor } from "@/components/editor/code-editor";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar, type PageHref } from "@/components/app/sidebar";
import { CompressIcon, MenuIcon, ShieldIcon } from "@/components/ui/icons";
import {
  CopyButton,
  DownloadButton,
  ClearButton,
  Stat,
  Segmented,
} from "@/components/devtools/shared";
import { analyzeLogs, type LevelCount } from "@/lib/logs/analyze";

const SAMPLE_LOG = `2026-08-30T08:01:02.123Z INFO  Startup complete in 842ms
2026-08-30T08:02:45.000Z ERROR Rejected order 4815: stock unavailable
2026-08-30T08:02:45.003Z ERROR Rejected order 4815: stock unavailable
2026-08-30T08:03:10.001Z WARN  Slow query 12400ms on orders
2026-08-30T08:04:00.500Z DEBUG cache miss for sku A-1
2026-08-30T08:05:11.222Z ERROR Rejected order 4815: stock unavailable
2026-08-30T09:00:00.000Z INFO  nightly job started`;

const LEVEL_COLORS: Record<string, string> = {
  FATAL: "bg-red-600 text-white",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  WARN: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  INFO: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  DEBUG: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  TRACE: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-400",
};

export function LogAnalyzerWorkbench({ activeHref = "/log-analyzer" }: { activeHref?: PageHref }) {
  const [text, setText] = useState(SAMPLE_LOG);
  const [tab, setTab] = useState<"levels" | "errors" | "timeline">("levels");
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const analysis = useMemo(() => analyzeLogs(text), [text]);

  const levelChips = useMemo(() => {
    const ranks = new Map(analysis.levels.map((row) => [row.level, row.count]));
    const ordered: LevelCount[] = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"]
      .filter((level) => ranks.has(level))
      .map((level) => ({ level, count: ranks.get(level) ?? 0 }));
    if (analysis.unknownLevel > 0) ordered.push({ level: "UNKNOWN", count: analysis.unknownLevel });
    return ordered;
  }, [analysis]);

  const report = useMemo(() => {
    const lines = [
      `Log analysis: ${analysis.total} lines`,
      ...levelChips.map((row) => `${row.level}: ${row.count}`),
      "",
      `Unique error messages: ${analysis.uniqueErrors}`,
      "",
      ...analysis.errorGroups.slice(0, 50).map((group) => `[${group.count}x] ${group.message}`),
    ];
    return lines.join("\n");
  }, [analysis, levelChips]);

  const peakHour = analysis.timeline?.length
    ? analysis.timeline.reduce((peak, bucket) => (bucket.total > peak.total ? bucket : peak), analysis.timeline[0])
    : null;

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="Open tools navigation"
            onClick={() => setNavDrawerOpen(true)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={navExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={navExpanded}
            onClick={() => setNavExpanded((prev) => !prev)}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <CompressIcon className="h-4 w-4" />
          </button>
          <Link
            href="/"
            aria-label="DataFormatter home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            <Logo className="h-7 w-7 rounded-md [&>svg]:h-4 [&>svg]:w-4" />
          </Link>
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Log Analyzer
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 sm:inline-flex dark:bg-emerald-500/10 dark:text-emerald-300">
            <ShieldIcon className="h-3 w-3" />
            Local-only · nothing is uploaded
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        {navExpanded && (
          <Sidebar
            activeHref={activeHref}
            mode="AUTO_DETECT"
            onSelectTool={() => void 0}
            open={navDrawerOpen}
            onClose={() => setNavDrawerOpen(false)}
            standalone
          />
        )}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col gap-3 p-3 lg:flex-row">
            {/* Input panel */}
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 lg:w-1/2">
              <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Logs
                </h2>
                <div className="flex shrink-0 items-center gap-1">
                  <ClearButton onClick={() => setText("")} disabled={text.length === 0} />
                </div>
              </div>
              <div className="min-h-72 flex-1 lg:min-h-0">
                <CodeEditor value={text} onChange={setText} language="text" ariaLabel="Log lines" />
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
                <span className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                  JSON logs, Java/Node prefixes, nginx access logs or plain text — capped at 50,000 lines.
                </span>
              </div>
            </section>

            {/* Controls + analysis column */}
            <div className="flex min-h-0 flex-col gap-3 lg:w-1/2">
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <Stat label="lines" value={analysis.total} />
                <Stat label="errors" value={analysis.levels.find((row) => row.level === "ERROR")?.count ?? 0} tone={analysis.levels.some((row) => row.level === "ERROR" && row.count > 0) ? "error" : "default"} />
                <Stat label="unique errors" value={analysis.uniqueErrors} tone={analysis.uniqueErrors > 0 ? "warn" : "default"} />
                <Stat label="unknown level" value={analysis.unknownLevel} tone={analysis.unknownLevel > 0 ? "warn" : "default"} />
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Segmented
                    ariaLabel="Analysis view"
                    value={tab}
                    onChange={setTab}
                    options={[
                      { value: "levels", label: "Levels" },
                      { value: "errors", label: "Error groups" },
                      { value: "timeline", label: "Timeline" },
                    ]}
                  />
                  <CopyButton text={report} label="Copy report" />
                  <DownloadButton filename="log-analysis.txt" text={report} label="Download" />
                </div>
              </div>

              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                  <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Analysis
                  </h2>
                  <span className="font-mono text-[10px] text-zinc-400">{analysis.total} lines</span>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-3">
                  {analysis.total === 0 ? (
                    <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">Nothing to analyze yet — paste logs above.</p>
                  ) : tab === "levels" ? (
                    analysis.timeline ? (
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {levelChips.map((row) => (
                          <span key={row.level} className="inline-flex items-baseline gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${LEVEL_COLORS[row.level] ?? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}>
                              {row.level}
                            </span>
                            <span className="font-mono text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">{row.count}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="px-1 py-1 text-xs text-zinc-400 dark:text-zinc-500">
                        No timestamps or levels were recognized — paste a sample from a logger that emits level
                        labels like INFO, ERROR or WARN.
                      </p>
                    )
                  ) : tab === "errors" ? (
                    analysis.errorGroups.length === 0 ? (
                      <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">No ERROR-level lines detected.</p>
                    ) : (
                      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/70">
                        {analysis.errorGroups.map((group) => (
                          <li key={group.key} className="flex items-baseline gap-3 py-2">
                            <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300">
                              {group.count}x
                            </span>
                            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-200">{group.message}</span>
                          </li>
                        ))}
                      </ul>
                    )
                  ) : analysis.timeline ? (
                    <TimelineBars buckets={analysis.timeline} peak={peakHour} />
                  ) : (
                    <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">Timestamps were not detectable, so no timeline can be built.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TimelineBars({
  buckets,
  peak,
}: {
  buckets: { hour: number; total: number; error: number; warn: number }[];
  peak: { hour: number; total: number; error: number; warn: number } | null;
}) {
  const max = peak?.total ?? 1;
  return (
    <div className="overflow-x-auto py-1">
      <div className="flex min-w-[520px] items-end gap-1">
        {buckets.map((bucket, index) => {
          const hourLabel = `${String(bucket.hour).padStart(2, "0")}:00`;
          const height = Math.max(4, Math.round((bucket.total / max) * 120));
          return (
            <div key={`${bucket.hour}-${index}`} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end justify-center gap-0.5">
                <div
                  className="w-1/2 rounded-t bg-sky-400/70 dark:bg-sky-500/40"
                  style={{ height }}
                  title={`${hourLabel} UTC · ${bucket.total} lines`}
                />
                {bucket.error > 0 && (
                  <div
                    className="w-1/2 rounded-t bg-red-500/80 dark:bg-red-500/50"
                    style={{ height: Math.max(4, Math.round((bucket.error / max) * 120)) }}
                    title={`${hourLabel} UTC · ${bucket.error} errors`}
                  />
                )}
              </div>
              <span className="font-mono text-[9px] text-zinc-400 dark:text-zinc-500">{hourLabel}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-sky-400/70" /> all lines
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-red-500/80" /> errors
        </span>
        <span className="ml-auto">Hours are UTC.</span>
      </p>
    </div>
  );
}