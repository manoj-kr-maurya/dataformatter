"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { parseEnv, validateEnv, diffEnv, type EnvIssue } from "@/lib/env/validate";

const SAMPLE_A = `NODE_ENV=development
PORT=3000
API_KEY=sk-local-123
DATABASE_URL=postgres://localhost/app
LOG_LEVEL=info`;

const SAMPLE_B = `NODE_ENV=production
PORT=4000
API_KEY=
LOG_LEVEL=info
FEATURE_FLAGS = true`;

const ISSUE_TONES: Record<string, string> = {
  "invalid-name": "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  "empty-value": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "duplicate-key": "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  "leading-space": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "trailing-space": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "spaces-around-equals": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "unquoted-line": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export function EnvValidatorWorkbench({ activeHref = "/env-validator" }: { activeHref?: PageHref }) {
  const [view, setView] = useState<"validate" | "diff">("validate");
  const [aText, setAText] = useState(SAMPLE_A);
  const [bText, setBText] = useState(SAMPLE_B);
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const issues = useMemo(() => validateEnv(aText), [aText]);
  const difference = useMemo(() => diffEnv(aText, bText), [aText, bText]);
  const keyCount = useMemo(() => {
    const keys = new Set<string>();
    for (const text of [aText, bText]) for (const entry of parseEnv(text)) keys.add(entry.key);
    return keys.size;
  }, [aText, bText]);

  const issueKinds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const issue of issues) counts.set(issue.kind, (counts.get(issue.kind) ?? 0) + 1);
    return issues.length === 0 ? null : counts;
  }, [issues]);

  const report = useMemo(() => {
    const lines = [`ENV validation: ${issues.length} issue(s)`];
    if (difference) {
      if (difference.missing.length) lines.push(`\nIn B (example), missing from A:\n${difference.missing.map((row) => `  ${row.key}`).join("\n")}`);
      if (difference.extra.length) lines.push(`\nIn A only (not in B):\n${difference.extra.map((key) => `  ${key}`).join("\n")}`);
      if (difference.changed.length) lines.push(`\nValues changed:\n${difference.changed.map((row) => `  ${row.key}`).join("\n")}`);
    }
    lines.push(`\nDistinct keys across both files: ${keyCount}`);
    return lines.join("\n");
  }, [issues, difference, keyCount]);

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
            ENV Validator
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
          <div className="flex min-h-full flex-col gap-3 p-3">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
              <Segmented
                ariaLabel="ENV tool mode"
                value={view}
                onChange={setView}
                options={[
                  { value: "validate", label: "Validate" },
                  { value: "diff", label: "Compare A vs B" },
                ]}
              />
              <div className="ml-auto flex items-center gap-2">
                <CopyButton text={report} label="Copy report" />
                <DownloadButton filename="env-report.txt" text={report} label="Download" />
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-3 lg:flex-1 lg:flex-row">
              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 lg:flex-1">
                <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                  <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    File A
                  </h2>
                  <ClearButton onClick={() => setAText("")} disabled={aText.length === 0} />
                </div>
                <div className="min-h-72 flex-1 lg:min-h-0">
                  <textarea
                    className="h-full w-full resize-none rounded-b-lg border-0 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:bg-zinc-900 dark:text-zinc-200"
                    value={aText}
                    onChange={(event) => setAText(event.target.value)}
                    aria-label="ENV file A"
                    spellCheck={false}
                    placeholder="# NODE_ENV=development"
                  />
                </div>
              </section>

              {view === "diff" ? (
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 lg:flex-1">
                  <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                    <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      File B
                    </h2>
                    <ClearButton onClick={() => setBText("")} disabled={bText.length === 0} />
                  </div>
                  <div className="min-h-72 flex-1 lg:min-h-0">
                    <textarea
                      className="h-full w-full resize-none rounded-b-lg border-0 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:bg-zinc-900 dark:text-zinc-200"
                      value={bText}
                      onChange={(event) => setBText(event.target.value)}
                      aria-label="ENV file B"
                      spellCheck={false}
                      placeholder="# NODE_ENV=production"
                    />
                  </div>
                </section>
              ) : (
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 lg:flex-1">
                  <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                    <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Findings
                    </h2>
                    <span className="font-mono text-[10px] text-zinc-400">{issues.length} issues</span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto p-3">
                    {issues.length === 0 ? (
                      <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                        No problems detected — every line is well-formed with a unique key.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {issues.map((issue: EnvIssue, index) => (
                          <li
                            key={`${issue.line}-${issue.kind}-${index}`}
                            className="flex items-baseline gap-2.5 rounded-md border border-zinc-100 px-2.5 py-1.5 text-xs dark:border-zinc-800"
                          >
                            <span className="shrink-0 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                              L{issue.line}
                            </span>
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ISSUE_TONES[issue.kind] ?? "bg-zinc-100 text-zinc-600"}`}>
                              {issue.kind.replace(/-/g, " ")}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-300">{issue.message}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              )}
            </div>

            {view === "validate" && issueKinds && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <Stat label="issues" value={issues.length} tone={issues.length > 0 ? "warn" : "ok"} />
                {Array.from(issueKinds.entries()).map(([kind, count]) => (
                  <Stat key={kind} label={kind.replace(/-/g, " ")} value={count} tone={kind.includes("invalid") || kind.includes("duplicate") ? "error" : "warn"} />
                ))}
              </div>
            )}

            {view === "diff" && (
              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                  <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Differences
                  </h2>
                  <span className="font-mono text-[10px] text-zinc-400">distinct keys: {keyCount}</span>
                </div>
                <div className="min-h-0 flex-1 p-3">
                  {difference.missing.length === 0 && difference.extra.length === 0 && difference.changed.length === 0 ? (
                    <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">The two files define the same keys with identical values.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <DiffColumn title="In B, missing from A" items={difference.missing.map((row) => row.key)} tone="text-red-600 dark:text-red-400" />
                      <DiffColumn title="In A only" items={difference.extra} tone="text-emerald-600 dark:text-emerald-400" />
                      <DiffColumn
                        title="Value changed"
                        items={difference.changed.map((row) => `${row.key} (${truncate(row.a)} → ${truncate(row.b)})`)}
                        tone="text-amber-600 dark:text-amber-400"
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-200 px-1 py-2 text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
              Values are only ever compared, never logged. Keep secrets in these files — they stay in your browser.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function truncate(value: string, max = 18): string {
  const v = value.length > max ? `${value.slice(0, max)}…` : value;
  try {
    return v.includes("\n") ? v.split("\n")[0] : v;
  } catch {
    return v;
  }
}

function DiffColumn({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">none</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((key) => (
            <li key={key} className={`font-mono text-xs ${tone}`}>{key}</li>
          ))}
        </ul>
      )}
    </div>
  );
}