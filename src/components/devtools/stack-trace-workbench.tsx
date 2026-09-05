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
} from "@/components/devtools/shared";
import { parseStackTrace, type StackFrame } from "@/lib/stacktrace/parse";

const SAMPLE_JAVA = `java.lang.NullPointerException: Cannot invoke "String.length()" because "name" is null
	at com.example.OrderService.charge(OrderService.java:42)
	at com.example.OrdersController.create(OrdersController.java:18)
	at java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(...)
	at org.springframework.web.method.support.InvocableHandlerMethod.invoke(...)`;

const SAMPLE_JS = `TypeError: Cannot read properties of undefined (reading 'length')
    at formatUser (webpack:///src/utils.ts:12:9)
    at renderProfile (webpack:///src/Profile.tsx:33:15)
    at renderWithHooks (webpack:///node_modules/react-dom/cjs/react-dom-client.development.js:10987:16)`;

export function StackTraceWorkbench({ activeHref = "/stack-trace" }: { activeHref?: PageHref }) {
  const [text, setText] = useState(SAMPLE_JAVA);
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const parsed = useMemo(() => {
    try {
      return { parse: parseStackTrace(text), error: null };
    } catch (cause) {
      return { parse: null, error: `${cause instanceof Error ? cause.message : cause}` };
    }
  }, [text]);

  const parse = parsed.parse;

  const summary = useMemo(() => {
    if (!parse || parse.frames.length === 0) return "";
    return [
      `Stack trace (${parse.language})`,
      parse.exceptionType ? `Exception: ${parse.exceptionType}${parse.message ? ` — ${parse.message}` : ""}` : "",
      parse.location ? `Where: ${parse.location.file}:${parse.location.line ?? "?"}` : "",
      "",
      "Call chain (clean → deep):",
      ...parse.chain.map((step, index) => `${index + 1}. ${step}`),
    ]
      .filter(Boolean)
      .join("\n");
  }, [parse]);

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
            Stack Trace Reader
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
            <div className="flex min-h-0 flex-col gap-3 lg:flex-1 lg:flex-row">
              {/* Input panel */}
              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 lg:w-1/2">
                <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                  <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Stack trace
                  </h2>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" className="text-[11px] font-medium text-violet-600 hover:underline dark:text-violet-400" onClick={() => setText(SAMPLE_JS)}>
                      Node/JS sample
                    </button>
                    <button type="button" className="text-[11px] font-medium text-violet-600 hover:underline dark:text-violet-400" onClick={() => setText(SAMPLE_JAVA)}>
                      Java sample
                    </button>
                    <ClearButton onClick={() => setText("")} disabled={text.length === 0} />
                  </div>
                </div>
                <div className="min-h-72 flex-1 lg:min-h-0">
                  <textarea
                    className="h-full w-full resize-none rounded-b-lg border-0 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:bg-zinc-900 dark:text-zinc-200"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    aria-label="Stack trace"
                    spellCheck={false}
                  />
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
                  <span className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                    Java, JavaScript/Node, Python or Go — parsing runs locally.
                  </span>
                </div>
              </section>

              {/* Stats + exception + chain column */}
              <div className="flex min-h-0 flex-col gap-3 lg:w-1/2">
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                  <Stat label="language" value={parse ? parse.language : "—"} />
                  <Stat label="frames" value={parse?.frames.length ?? 0} />
                  {parse?.exceptionType && <Stat label="exception" value={parse.exceptionType} tone="error" />}
                  <div className="ml-auto flex items-center gap-2">
                    <CopyButton text={summary} label="Copy summary" />
                    <DownloadButton filename="stack-summary.txt" text={summary} label="Download" />
                  </div>
                </div>

                {parsed.error && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{parsed.error}</p>
                )}

                {parse && parse.frames.length > 0 && (
                  <>
                    <section className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                        <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Exception
                        </h2>
                        {parse.location && (
                          <span className="font-mono text-[10px] text-zinc-400">{parse.location.file}:{parse.location.line ?? "?"}</span>
                        )}
                      </div>
                      <div className="min-h-0 flex-1 p-3">
                        <p className="font-mono text-sm font-semibold text-red-700 dark:text-red-300">
                          {parse.exceptionType ? parse.exceptionType : parse.language}
                        </p>
                        {parse.message && <p className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-300">{parse.message}</p>}
                      </div>
                    </section>

                    <section className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                        <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Call chain
                        </h2>
                        <span className="font-mono text-[10px] text-zinc-400">{parse.chain.length} steps</span>
                      </div>
                      <div className="min-h-0 flex-1 overflow-auto p-3">
                        <ol className="flex flex-col gap-1.5">
                          {parse.chain.map((step, index) => (
                            <li key={`${step}-${index}`} className="flex items-baseline gap-2.5">
                              <span className="w-6 shrink-0 text-right font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{index + 1}</span>
                              <span className="font-mono text-xs text-zinc-700 dark:text-zinc-200">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>

            {parse && parse.frames.length > 0 && (
              <section className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                  <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Frames
                  </h2>
                  <span className="font-mono text-[10px] text-zinc-400">{parse.frames.length} frames</span>
                </div>
                <div className="min-h-0 flex-1 overflow-x-auto p-3">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                          <th className="py-1.5 pr-3 font-semibold">Function</th>
                          <th className="py-1.5 font-semibold">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parse.frames.map((frame: StackFrame, index) => (
                          <tr key={`${frame.file}-${frame.line}-${index}`} className="border-b border-zinc-100 dark:border-zinc-800/60">
                            <td className="py-1.5 pr-3 font-mono text-xs text-violet-700 dark:text-violet-300">{frame.function}</td>
                            <td className="py-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                              {frame.file}
                              {frame.line != null ? <span className="text-zinc-400 dark:text-zinc-500">:{frame.line}</span> : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}