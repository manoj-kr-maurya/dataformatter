"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar, type PageHref } from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";
import {
  CompressIcon,
  CopyIcon,
  MenuIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import {
  CopyButton,
  DownloadButton,
  ClearButton,
  Segmented,
  Stat,
} from "@/components/devtools/shared";
import { parseCurlOrThrow, generateCurlCode, draftToCurl, CURL_CODE_TARGETS } from "@/lib/curl-codegen/codegen";
import { copyToClipboard } from "@/lib/clipboard/copy";

const SAMPLE = `curl --request POST 'https://api.example.com/orders?dryRun=true' \\
  --header 'Content-Type: application/json' \\
  --header 'Authorization: Bearer abc123' \\
  --data '{"qty": 2, "sku": "A-1"}'`;

export function CurlToCodeWorkbench({ activeHref = "/curl-to-code" }: { activeHref?: PageHref }) {
  const [command, setCommand] = useState(SAMPLE);
  const [target, setTarget] = useState(CURL_CODE_TARGETS[0].id);
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const { draft, error } = useMemo(() => {
    try {
      return { draft: parseCurlOrThrow(command), error: null };
    } catch (cause) {
      return { draft: null, error: `${cause instanceof Error ? cause.message : cause}` };
    }
  }, [command]);

  const generated = useMemo(() => {
    if (!draft || error) return { code: "", curl: "" };
    const targetRef = CURL_CODE_TARGETS.find((t) => t.id === target) ?? CURL_CODE_TARGETS[0];
    try {
      return { code: generateCurlCode(targetRef.id, draft), curl: draftToCurl(draft) };
    } catch (cause) {
      return { code: "", curl: "", error: `${cause instanceof Error ? cause.message : cause}` };
    }
  }, [draft, target, error]);

  const targetRef = CURL_CODE_TARGETS.find((t) => t.id === target) ?? CURL_CODE_TARGETS[0];
  const filename = `request.${targetRef.extension}`;
  const codeText = generated.code || "";
  const curlText = generated.curl || "";

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
            cURL to Code
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
                  cURL command
                </h2>
                <div className="flex shrink-0 items-center gap-1">
                  <ClearButton onClick={() => setCommand("")} disabled={command.length === 0} />
                </div>
              </div>
              <div className="min-h-72 flex-1 lg:min-h-0">
                <textarea
                  className="h-full w-full resize-none rounded-b-lg border-0 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:bg-zinc-900 dark:text-zinc-200"
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  aria-label="cURL command"
                  spellCheck={false}
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
                <span className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                  Paste any cURL command, straight from a terminal or an API doc. Drafts are parsed locally.
                </span>
              </div>
            </section>

            {/* Controls + output column */}
            <div className="flex min-h-0 flex-col gap-3 lg:w-1/2">
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                {draft && !error && (
                  <>
                    <Stat label="method" value={draft.method} />
                    <Stat label="headers" value={draft.headers.length} />
                    <Stat label="query" value={draft.query.length} />
                    <Stat label="body" value={draft.bodyMode === "none" ? "none" : draft.bodyMode} />
                  </>
                )}
                {draft && !error && (
                  <div className="ml-auto flex flex-col items-start gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Target language
                    </span>
                    <Segmented
                      ariaLabel="Target language"
                      value={target}
                      onChange={setTarget}
                      options={CURL_CODE_TARGETS.map((t) => ({ value: t.id, label: t.label }))}
                    />
                  </div>
                )}
              </div>

              {error ? (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>
              ) : (
                <>
                  {draft && (
                    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                        <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Generated {targetRef.label}
                        </h2>
                        <div className="flex shrink-0 items-center gap-1">
                          <CopyButton text={codeText} label="Copy" />
                          <DownloadButton filename={filename} text={codeText} label="Download" />
                        </div>
                      </div>
                      <pre className="min-h-[16rem] max-h-[34rem] flex-1 overflow-auto whitespace-pre rounded-b-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100 dark:bg-zinc-900">
                        {codeText || " "}
                      </pre>
                    </section>
                  )}
                  {draft && (
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                        <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Normalized cURL
                        </h2>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            title="Copy normalized cURL"
                            onClick={() => void copyToClipboard(curlText)}
                          >
                            <CopyIcon className="h-3.5 w-3.5" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      <pre className="min-h-[12rem] max-h-[24rem] overflow-auto whitespace-pre rounded-b-lg bg-zinc-100 p-3 font-mono text-xs leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {curlText || " "}
                      </pre>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}