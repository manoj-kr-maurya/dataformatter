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
import {
  CompressIcon,
  DownloadIcon,
  MenuIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import {
  analyzeErrorWorkspace,
  buildReproductionBundle,
  exportJson,
  exportMarkdown,
  EMPTY_ERROR_WORKSPACE_INPUT,
  type ErrorWorkspaceInput,
} from "@/lib/error-workspace/analyze";
import { ERROR_WORKSPACE_SAMPLE } from "@/lib/error-workspace/sample";
import { copyToClipboard } from "@/lib/clipboard/copy";
import { downloadText } from "@/lib/download";

type TabId = "error" | "logs" | "request" | "response" | "metadata" | "reproduction";

const TABS: { id: TabId; label: string }[] = [
  { id: "error", label: "Stack trace" },
  { id: "logs", label: "Service logs" },
  { id: "request", label: "Request" },
  { id: "response", label: "Response" },
  { id: "metadata", label: "Metadata" },
  { id: "reproduction", label: "Reproduction" },
];

const TAB_PLACEHOLDER: Record<Exclude<TabId, "reproduction">, string> = {
  error: "Paste a stack trace…",
  logs: "Paste service logs (timestamped lines, JSON logs, access logs)…",
  request: "URL, method and headers, e.g.\nPOST https://api.example.com/orders\nContent-Type: application/json",
  response: "Status and body, e.g.\n500 Internal Server Error\n{\"error\":\"…\"}",
  metadata: "deploy=2026-09-02T09:00Z\nenvironment=staging",
};

export function ErrorWorkspaceWorkbench({ activeHref = "/error-workspace" }: { activeHref?: PageHref }) {
  const [input, setInput] = useState<ErrorWorkspaceInput>(EMPTY_ERROR_WORKSPACE_INPUT);
  const [tab, setTab] = useState<TabId>("error");
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const reportRef = useRef<string | null>(null);

  const analysis = useMemo(
    () => analyzeErrorWorkspace(input),
    [input],
  );
  const { session, logAnalysis } = analysis;

  useEffect(() => {
    reportRef.current = exportMarkdown(session);
  }, [session]);

  const patch = (patch: Partial<ErrorWorkspaceInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const hasAnything =
    input.errorText.trim() ||
    input.logsText.trim() ||
    input.requestUrl.trim() ||
    input.requestHeadersText.trim() ||
    input.responseStatus.trim() ||
    input.responseBody.trim() ||
    input.metadataText.trim();

  const bundle = useMemo(
    () => (hasAnything ? buildReproductionBundle(input) : null),
    [input, hasAnything],
  );

  const countOf = (severity: string) => session.findings.filter((f) => f.severity === severity).length;

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
          <h1 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">Production Error Workspace</h1>
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
          <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-zinc-200 px-2 dark:border-zinc-800" role="tablist" aria-label="Workspace slice">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                  tab === item.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInput(ERROR_WORKSPACE_SAMPLE);
                  setTab("error");
                }}
              >
                Load sample
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const text = reportRef.current ?? exportMarkdown(session);
                  void downloadText("error-workspace-report.md", text, "text/markdown");
                }}
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export Markdown
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void copyToClipboard(exportJson(session))}
              >
                Copy JSON
              </Button>
            </div>
          </div>

          <section className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mx-auto flex max-w-5xl flex-col gap-3">
              {tab !== "reproduction" && (
                <div className="grid min-h-[200px] flex-1">
                  <CodeEditor
                    value={editorValue(tab, input)}
                    onChange={(value) => patch(editorPatch(tab, value))}
                    language={tab === "response" || tab === "request" ? "json" : "text"}
                    placeholder={TAB_PLACEHOLDER[tab as Exclude<TabId, "reproduction">]}
                    ariaLabel={TABS.find((t) => t.id === tab)?.label ?? ""}
                  />
                </div>
              )}

              {tab === "reproduction" && (
                <div className="flex flex-col gap-3">
                  {!hasAnything && (
                    <p className="rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                      Paste request evidence first to generate a reproduction command.
                    </p>
                  )}
                  {bundle && (
                    <>
                      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          cURL
                        </h3>
                        <CodeEditor value={bundle.curl} onChange={() => void 0} language="text" readOnly ariaLabel="Reproduction cURL" />
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => void copyToClipboard(bundle.curl)}>Copy cURL</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {bundle.codeSnippets.map((snippet) => (
                          <div key={snippet.id} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              {snippet.label}
                            </h3>
                            <CodeEditor value={snippet.code} onChange={() => void 0} language="text" readOnly ariaLabel={`${snippet.label} snippet`} />
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => void copyToClipboard(snippet.code)}>Copy</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <h2 className="mr-auto text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Correlation report
                </h2>
                {session.metadata.service && (
                  <span className="rounded-md bg-violet-100 px-2 py-1 text-[11px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    service {session.metadata.service as string}
                  </span>
                )}
                {session.traceIds.length > 0 && (
                  <span className="rounded-md bg-sky-100 px-2 py-1 text-[11px] font-mono font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    {session.traceIds.length} trace id(s)
                  </span>
                )}
              </div>

              {!hasAnything && (
                <div className="flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                  <p>
                    Paste the evidence from an incident — the stack trace, service logs, the request that failed, the
                    response, and any deployment context — and this workspace correlates it into a prioritized debugging
                    report with a reproduction command.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => { setInput(ERROR_WORKSPACE_SAMPLE); setTab("error"); }}>
                    Load sample incident
                  </Button>
                </div>
              )}

              {hasAnything && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    <Stat label="Findings" value={session.findings.length} />
                    <Stat label="Critical" value={countOf("critical")} tone={countOf("critical") > 0 ? "error" : "default"} />
                    <Stat label="Errors" value={countOf("error")} tone={countOf("error") > 0 ? "error" : "default"} />
                    <Stat label="Warnings" value={countOf("warning")} tone={countOf("warning") > 0 ? "warn" : "default"} />
                    <Stat label="Stack errors" value={session.errors.length} />
                    <Stat label="Log lines" value={logAnalysis.total} />
                    <Stat label="Requests" value={session.requests.length} />
                    <Stat label="Responses" value={session.responses.length} />
                  </div>

                  {logAnalysis.levels.length > 0 && (
                    <p className="text-[11px] leading-snug text-zinc-400 dark:text-zinc-500" aria-label="Log level counts">
                      {logAnalysis.levels.map((level) => `${level.level}×${level.count}`).join(" · ")}
                    </p>
                  )}

                  <p className="text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">
                    Findings are heuristic observations — trace IDs, networks and deploy metadata are only correlated when
                    the evidence shows them. Use the report for triage order, not as a verdict.
                  </p>

                  {session.findings.length === 0 ? (
                    <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                      No issues found in what you pasted — try adding stack trace, logs or a failing response to unlock more
                      observations.
                    </p>
                  ) : (
                    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                      <FindingList findings={session.findings} emptyMessage="No findings match the current filters." />
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

function editorValue(tab: Exclude<TabId, "reproduction">, input: ErrorWorkspaceInput): string {
  switch (tab) {
    case "error": return input.errorText;
    case "logs": return input.logsText;
    case "request": return (
      [input.requestMethod, input.requestUrl].filter(Boolean).join(" ") +
      (input.requestHeadersText ? `\n${input.requestHeadersText}` : "") +
      (input.requestBody ? `\n\nBody:\n${input.requestBody}` : "")
    ).trim();
    case "response": return (
      [input.responseStatus, input.responseHeadersText.split("\n")].flat().join("\n").trim() +
      (input.responseBody ? `\n\nBody:\n${input.responseBody}` : "")
    ).trim();
    case "metadata": return input.metadataText;
    default: return "";
  }
}

function editorPatch(tab: Exclude<TabId, "reproduction">, value: string): Partial<ErrorWorkspaceInput> {
  switch (tab) {
    case "error": return { errorText: value };
    case "logs": return { logsText: value };
    case "request": {
      const lines = value.split("\n");
      const firstLine = lines[0]?.trim() ?? "";
      const methodMatch = firstLine.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/);
      if (methodMatch && lines.length > 1) {
        return { requestMethod: methodMatch[1], requestUrl: methodMatch[2], requestHeadersText: lines.slice(1).join("\n") };
      }
      if (methodMatch && lines.length === 1) {
        return { requestMethod: methodMatch[1], requestUrl: methodMatch[2], requestHeadersText: "" };
      }
      return { requestHeadersText: value };
    }
    case "response": {
      const bodyIndex = value.indexOf("\n\nBody:\n");
      if (bodyIndex >= 0) {
        return { responseStatus: value.slice(0, bodyIndex), responseBody: value.slice(bodyIndex + 7) };
      }
      return { responseStatus: value };
    }
    case "metadata": return { metadataText: value };
    default: return {};
  }
}