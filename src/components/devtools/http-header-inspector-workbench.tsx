"use client";

import { useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  Stat,
  Hint,
  inputClass,
  Field,
} from "@/components/devtools/shared";
import { parseHeaderBlock, inspectHeaderBlock, type FindingTone } from "@/lib/http-headers/inspect";

const SAMPLE = `HTTP/2 200
content-type: text/html; charset=utf-8
cache-control: public, max-age=0, must-revalidate
strict-transport-security: max-age=63072000
x-frame-options: DENY
x-content-type-options: nosniff
cross-origin-opener-policy: same-origin
set-cookie: session=abc; HttpOnly; Secure; SameSite=Lax
access-control-allow-origin: *
access-control-allow-credentials: true`;

const TONE_STYLES: Record<FindingTone, string> = {
  ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warn: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  info: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  error: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export function HttpHeaderInspectorWorkbench() {
  const [text, setText] = useState(SAMPLE);
  const [filter, setFilter] = useState<string>("");

  const inspection = useMemo(() => inspectHeaderBlock(text), [text]);

  const counts = useMemo(() => {
    const totals: Record<FindingTone, number> = { ok: 0, warn: 0, info: 0, error: 0 };
    for (const finding of inspection.findings) totals[finding.tone] += 1;
    return totals;
  }, [inspection]);

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return inspection.findings;
    return inspection.findings.filter(
      (finding) =>
        finding.name.toLowerCase().includes(needle) ||
        finding.category.toLowerCase().includes(needle) ||
        finding.message.toLowerCase().includes(needle),
    );
  }, [inspection, filter]);

  const summary = parseHeaderBlock(text);
  const exportText = inspection.findings
    .map((finding) => `[${finding.tone.toUpperCase()}] ${finding.category} · ${finding.name}: ${finding.message}`)
    .join("\n");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Stat label="headers" value={summary.length} />
        <Stat label="errors" value={counts.error} tone={counts.error > 0 ? "error" : "default"} />
        <Stat label="warnings" value={counts.warn} tone={counts.warn > 0 ? "warn" : "default"} />
        <Stat label="ok" value={counts.ok} tone="ok" />
        <div className="ml-auto flex items-center gap-2">
          <CopyButton text={exportText} label="Copy report" />
          <DownloadButton filename="header-inspection.txt" text={exportText} label="Download" />
        </div>
      </div>

      <Toolbox title="HTTP headers" actions={<ClearButton onClick={() => setText("")} disabled={text.length === 0} />}>
        <textarea
          className="min-h-[180px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="HTTP headers"
          spellCheck={false}
        />
        <Hint>
          Paste a header block from a request or response. Inspection runs locally — headers never
          leave the browser.
        </Hint>
      </Toolbox>

      <Toolbox
        title="Findings"
        actions={
          <Field label="Filter">
            <input
              className={`${inputClass} w-44`}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="cache, cookie, CORS…"
              aria-label="Filter findings"
            />
          </Field>
        }
      >
        {inspection.findings.length === 0 ? (
          <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">
            No recognized headers found. Paste a raw header block like{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
              content-type: text/html
            </code>
            , one per line.
          </p>
        ) : visible.length === 0 ? (
          <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">No findings match “{filter}”.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {visible.map((finding) => (
              <li key={`${finding.name}-${finding.message}`} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-3">
                <span className="w-44 shrink-0 truncate font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  {finding.name}
                </span>
                <span
                  className={`inline-block w-fit shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_STYLES[finding.tone]}`}
                >
                  {finding.tone}
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {finding.category}
                </span>
                <span className="text-xs text-zinc-600 dark:text-zinc-300">{finding.message}</span>
              </li>
            ))}
          </ul>
        )}
      </Toolbox>

      {inspection.unknown.length > 0 && (
        <p className="px-1 text-xs text-zinc-400 dark:text-zinc-500">
          Unrecognized: {inspection.unknown.slice(0, 8).join(", ")}
          {inspection.unknown.length > 8 && ` +${inspection.unknown.length - 8} more`}
        </p>
      )}
    </div>
  );
}