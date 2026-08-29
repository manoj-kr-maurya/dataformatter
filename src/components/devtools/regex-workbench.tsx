"use client";

import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import {
  Toolbox,
  CopyButton,
  ClearButton,
  Segmented,
  inputClass,
  Stat,
  Hint,
} from "@/components/devtools/shared";
import { testRegex, normalizeFlags, type RegexTestMode } from "@/lib/regex/engine";

const SAMPLE_TEXT = `GET /api/orders/4815 HTTP/1.1
Host: api.example.com
User-Agent: dataformatter-bot/1.0
Date: Sun, 30 Aug 2026 09:12:33 GMT`;

const DEMO_PATTERNS = [
  { label: "Email", pattern: `[\\w.+-]+@[\\w-]+\\.[\\w.]+`, flags: "g" },
  { label: "UUID", pattern: `\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b`, flags: "gi" },
  { label: "ISO date", pattern: `\\d{4}-\\d{2}-\\d{2}`, flags: "g" },
  { label: "HTTP status", pattern: `HTTP/\\d\\.\\d (\\d{3})`, flags: "g" },
  { label: "Quoted string", pattern: `"([^"]*)"`, flags: "g" },
];

const VALID_FLAGS = "dgimsuvy";

export function RegexWorkbench() {
  const [pattern, setPattern] = useState(DEMO_PATTERNS[3].pattern);
  const [flags, setFlags] = useState(DEMO_PATTERNS[3].flags);
  const [text, setText] = useState(SAMPLE_TEXT);
  const [mode, setMode] = useState<RegexTestMode>("text");

  const result = useMemo(() => testRegex(pattern, flags, text, mode), [pattern, flags, text, mode]);

  const report = useMemo(() => {
    if (!result.valid) return result.message;
    const lines = [
      `Pattern /${pattern}/${normalizeFlags(flags)} — ${result.matchCount} match(es)`,
      "",
      ...result.matches.map((match, index) => {
        const groups = match.groups.length > 0 ? ` groups=[${match.groups.map((g) => g.replace(/\s+/g, " ")).join(", ")}]` : "";
        return `${index + 1}. @${match.index} ${JSON.stringify(match.value)}${groups}`;
      }),
    ];
    return lines.join("\n");
  }, [result, pattern, flags]);

  function applyFlag(flag: string): void {
    setFlags((current) => {
      const has = current.includes(flag);
      return has ? current.replace(flag, "") : normalizeFlags(current + flag);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {result.valid ? (
          <Stat label="valid" value="yes" tone="ok" />
        ) : (
          <Stat label="invalid" value="pattern" tone="error" />
        )}
        <Stat label="matches" value={result.matchCount} tone={result.matchCount > 0 ? "ok" : "default"} />
        <Stat label="global" value={result.global ? "yes" : "no"} />
        <div className="ml-auto flex items-center gap-2">
          <Segmented
            ariaLabel="Match mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "text", label: "Whole text" },
              { value: "lines", label: "Per line" },
            ]}
          />
          <CopyButton text={report} label="Copy matches" />
        </div>
      </div>

      <Toolbox title="Pattern" actions={<ClearButton onClick={() => setPattern("")} disabled={pattern.length === 0} />}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1.5 font-mono text-[13px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">/</span>
          <input
            className={`${inputClass} min-w-0 flex-1`}
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder="[a-z]+@[a-z]+\.[a-z]+"
            aria-label="Regular expression pattern"
            spellCheck={false}
          />
          <span className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1.5 font-mono text-[13px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">/</span>
          <div role="group" aria-label="Pattern flags" className="flex items-center gap-1">
            {VALID_FLAGS.split("").map((flag) => (
              <button
                key={flag}
                type="button"
                aria-pressed={flags.includes(flag)}
                onClick={() => applyFlag(flag)}
                className={`h-7 w-7 rounded-md font-mono text-xs font-semibold transition-colors ${
                  flags.includes(flag)
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                    : "border border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
                title={`Toggle ${flag} flag`}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {DEMO_PATTERNS.map((demo) => (
            <button
              key={demo.label}
              type="button"
              className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-300"
              onClick={() => { setPattern(demo.pattern); setFlags(demo.flags); }}
            >
              {demo.label}
            </button>
          ))}
        </div>
        <Hint>Uses the browser native RegExp engine, so results match exactly what your JavaScript will do.</Hint>
      </Toolbox>

      <Toolbox title="Test text" actions={<ClearButton onClick={() => setText("")} disabled={text.length === 0} />}>
        <div className="min-h-[140px]">
          <CodeEditor value={text} onChange={setText} language="text" ariaLabel="Test text" />
        </div>
      </Toolbox>

      <Toolbox title="Matches" actions={<span className="font-mono text-[10px] text-zinc-400">{result.matchCount} found</span>}>
        {!result.valid ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{result.message}</p>
        ) : result.matches.length === 0 ? (
          <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">No matches in the current text{mode === "lines" ? " on any line" : ""}.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {result.matches.slice(0, 200).map((match, index) => {
              const before = text.slice(Math.max(0, match.index - 24), match.index);
              const after = text.slice(match.index + match.value.length, match.index + match.value.length + 24);
              return (
                <li key={`${match.index}-${index}`} className="flex flex-col gap-0.5 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="shrink-0 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{index + 1}</span>
                    <span className="shrink-0 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">@{match.index}</span>
                    <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                      {match.value}
                    </code>
                  </div>
                  {(match.groups.length > 0 || Object.keys(match.named).length > 0) && (
                    <p className="pl-8 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {match.groups.length > 0 && <span>groups: {match.groups.slice(0, 6).map((group) => JSON.stringify(group)).join(", ")}</span>}
                      {Object.keys(match.named).length > 0 && (
                        <span>
                          {" "}
                          named: {Object.entries(match.named).slice(0, 6).map(([name, value]) => `${name}=${JSON.stringify(value)}`).join(", ")}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="pl-8 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                    …{before}
                    <span className="bg-emerald-200/70 text-emerald-900 dark:bg-emerald-400/30 dark:text-emerald-100">{match.value}</span>
                    {after}…
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Toolbox>
    </div>
  );
}