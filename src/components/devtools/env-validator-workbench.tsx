"use client";

import { useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  Stat,
  Segmented,
  Hint,
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

export function EnvValidatorWorkbench() {
  const [view, setView] = useState<"validate" | "diff">("validate");
  const [aText, setAText] = useState(SAMPLE_A);
  const [bText, setBText] = useState(SAMPLE_B);

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Toolbox title="File A" actions={<ClearButton onClick={() => setAText("")} disabled={aText.length === 0} />}>
          <textarea
            className="min-h-[220px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            value={aText}
            onChange={(event) => setAText(event.target.value)}
            aria-label="ENV file A"
            spellCheck={false}
            placeholder="# NODE_ENV=development"
          />
        </Toolbox>
        {view === "diff" ? (
          <Toolbox title="File B" actions={<ClearButton onClick={() => setBText("")} disabled={bText.length === 0} />}>
            <textarea
              className="min-h-[220px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              value={bText}
              onChange={(event) => setBText(event.target.value)}
              aria-label="ENV file B"
              spellCheck={false}
              placeholder="# NODE_ENV=production"
            />
          </Toolbox>
        ) : (
          <Toolbox title="Findings" actions={<span className="font-mono text-[10px] text-zinc-400">{issues.length} issues</span>}>
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
          </Toolbox>
        )}
      </div>

      {view === "diff" && (
        <Toolbox title="Differences" actions={<span className="font-mono text-[10px] text-zinc-400">distinct keys: {keyCount}</span>}>
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
        </Toolbox>
      )}

      {view === "validate" && issueKinds && (
        <div className="flex flex-wrap items-center gap-2">
          <Stat label="issues" value={issues.length} tone={issues.length > 0 ? "warn" : "ok"} />
          {Array.from(issueKinds.entries()).map(([kind, count]) => (
            <Stat key={kind} label={kind.replace(/-/g, " ")} value={count} tone={kind.includes("invalid") || kind.includes("duplicate") ? "error" : "warn"} />
          ))}
        </div>
      )}

      <Hint>{`Values are only ever compared, never logged. Keep secrets in these files — they stay in your browser.`}</Hint>
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