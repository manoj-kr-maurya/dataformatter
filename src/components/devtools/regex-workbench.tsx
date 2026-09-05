"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar, type PageHref } from "@/components/app/sidebar";
import { CompressIcon, MenuIcon, ShieldIcon } from "@/components/ui/icons";
import { CodeEditor } from "@/components/editor/code-editor";
import {
  CopyButton,
  ClearButton,
  Segmented,
  inputClass,
  Stat,
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

export function RegexWorkbench({ activeHref = "/regex" }: { activeHref?: PageHref }) {
  const [pattern, setPattern] = useState(DEMO_PATTERNS[3].pattern);
  const [flags, setFlags] = useState(DEMO_PATTERNS[3].flags);
  const [text, setText] = useState(SAMPLE_TEXT);
  const [mode, setMode] = useState<RegexTestMode>("text");
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

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
            Regular Expression Tester
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

            <div className="flex min-h-0 flex-col gap-3 lg:flex-1 lg:flex-row">
              <div className="flex min-h-0 flex-col gap-3 lg:w-1/2">
                <section className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                  <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                    <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Pattern
                    </h2>
                    <ClearButton onClick={() => setPattern("")} disabled={pattern.length === 0} />
                  </div>
                  <div className="min-h-0 flex-1 p-3">
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
                    <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                      Uses the browser native RegExp engine, so results match exactly what your JavaScript will do.
                    </p>
                  </div>
                </section>

                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 lg:flex-1">
                  <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                    <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Test text
                    </h2>
                    <ClearButton onClick={() => setText("")} disabled={text.length === 0} />
                  </div>
                  <div className="min-h-72 flex-1 lg:min-h-0">
                    <CodeEditor value={text} onChange={setText} language="text" ariaLabel="Test text" />
                  </div>
                </section>
              </div>

              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 lg:w-1/2">
                <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                  <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Matches
                  </h2>
                  <span className="font-mono text-[10px] text-zinc-400">{result.matchCount} found</span>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-3">
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
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}