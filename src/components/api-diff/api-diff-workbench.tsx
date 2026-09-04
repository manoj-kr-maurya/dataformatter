"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar, type PageHref } from "@/components/app/sidebar";
import { CodeEditor } from "@/components/editor/code-editor";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/devtools/shared";
import { FindingList } from "@/components/debug/finding-list";
import { AlertIcon, CompressIcon, MenuIcon, ShieldIcon } from "@/components/ui/icons";
import { compareApis } from "@/lib/api-diff/compare";
import { buildApiDiffSample } from "@/lib/api-diff/sample";

export function ApiDiffWorkbench({ activeHref = "/api-diff" }: { activeHref?: PageHref }) {
  const [previous, setPrevious] = useState("");
  const [current, setCurrent] = useState("");
  const [analysis, setAnalysis] = useState<ReturnType<typeof compareApis> | null>(null);
  const [analyzedFor, setAnalyzedFor] = useState<{ previous: string; current: string } | null>(null);
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const sample = useMemo(() => buildApiDiffSample(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!previous.trim() && !current.trim()) {
        setAnalysis(null);
        setAnalyzedFor(null);
        return;
      }
      const result = compareApis(previous, current);
      setAnalysis(result);
      setAnalyzedFor({ previous, current });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [previous, current]);

  const outdated =
    analyzedFor !== null &&
    (analyzedFor.previous !== previous || analyzedFor.current !== current);

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
          <h1 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">API Breaking Change Detector</h1>
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
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={editorRef} className="grid min-h-0 flex-1 grid-cols-1 border-b border-zinc-200 dark:border-zinc-800 md:grid-cols-2">
            <EditorPane
              title="Previous API"
              value={previous}
              onChange={setPrevious}
              onSample={() => setPrevious(sample.previous)}
              sampleLabel="Sample previous"
            />
            <EditorPane
              title="Current API"
              value={current}
              onChange={setCurrent}
              onSample={() => setCurrent(sample.current)}
              sampleLabel="Sample current"
            />
          </div>

          <section className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mx-auto flex max-w-5xl flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="mr-auto text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Compatibility report
                </h2>
                {analysis?.ok && analysis.isSchemaComparison && (
                  <span className="rounded-md bg-violet-100 px-2 py-1 text-[11px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    Schema comparison detected
                  </span>
                )}
                {outdated && (
                  <span className="flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" role="status">
                    <AlertIcon className="h-3 w-3" /> Editing — analysis is updating
                  </span>
                )}
              </div>

              {!analysis && (
                <div className="flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                  <p>
                    Paste the previous and current API versions on the left and right, or load the sample, to see a
                    compatibility report. Both plain JSON payloads and JSON-Schema-style documents are supported.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setPrevious(sample.previous); setCurrent(sample.current); }}>
                      Load sample pair
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard?.readText().then((text) => {
                          if (text.trim() && !previous) setPrevious(text);
                          else if (text.trim()) setCurrent(text);
                        }).catch(() => void 0);
                      }}
                    >
                      Paste into empty pane
                    </Button>
                  </div>
                </div>
              )}

              {analysis && !analysis.ok && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300" role="alert">
                  {analysis.error}
                </div>
              )}

              {analysis?.ok && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    <Stat label="Breaking" value={analysis.summary.breaking} tone={analysis.summary.breaking > 0 ? "error" : "ok"} />
                    <Stat label="Potentially breaking" value={analysis.summary.potentiallyBreaking} tone={analysis.summary.potentiallyBreaking > 0 ? "warn" : "default"} />
                    <Stat label="Non-breaking" value={analysis.summary.nonBreaking} />
                    <Stat label="Informational" value={analysis.summary.informational} />
                    <Stat label="Changes" value={analysis.changes.length} />
                  </div>

                  <p className="text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">
                    Classifications are heuristic observations based on the documents — required/optional assumptions come
                    through the JSON Schema keywords when present. Treat each flagged change as a candidate to verify, not a
                    guarantee.
                  </p>

                  {analysis.changes.length === 0 ? (
                    <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                      No differences detected — the two API versions are identical.
                    </p>
                  ) : (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                      <FindingList findings={analysis.session.findings} emptyMessage="No changes match the current filters." />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function EditorPane({
  title,
  value,
  onChange,
  onSample,
  sampleLabel,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSample: () => void;
  sampleLabel: string;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col border-b border-zinc-200 dark:border-zinc-800 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-zinc-200 px-2 dark:border-zinc-800">
        <h2 className="mr-auto truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {title}
        </h2>
        <Button variant="ghost" size="sm" onClick={onSample}>
          {sampleLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigator.clipboard?.readText().then((text) => text.trim() && onChange(text)).catch(() => void 0)}
        >
          Paste
        </Button>
      </div>
      <CodeEditor
        value={value}
        onChange={onChange}
        language="json"
        ariaLabel={`${title} JSON`}
        placeholder={title === "Previous API" ? 'Paste the previous API version {"type":"object",…}' : 'Paste the current API version {"type":"object",…}'}
      />
    </section>
  );
}