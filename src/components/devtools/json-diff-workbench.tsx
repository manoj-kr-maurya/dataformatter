"use client";

import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import { Button } from "@/components/ui/button";
import { SwapIcon } from "@/components/ui/icons";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  Segmented,
  Stat,
} from "@/components/devtools/shared";
import { diffJson, renderInline } from "@/lib/json-diff/diff";

const EXAMPLE_A = `{
  "name": "DataFormatter",
  "version": 2,
  "tags": ["json", "diff", "seo"],
  "owner": { "id": 7, "active": true },
  "stable": true
}`;

const EXAMPLE_B = `{
  "name": "DataFormatter",
  "version": 3,
  "tags": ["json", "diff"],
  "owner": { "id": 9, "active": false },
  "stable": true,
  "license": "MIT"
}`;

export function JsonDiffWorkbench() {
  const [aText, setAText] = useState(EXAMPLE_A);
  const [bText, setBText] = useState(EXAMPLE_B);
  const [view, setView] = useState<"table" | "unified">("table");

  const result = useMemo(() => diffJson(aText, bText), [aText, bText]);
  const unified = useMemo(() => renderInline(result), [result]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Stat label="added" value={result.added} tone={result.added > 0 ? "ok" : "default"} />
        <Stat label="removed" value={result.removed} tone={result.removed > 0 ? "error" : "default"} />
        <Stat label="changed" value={result.changed} tone={result.changed > 0 ? "warn" : "default"} />
        <div className="ml-auto flex items-center gap-2">
          <Segmented
            ariaLabel="Diff view"
            value={view}
            onChange={setView}
            options={[
              { value: "table", label: "Table" },
              { value: "unified", label: "Unified" },
            ]}
          />
          <CopyButton text={unified} label="Copy diff" />
          <DownloadButton filename="json-diff.txt" text={unified} label="Download" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Toolbox
          title="Original (A)"
          actions={
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" title="Swap A and B" onClick={() => { setAText(bText); setBText(aText); }}>
                <SwapIcon className="h-3.5 w-3.5" />
                Swap
              </Button>
              <ClearButton onClick={() => setAText("")} disabled={aText.length === 0} />
            </div>
          }
        >
          <div className="min-h-[240px]">
            <CodeEditor value={aText} onChange={setAText} language="json" ariaLabel="Original JSON (A)" />
          </div>
        </Toolbox>
        <Toolbox
          title="Changed (B)"
          actions={<ClearButton onClick={() => setBText("")} disabled={bText.length === 0} />}
        >
          <div className="min-h-[240px]">
            <CodeEditor value={bText} onChange={setBText} language="json" ariaLabel="Changed JSON (B)" />
          </div>
        </Toolbox>
      </div>

      <Toolbox title="Differences" actions={<span className="font-mono text-[10px] text-zinc-400">{result.changes.length} diffs</span>}>
        {!result.ok ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {result.error}
          </p>
        ) : result.changes.length === 0 ? (
          <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">
            No differences. The two JSON documents are identical (ignoring whitespace).
          </p>
        ) : view === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="py-1.5 pr-3 font-semibold">Path</th>
                  <th className="py-1.5 pr-3 font-semibold">Change</th>
                  <th className="py-1.5 pr-3 font-semibold">Before</th>
                  <th className="py-1.5 font-semibold">After</th>
                </tr>
              </thead>
              <tbody>
                {result.changes.slice(0, 400).map((change, index) => (
                  <tr
                    key={`${change.path}-${index}`}
                    className="border-b border-zinc-100 align-top dark:border-zinc-800/60"
                  >
                    <td className="py-2 pr-3 font-mono text-xs text-violet-700 dark:text-violet-300">
                      {change.path}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          change.kind === "added"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : change.kind === "removed"
                              ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                        }`}
                      >
                        {change.kind}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-red-600/90 line-through decoration-red-400/50 dark:text-red-400/80">
                      {change.before ?? ""}
                    </td>
                    <td className="py-2 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                      {change.after ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.changes.length > 400 && (
              <p className="px-1 pb-1 pt-2 text-xs text-zinc-400">
                Showing the first 400 of {result.changes.length} changes.
              </p>
            )}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {unified}
          </pre>
        )}
      </Toolbox>
    </div>
  );
}