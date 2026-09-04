"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar, type PageHref } from "@/components/app/sidebar";
import { CodeEditor } from "@/components/editor/code-editor";
import { Button } from "@/components/ui/button";
import { Segmented, Stat } from "@/components/devtools/shared";
import { FindingList } from "@/components/debug/finding-list";
import {
  AlertIcon,
  BugIcon,
  ClockIcon,
  CompressIcon,
  DownloadIcon,
  GlobeIcon,
  MenuIcon,
  PasteIcon,
  SearchIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { parseJson } from "@/lib/json/validate";
import { parseJwt } from "@/lib/jwt/decode";
import { copyToClipboard } from "@/lib/clipboard/copy";
import { downloadText } from "@/lib/download";
import { formatBytes, formatDuration } from "@/lib/debug/session";
import type { DebugFinding } from "@/lib/debug/types";
import { detectSensitive, maskAuthorizationValue, maskHeaderValues } from "@/lib/debug/sanitize";
import {
  DEFAULT_SLOW_THRESHOLD_MS,
  analyzeHar,
  type HarAnalysis,
} from "@/lib/har/analyze";
import { parseHar, type HarEntryView, type HarParseResult } from "@/lib/har/parse";
import { buildSampleHar } from "@/lib/har/sample";
import { sanitizeHarText } from "@/lib/har/sanitize";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

type ParsedState =
  | null
  | (HarParseResult & { ok: false })
  | { parse: HarParseResult & { ok: true }; analysis: HarAnalysis };

const EMPTY_FINDINGS: DebugFinding[] = [];
const EMPTY_ENTRIES: HarEntryView[] = [];

const STATUS_TONE: Record<string, string> = {
  "2": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "3": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "4": "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "5": "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

const METHOD_TONE: Record<string, string> = {
  get: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  post: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  put: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  patch: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  delete: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  options: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
};

function MethodChip({ method }: { method: string }) {
  return (
    <span
      className={`inline-flex w-12 shrink-0 items-center justify-center rounded px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        METHOD_TONE[method.toLowerCase()] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
      }`}
    >
      {method}
    </span>
  );
}

function StatusBadge({ status }: { status: number }) {
  if (status === 0) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        —
      </span>
    );
  }
  const key = String(status)[0];
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
        STATUS_TONE[key] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {status}
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  title,
}: {
  label: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded border border-zinc-300 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {label}
    </button>
  );
}

export function HarDebuggerWorkbench({ activeHref = "/har" }: { activeHref?: PageHref }) {
  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [slowThreshold, setSlowThreshold] = useState(DEFAULT_SLOW_THRESHOLD_MS);
  const [view, setView] = useState<"findings" | "requests">("findings");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "2" | "3" | "4" | "5">("all");
  const [showFailed, setShowFailed] = useState(false);
  const [showSlow, setShowSlow] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"default" | "duration" | "size" | "status">("default");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedInput(input), 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  const parsed = useMemo<ParsedState>(() => {
    if (!debouncedInput.trim()) return null;
    const result = parseHar(debouncedInput);
    if (!result.ok) return result;
    return { parse: result, analysis: analyzeHar(result.entries, result.summary, { slowThresholdMs: slowThreshold }) };
  }, [debouncedInput, slowThreshold]);

  const entries = useMemo<HarEntryView[]>(
    () => (parsed && "parse" in parsed ? parsed.parse.entries : EMPTY_ENTRIES),
    [parsed],
  );
  const session = useMemo(() => (parsed && "analysis" in parsed ? parsed.analysis.session : null), [parsed]);
  const findings = useMemo(() => (parsed && "analysis" in parsed ? parsed.analysis.findings : EMPTY_FINDINGS), [parsed]);
  const summary = useMemo(() => (parsed && "parse" in parsed ? parsed.parse.summary : null), [parsed]);

  const hasSensitive = useMemo(
    () =>
      entries.some(
        (entry) =>
          entry.request.headers.some(([name]) => name.toLowerCase() === "authorization" || name.toLowerCase() === "cookie") ||
          detectSensitive(entry.request.bodyText ?? "").length > 0 ||
          detectSensitive(entry.response.bodyText ?? "").length > 0,
      ),
    [entries],
  );

  const visibleEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter((entry) => {
      if (statusFilter !== "all" && String(entry.status)[0] !== statusFilter) return false;
      if (showFailed && !(entry.status >= 400 || entry.status === 0)) return false;
      if (showSlow && (entry.time ?? 0) <= slowThreshold) return false;
      if (q && !`${entry.method} ${entry.url} ${entry.status} ${entry.mimeType}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sortKey === "duration") sorted.sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
    else if (sortKey === "size") sorted.sort((a, b) => b.transferSize - a.transferSize);
    else if (sortKey === "status") sorted.sort((a, b) => a.status - b.status);
    return sorted;
  }, [entries, statusFilter, showFailed, showSlow, slowThreshold, query, sortKey]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  const sanitizedHar = useMemo(() => {
    if (!debouncedInput.trim()) return null;
    return sanitizeHarText(debouncedInput);
  }, [debouncedInput]);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("File too large — the limit is 5 MB.");
      return;
    }
    try {
      const text = await file.text();
      setInput(text);
    } catch {
      setUploadError("Could not read that file.");
    }
  }

  async function handlePaste() {
    if (!navigator.clipboard?.readText) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) setInput(text);
    } catch {
      /* permission denied */
    }
  }

  function openEntry(id: string) {
    setSelectedEntryId(id);
    setView("requests");
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
          <h1 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">HAR Debugger</h1>
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
        <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          {/* Input */}
          <section className="flex min-h-0 flex-1 flex-col border-b border-zinc-200 dark:border-zinc-800 lg:max-w-[34%] lg:border-b-0 lg:border-r xl:max-w-[30%]">
            <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800">
              <h2 className="ml-1 mr-auto truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                HAR input
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setInput(buildSampleHar())} title="Load an example HAR">
                Example HAR
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handlePaste()}
                title="Paste from the clipboard"
              >
                <PasteIcon className="h-3.5 w-3.5" />
                Paste
              </Button>
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Upload a .har / .json file">
                <DownloadIcon className="h-3.5 w-3.5" />
                Browse
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".har,.json,application/json"
                className="hidden"
                aria-hidden="true"
                onChange={(event) => {
                  void handleUpload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <CodeEditor
                value={input}
                onChange={setInput}
                language="json"
                placeholder={"Paste HAR JSON here, drop a .har file, or load the example…"}
                ariaLabel="HAR file input"
                wordWrap
              />
            </div>

            <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-1.5 px-2 py-2">
                <StatusChip parsed={parsed} />
                {summary && (
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {summary.totalEntries} entries
                  </span>
                )}
              </div>

              <div className="overflow-auto border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
                {!parsed && (
                  <div className="flex flex-col items-start justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                    <GlobeIcon className="h-5 w-5" />
                    <p>Drop a HAR file, paste HAR JSON, or load the example to analyze browser network activity locally.</p>
                    <p className="text-[11px]">Supported: HAR 1.2 exports from Chrome, Firefox, cURL and most network tools.</p>
                  </div>
                )}
                {parsed && !("parse" in parsed) && (
                  <div className="rounded-md border border-red-300 bg-red-50 p-2 dark:border-red-500/40 dark:bg-red-500/10" role="alert">
                    <p className="flex items-start gap-1.5 text-xs font-medium text-red-700 dark:text-red-300">
                      <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {parsed.message}
                    </p>
                    {parsed.reason === "invalid" && typeof parsed.line === "number" && (
                      <p className="mt-1 pl-5 font-mono text-[11px] text-red-600 dark:text-red-400">
                        Line {parsed.line}
                        {typeof parsed.column === "number" ? `, column ${parsed.column}` : ""}
                      </p>
                    )}
                  </div>
                )}
                {uploadError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>}

                {session && (
                  <div className="flex flex-col gap-2">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <ShieldIcon className="h-3 w-3" /> This HAR is processed locally in your browser. Nothing is uploaded.
                    </p>
                    {hasSensitive && (
                      <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                        <p className="font-medium">This HAR may contain sensitive information — cookies, authorization headers or tokens.</p>
                        <p className="mt-0.5">Do not share the original file publicly.</p>
                        {sanitizedHar && (
                          <button
                            type="button"
                            onClick={() => downloadText("har-sanitized.json", sanitizedHar, "application/json")}
                            className="mt-2 rounded border border-amber-400/60 px-2 py-1 font-medium text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-violet-500 dark:text-amber-300 dark:hover:bg-amber-500/10"
                          >
                            Sanitize HAR & download copy
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Results */}
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-col gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <Segmented
                  value={view}
                  onChange={(next) => {
                    setView(next);
                  }}
                  ariaLabel="HAR analysis view"
                  options={[
                    { value: "findings", label: "Findings" },
                    { value: "requests", label: "Requests" },
                  ]}
                />
                <label className="ml-2 flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Slow threshold
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={slowThreshold}
                    onChange={(event) => setSlowThreshold(Math.max(0, Number(event.target.value) || 0))}
                    className="w-20 rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    aria-label="Slow request threshold in milliseconds"
                  />
                  ms
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <StatusStat label="Requests" value={summary ? String(summary.totalEntries) : "—"} />
                <StatusStat label="Successful" value={summary ? String(summary.successful) : "—"} tone="ok" />
                <StatusStat label="Failed" value={summary ? String(summary.failed) : "—"} tone={summary && summary.failed > 0 ? "error" : "ok"} />
                <StatusStat label="Redirects" value={summary ? String(summary.redirects) : "—"} />
                <StatusStat label="Transferred" value={summary ? formatBytes(summary.totalTransferred) : "—"} />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(["all", "2", "3", "4", "5"] as const).map((group) => (
                  <button
                    key={group}
                    type="button"
                    aria-pressed={statusFilter === group}
                    onClick={() => setStatusFilter(group)}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                      statusFilter === group
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {group === "all" ? "All" : `${group}xx`}
                  </button>
                ))}
                <ToggleChip active={showFailed} onClick={() => setShowFailed((prev) => !prev)} label="Failed" />
                <ToggleChip active={showSlow} onClick={() => setShowSlow((prev) => !prev)} label="Slow" />
                <label className="flex min-w-0 flex-1 items-center gap-1.5 px-1">
                  <SearchIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Filter URLs…"
                    aria-label="Filter requests by URL"
                    className="w-full bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 focus-visible:outline-none dark:text-zinc-200"
                  />
                </label>
                <SortSelect value={sortKey} onChange={setSortKey} />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div className="min-h-0 flex-1 border-b border-zinc-200 dark:border-zinc-800 lg:border-b-0 lg:border-r">
                {view === "findings" ? (
                  <div className="flex h-full min-h-0 flex-col p-2">
                    <FindingList
                      findings={findings}
                      emptyMessage="No findings — the capture looks clean."
                      onSelect={(finding) => {
                        if (finding.relatedIds && finding.relatedIds.length > 0) {
                          openEntry(finding.relatedIds[0]);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <RequestList
                    entries={visibleEntries}
                    selectedId={selectedEntryId}
                    totalEntries={entries.length}
                    slowThresholdMs={slowThreshold}
                    maxDurationMs={parsed && "analysis" in parsed ? parsed.analysis.maxDurationMs : 1}
                    onSelect={openEntry}
                  />
                )}
              </div>

              <div className="min-h-0 w-full border-b border-zinc-200 dark:border-zinc-800 lg:w-[42%] lg:flex-none lg:border-b-0 xl:w-[38%]">
                {selectedEntry ? (
                  <EntryDetail entry={selectedEntry} onClose={() => setSelectedEntryId(null)} />
                ) : (
                  <div className="flex h-full min-h-0 items-center justify-center p-6">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Select a request to inspect its details, timing and bodies.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatusChip({ parsed }: { parsed: ParsedState }) {
  if (parsed === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 font-mono text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        Waiting for input
      </span>
    );
  }
  if (!("parse" in parsed)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 font-mono text-[11px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
        <AlertIcon className="h-3 w-3" />
        {parsed.reason === "not-har" ? "Valid JSON — not a HAR document" : "Invalid HAR"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 font-mono text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
      <BugIcon className="h-3 w-3" />
      HAR {parsed.parse.harVersion || ""} loaded
    </span>
  );
}

function StatusStat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "error" }) {
  return <Stat label={label} value={value} tone={tone} />;
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
        active
          ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: "default" | "duration" | "size" | "status";
  onChange: (value: "default" | "duration" | "size" | "status") => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as typeof value)}
      aria-label="Sort requests"
      className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[11px] text-zinc-600 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
    >
      <option value="default">Order</option>
      <option value="duration">Slowest</option>
      <option value="size">Largest</option>
      <option value="status">Status</option>
    </select>
  );
}

const ROW_HEIGHT = 40;
const LIST_HEIGHT = 600;
const OVERSCAN = 8;

function RequestList({
  entries,
  selectedId,
  totalEntries,
  slowThresholdMs,
  maxDurationMs,
  onSelect,
}: {
  entries: HarEntryView[];
  selectedId: string | null;
  totalEntries: number;
  slowThresholdMs: number;
  maxDurationMs: number;
  onSelect: (id: string) => void;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const total = entries.length;
  const count = Math.ceil(LIST_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const view = entries.slice(start, start + count);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-7 shrink-0 items-center gap-1 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        <span>
          {totalEntries === 0
            ? "No requests"
            : `${totalEntries} request${totalEntries === 1 ? "" : "s"} · showing ${total}`}
        </span>
        {totalEntries > LIST_HEIGHT / ROW_HEIGHT && (
          <span className="hidden sm:inline">· virtualized for performance</span>
        )}
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ height: LIST_HEIGHT }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        role="list"
        aria-label="Requests"
      >
        <div
          className="relative"
          style={{ height: total * ROW_HEIGHT, paddingTop: start * ROW_HEIGHT }}
        >
          {view.map((entry, index) => {
            const rowIndex = start + index;
            return (
              <RequestRow
                key={`${entry.id}-${rowIndex}`}
                entry={entry}
                selected={entry.id === selectedId}
                slowThresholdMs={slowThresholdMs}
                maxDurationMs={maxDurationMs || 1}
                onSelect={() => onSelect(entry.id)}
              />
            );
          })}
          {total === 0 && (
            <p className="p-3 text-xs text-zinc-400 dark:text-zinc-500">
              No requests match the current filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestRow({
  entry,
  selected,
  slowThresholdMs,
  maxDurationMs,
  onSelect,
}: {
  entry: HarEntryView;
  selected: boolean;
  slowThresholdMs: number;
  maxDurationMs: number;
  onSelect: () => void;
}) {
  const duration = entry.time ?? entry.request.durationMs ?? 0;
  const slow = duration > slowThresholdMs;
  const widthPct = Math.max(2, Math.min(100, (duration / maxDurationMs) * 100));
  return (
    <div
      role="listitem"
      style={{ height: ROW_HEIGHT }}
      className="flex w-full items-center gap-2 border-b border-zinc-100 px-2 text-xs transition-colors dark:border-zinc-800/60"
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected}
        className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left focus-visible:outline-2 focus-visible:outline-violet-500 ${
          selected ? "bg-violet-50 dark:bg-violet-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        }`}
      >
        <MethodChip method={entry.method} />
        <StatusBadge status={entry.status} />
        <span className="min-w-0 flex-1 truncate font-mono" title={entry.url}>
          {entry.method} {entry.url}
        </span>
        {slow && (
          <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            slow
          </span>
        )}
        <span className="hidden w-16 shrink-0 text-right font-mono text-[11px] text-zinc-500 sm:block dark:text-zinc-400">
          {formatDuration(duration)}
        </span>
        <span className="hidden w-16 shrink-0 text-right font-mono text-[11px] text-zinc-400 md:block dark:text-zinc-500">
          {formatBytes(entry.transferSize)}
        </span>
      </button>
      <div className="h-2 w-16 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800" aria-hidden="true">
        <div
          className={`h-full rounded ${slow ? "bg-amber-400" : "bg-violet-400"}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

function EntryDetail({ entry, onClose }: { entry: HarEntryView; onClose: () => void }) {
  const [tab, setTab] = useState<"summary" | "request" | "response" | "timing">("summary");
  const summaryHeaders = entry.response.headers;
  const { hasSensitiveHeaders, maskedHeaders } = useMemo(() => {
    const hasSensitiveHeaders = entry.request.headers.some(
      ([name]) => name.toLowerCase() === "authorization" || name.toLowerCase() === "cookie",
    );
    return { hasSensitiveHeaders, maskedHeaders: maskHeaderValues(entry.request.headers) };
  }, [entry.request.headers]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200 p-2 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-2">
          <MethodChip method={entry.method} />
          <StatusBadge status={entry.status} />
        </div>
        <code className="min-w-0 flex-1 truncate text-[11px] text-zinc-600 dark:text-zinc-300" title={entry.url}>
          {entry.request.path}
        </code>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close request details"
          className="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-violet-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          ✕
        </button>
      </div>

      <div className="flex shrink-0 items-center border-b border-zinc-200 p-1.5 dark:border-zinc-800">
        <div className="flex gap-1" role="group" aria-label="Request detail tabs">
          {(["summary", "request", "response", "timing"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={tab === item}
              onClick={() => setTab(item)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                tab === item
                  ? "bg-violet-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === "summary" && <SummaryPane entry={entry} hasSensitiveHeaders={hasSensitiveHeaders} maskedHeaders={maskedHeaders} />}
        {tab === "request" && <RequestPane entry={entry} maskedHeaders={maskedHeaders} />}
        {tab === "response" && <ResponsePane entry={entry} />}
        {tab === "timing" && <TimingPane entry={entry} />}
        {summaryHeaders.length === 0 && (entry.response.bodyText?.length ?? 0) === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">No response headers or body captured for this entry.</p>
        )}
      </div>
    </div>
  );
}

function SummaryPane({
  entry,
  hasSensitiveHeaders,
  maskedHeaders,
}: {
  entry: HarEntryView;
  hasSensitiveHeaders: boolean;
  maskedHeaders: [string, string][];
}) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-zinc-400 dark:text-zinc-500">Request</dt>
        <dd className="truncate font-mono text-zinc-800 dark:text-zinc-200" title={entry.url}>{entry.method} {entry.url}</dd>
        <dt className="text-zinc-400 dark:text-zinc-500">Status</dt>
        <dd className="font-mono text-zinc-800 dark:text-zinc-200">{entry.status} {entry.statusText}</dd>
        <dt className="text-zinc-400 dark:text-zinc-500">Protocol</dt>
        <dd className="font-mono text-zinc-800 dark:text-zinc-200">{entry.protocol || "—"}</dd>
        <dt className="text-zinc-400 dark:text-zinc-500">Content type</dt>
        <dd className="truncate font-mono text-zinc-800 dark:text-zinc-200">{entry.mimeType || "—"}</dd>
        <dt className="text-zinc-400 dark:text-zinc-500">Transferred</dt>
        <dd className="font-mono text-zinc-800 dark:text-zinc-200">{formatBytes(entry.transferSize)}</dd>
        <dt className="text-zinc-400 dark:text-zinc-500">Started</dt>
        <dd className="font-mono text-zinc-800 dark:text-zinc-200">{entry.startedAtMs !== undefined ? new Date(entry.startedAtMs).toISOString() : "—"}</dd>
      </dl>

      {hasSensitiveHeaders && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          <p className="font-medium">This request carries credential headers.</p>
          <p className="mt-0.5">Values are masked in the Request tab. Reveal carefully — do not share this HAR publicly.</p>
        </div>
      )}
      {maskedHeaders.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Security-relevant headers</p>
          <table className="w-full table-fixed text-left text-[11px]">
            <tbody>
              {maskedHeaders
                .filter(([name]) => ["authorization", "cookie", "proxy-authorization"].includes(name.toLowerCase()))
                .map(([name, value]) => (
                  <tr key={name}>
                    <th className="w-1/3 py-0.5 text-left font-medium text-zinc-500">{name}</th>
                    <td className="truncate py-0.5 font-mono" title={value}>{value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RequestPane({
  entry,
  maskedHeaders,
}: {
  entry: HarEntryView;
  maskedHeaders: [string, string][];
}) {
  const auth = entry.request.headers.find(([name]) => name.toLowerCase() === "authorization");
  const jwt = auth ? parseJwt(auth[1]) : { ok: false as const, error: "" };
  return (
    <div className="flex flex-col gap-3">
      <HeaderTable headers={maskedHeaders} title="Request headers" />
      {entry.request.query.length > 0 && (
        <KeyValueTable title="Query parameters" rows={entry.request.query} />
      )}
      {entry.request.cookies.length > 0 && (
        <KeyValueTable title="Cookies" rows={entry.request.cookies} />
      )}
      {auth && (
        <AuthBlock headerValue={auth[1]} jwtOk={jwt.ok} />
      )}
      {entry.request.bodyText && (
        <BodyInspector
          title="Request body"
          body={entry.request.bodyText}
          mediaType={entry.request.bodyMediaType}
          filename={`${entry.method}-${basename(entry.path)}-request.json`}
        />
      )}
    </div>
  );
}

function ResponsePane({ entry }: { entry: HarEntryView }) {
  return (
    <div className="flex flex-col gap-3">
      {entry.response.redirectUrl && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Redirects to: <code className="break-all font-mono">{entry.response.redirectUrl}</code>
        </p>
      )}
      <HeaderTable headers={entry.response.headers} title="Response headers" />
      {entry.response.bodyText ? (
        <BodyInspector
          title="Response body"
          body={entry.response.bodyText}
          mediaType={entry.response.bodyMediaType}
          filename={`${entry.method}-${basename(entry.path)}-response.json`}
        />
      ) : (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          No response body was captured for this entry.
        </p>
      )}
    </div>
  );
}

function basename(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return (parts[parts.length - 1] ?? "request").replace(/[^\w.-]+/g, "_");
}

function AuthBlock({ headerValue, jwtOk }: { headerValue: string; jwtOk: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const jwt = useMemo(() => parseJwt(headerValue), [headerValue]);
  const parsed = useMemo(() => (jwt.ok ? jwt.value : null), [jwt]);

  return (
    <div className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Authorization</p>
        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
          {revealed ? headerValue : maskAuthorizationValue(headerValue)}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((prev) => !prev)}
          className="rounded border border-zinc-300 px-1.5 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {revealed ? "Hide" : "Reveal"}
        </button>
        {jwtOk && (
          <button
            type="button"
            onClick={() => setInspecting((prev) => !prev)}
            className="rounded border border-violet-300 px-1.5 py-0.5 text-[11px] font-medium text-violet-700 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-violet-500/40 dark:text-violet-300 dark:hover:bg-violet-500/10"
          >
            Inspect JWT
          </button>
        )}
      </div>
      {inspecting && parsed && (
        <div className="mt-2 flex flex-col gap-2">
          <JwtBlock label="Header" value={parsed.header} />
          <JwtBlock label="Payload" value={parsed.payload} />
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Decoded locally on this page. {parsed.payload.exp !== undefined ? `exp: ${new Date(Number(parsed.payload.exp) * 1000).toISOString()}` : "No exp claim."} Signature is not verified.
          </p>
        </div>
      )}
    </div>
  );
}

function JwtBlock({ label, value }: { label: string; value: Record<string, unknown> }) {
  const text = useMemo(() => JSON.stringify(value, null, 2), [value]);
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
      <div className="flex h-7 items-center justify-between border-b border-zinc-200 bg-zinc-100 px-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <ActionButton label="Copy" onClick={() => void copyToClipboard(text)} />
      </div>
      <pre className="max-h-40 overflow-auto p-2 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">{text}</pre>
    </div>
  );
}

function BodyInspector({
  title,
  body,
  mediaType,
  filename,
}: {
  title: string;
  body: string;
  mediaType?: string;
  filename: string;
}) {
  const parsed = useMemo(() => (body ? parseJson(body) : null), [body]);
  const [pretty, setPretty] = useState(true);
  const [validateMessage, setValidateMessage] = useState<string | null>(null);
  const display = useMemo(() => {
    if (!body) return "";
    if (pretty && parsed?.ok) return JSON.stringify(parsed.value, null, 2);
    return body;
  }, [body, pretty, parsed]);

  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 bg-zinc-100 px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="mr-auto truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {title}
          {mediaType ? <span className="ml-2 normal-case text-zinc-400">{mediaType}</span> : null}
        </span>
        {validateMessage && (
          <span
            className={`text-[11px] ${validateMessage.startsWith("Valid") ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            role="status"
          >
            {validateMessage}
          </span>
        )}
        {parsed?.ok && (
          <ActionButton
            label={pretty ? "Raw" : "Format"}
            onClick={() => setPretty((prev) => !prev)}
            title="Toggle formatted/raw JSON"
          />
        )}
        <ActionButton
          label="Validate"
          onClick={() => {
            const result = parseJson(body);
            setValidateMessage(result.ok ? "Valid JSON" : result.error.message);
          }}
          title="Validate as JSON"
        />
        <ActionButton label="Copy" onClick={() => void copyToClipboard(display)} title="Copy body" />
        <ActionButton
          label="Download"
          onClick={() => downloadText(filename, display, mediaType && mediaType.includes("json") ? "application/json" : "text/plain;charset=utf-8")}
          title="Download body"
        />
      </div>
      <CodeEditor value={display} onChange={() => void 0} readOnly language={parsed?.ok ? "json" : "text"} ariaLabel={title} />
    </div>
  );
}

function HeaderTable({ headers, title }: { headers: [string, string][]; title: string }) {
  if (headers.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
      <table className="w-full table-fixed text-left text-[11px]">
        <tbody>
          {headers.map(([name, value]) => (
            <tr key={name} className="align-top">
              <th className="w-2/5 py-0.5 pr-2 font-medium text-zinc-500 dark:text-zinc-400">{name}</th>
              <td className="break-words py-0.5 font-mono text-zinc-800 dark:text-zinc-200" title={value}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeyValueTable({ rows, title }: { rows: [string, string][]; title: string }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
      <table className="w-full table-fixed text-left text-[11px]">
        <tbody>
          {rows.map(([name, value]) => (
            <tr key={name} className="align-top">
              <th className="w-2/5 py-0.5 pr-2 font-medium text-zinc-500 dark:text-zinc-400">{name}</th>
              <td className="break-words py-0.5 font-mono text-zinc-800 dark:text-zinc-200" title={value}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimingPane({ entry }: { entry: HarEntryView }) {
  const timings = entry.timings;
  const present = Object.entries(timings).filter(([, value]) => value !== undefined && value > 0) as [
    keyof typeof timings,
    number,
  ][];
  const total = present.reduce((acc, [, value]) => acc + value, 0);
  const labelOf: Record<string, string> = {
    blocked: "Blocked",
    dns: "DNS",
    connect: "Connect",
    ssl: "SSL",
    send: "Send",
    wait: "Wait",
    receive: "Receive",
  };

  if (present.length === 0) {
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        No timing information was captured for this request. Timing data is optional in HAR exports.
      </p>
    );
  }

  const max = Math.max(...present.map(([, value]) => value), 1);
  const sorted = [...present].sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-left text-[11px]">
        <tbody>
          {present.map(([key, value]) => (
            <tr key={key}>
              <th className="w-32 py-1 font-medium text-zinc-500 dark:text-zinc-400">{labelOf[key] ?? key}</th>
              <td className="w-24 py-1 font-mono text-zinc-800 dark:text-zinc-200">{formatDuration(value)}</td>
              <td className="py-1">
                <div className="h-2 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded ${key === sorted[0]?.[0] ? "bg-amber-400" : "bg-violet-400"}`}
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-800">
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
          <ClockIcon className="h-3.5 w-3.5" />
          Total {formatDuration(total)}{" "}
          <span className="hidden sm:inline">
            · greatest phase: <span className="text-amber-500">{labelOf[sorted[0]?.[0]] ?? sorted[0]?.[0]}</span>
          </span>
        </span>
      </div>
      {entry.time !== undefined && Math.abs(entry.time - total) > 5 && (
        <p className="text-[11px] italic text-zinc-400 dark:text-zinc-500">
          HAR reports a total of {formatDuration(entry.time)} for this entry, slightly different from the visible timing phases.
        </p>
      )}
    </div>
  );
}