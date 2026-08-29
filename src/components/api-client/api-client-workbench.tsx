"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertIcon,
  CheckIcon,
  ChevronIcon,
  CopyIcon,
  LoaderIcon,
  MenuIcon,
  PanelIcon,
  PlayIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar, pageHrefForTool, type PageHref } from "@/components/app/sidebar";
import { usePersistedState } from "@/hooks/usePersistedState";
import { AUTO_DETECT } from "@/lib/tools";
import type { ToolMode } from "@/types/tools";
import { copyToClipboard } from "@/lib/clipboard/copy";
import { sendRequest } from "@/lib/api-client/send";
import { isForbiddenHeaderName } from "@/lib/api-client/request";
import { parseCurlCommand } from "@/lib/api-client/curl";
import {
  API_CLIENT_SHARE_LIMIT_CHARS,
  createApiClientShareLink,
  restoreApiClientShare,
} from "@/lib/api-client/share";
import {
  HTTP_METHODS,
  type ApiResponseSnapshot,
  type AuthMode,
  type BodyMode,
  exampleDraft,
  type HttpMethod,
  type KeyValueRow,
  newRow,
  type RequestDraft,
} from "@/lib/api-client/types";

/**
 * The API client workbench. One page, all state local; requests leave the
 * browser directly for the target server — there is no proxy backend.
 */

type RequestTab = "params" | "headers" | "body" | "auth";
type ResponseTab = "pretty" | "raw" | "headers";

interface HistoryEntry {
  id: number;
  label: string;
  at: number;
  draft: RequestDraft;
}

interface SavedEntry {
  id: number;
  name: string;
  draft: RequestDraft;
}

const HISTORY_LIMIT = 20;

const METHOD_TONES: Record<HttpMethod, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-violet-600 dark:text-violet-300",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-sky-600 dark:text-sky-400",
  DELETE: "text-red-600 dark:text-red-400",
  HEAD: "text-zinc-500 dark:text-zinc-400",
  OPTIONS: "text-zinc-500 dark:text-zinc-400",
};

const BODY_MODES: { value: BodyMode; label: string }[] = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "text", label: "Text" },
  { value: "urlencoded", label: "URL Encoded" },
  { value: "form-data", label: "Form Data" },
];

const AUTH_MODES: { value: AuthMode; label: string }[] = [
  { value: "none", label: "No Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
];

function statusTone(status: number): string {
  if (status >= 500) return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (status >= 400) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  if (status >= 300) return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeDraft(draft: RequestDraft): string {
  let host = draft.url.trim();
  try {
    const parsed = new URL(host);
    host = `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    host = host.slice(0, 48);
  }
  const label = `${draft.method} ${host}`;
  return label.length > 64 ? `${label.slice(0, 61)}…` : label;
}

export function ApiClientWorkbench({ activeHref = "/api-client" }: { activeHref?: PageHref }) {
  const router = useRouter();
  const [draft, setDraft] = useState<RequestDraft>(exampleDraft());
  const [requestTab, setRequestTab] = useState<RequestTab>("params");
  const [responseTab, setResponseTab] = useState<ResponseTab>("pretty");
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ApiResponseSnapshot | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "warn"; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savedOpen, setSavedOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [navExpanded, setNavExpanded] = usePersistedState<boolean>("devtools-api-nav", true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [history, setHistory] = usePersistedState<HistoryEntry[]>("api-client-history", []);
  const [saved, setSaved] = usePersistedState<SavedEntry[]>("api-client-saved", []);

  const abortRef = useRef<AbortController | null>(null);
  const runStartRef = useRef(0);

  const patch = useCallback((changes: Partial<RequestDraft>) => {
    setDraft((prev) => ({ ...prev, ...changes }));
  }, []);

  /**
   * Postman-style cURL import: pasting a whole `curl …` command into the URL
   * field fills in every tab at once. The command is detected wherever it sits
   * in the field, so paste-over-existing-text still works. Anything that is
   * not cURL falls through to ordinary typing.
   */
  const handleUrlInput = useCallback(
    (rawValue: string) => {
      const startMatch = rawValue.match(/\bcurl(?:\.exe)?(?=\s|$)/i);
      if (startMatch && startMatch.index !== undefined) {
        const candidate = rawValue.slice(startMatch.index).trim();
        try {
          const imported = parseCurlCommand(candidate);
          setDraft((prev) => ({ ...prev, ...imported }));
          setNotice({ tone: "warn", message: "Imported from cURL — review headers and body before sending." });
          return;
        } catch {
          setNotice({ tone: "error", message: "That looks like a cURL command, but no URL could be found in it." });
          return;
        }
      }
      patch({ url: rawValue });
    },
    [patch],
  );

  const patchRows = useCallback(
    (key: "query" | "headers" | "formRows", id: string, changes: Partial<KeyValueRow>) => {
      setDraft((prev) => ({
        ...prev,
        [key]: prev[key].map((row) => (row.id === id ? { ...row, ...changes } : row)),
      }));
    },
    [],
  );

  const addRow = useCallback((key: "query" | "headers" | "formRows") => {
    setDraft((prev) => ({ ...prev, [key]: [...prev[key], newRow()] }));
  }, []);

  const removeRow = useCallback((key: "query" | "headers" | "formRows", id: string) => {
    setDraft((prev) => ({ ...prev, [key]: prev[key].filter((row) => row.id !== id) }));
  }, []);

  const handleSend = useCallback(async () => {
    if (sending) {
      return;
    }
    setNotice(null);
    setSending(true);
    runStartRef.current = performance.now();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await sendRequest(draft, { signal: controller.signal });
      if (result.status === "ok") {
        setResponse(result.response);
        const entry: HistoryEntry = {
          id: Date.now(),
          label: describeDraft(draft),
          at: Date.now(),
          draft,
        };
        setHistory((prev) => [entry, ...prev.filter((e) => e.label !== entry.label)].slice(0, HISTORY_LIMIT));
      } else if (result.kind === "aborted") {
        setNotice({ tone: "warn", message: result.message });
      } else {
        setNotice({ tone: "error", message: result.message });
      }
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  }, [draft, sending, setHistory]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleReset = useCallback(() => {
    setResponse(null);
    setNotice(null);
  }, []);

  const handleShare = useCallback(async () => {
    const link = await createApiClientShareLink(draft);
    if (link.tooLarge) {
      setNotice({
        tone: "error",
        message: `This request is too large for a share link (limit ${API_CLIENT_SHARE_LIMIT_CHARS} characters).`,
      });
      return;
    }
    try {
      window.history.replaceState(null, "", `#${link.url.split("#")[1] ?? ""}`);
    } catch {
      // Ignore — copying still works.
    }
    await copyToClipboard(link.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    if (link.hasSecrets) {
      setNotice({
        tone: "warn",
        message: "Copied — but this link embeds credentials (token, password or key). Anyone who obtains it can read them.",
      });
    }
  }, [draft]);

  const handleSave = useCallback(() => {
    const name = saveName.trim() || describeDraft(draft);
    setSaved((prev) => [{ id: Date.now(), name, draft }, ...prev].slice(0, 50));
    setSaveName("");
    setSaveOpen(false);
    setSavedOpen(true);
  }, [draft, saveName, setSaved]);

  /** Fly-out tool picks navigate to the page hosting that tool. */
  const handleToolSelect = useCallback(
    (tool: ToolMode) => {
      setNavDrawerOpen(false);
      router.push(pageHrefForTool(tool));
    },
    [router],
  );

  // Restore a shared request from the URL fragment.
  useEffect(() => {
    void (async () => {
      const result = await restoreApiClientShare(window.location.href);
      if (result.status === "ok") {
        setDraft(result.payload);
      }
    })();
  }, []);

  // ⌘/Ctrl + Enter sends from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handleSend();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSend]);

  const objectUrl = useMemo(() => {
    if (!response || response.kind !== "image") {
      return null;
    }
    return URL.createObjectURL(response.blob);
  }, [response]);
  useEffect(() => () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }, [objectUrl]);

  const prettyBody = useMemo(() => {
    if (!response) {
      return "";
    }
    if (response.kind === "json") {
      try {
        return JSON.stringify(JSON.parse(response.bodyText), null, 2);
      } catch {
        return response.bodyText;
      }
    }
    return response.bodyText;
  }, [response]);

  const forbiddenHeaders = useMemo(
    () =>
      Array.from(
        new Set(
          draft.headers
            .filter((row) => row.enabled && isForbiddenHeaderName(row.name))
            .map((row) => row.name.trim()),
        ),
      ),
    [draft.headers],
  );

  const paramCount = draft.query.filter((r) => r.enabled && r.name.trim()).length;
  const headerCount = draft.headers.filter((r) => r.enabled && r.name.trim()).length;

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-[13px] text-zinc-800 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500";
  const segButton = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
      active
        ? "bg-violet-600 text-white"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="Open tools navigation"
            onClick={() => setNavDrawerOpen(true)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:text-zinc-100"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={navExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={navExpanded}
            title={navExpanded ? "Collapse sidebar" : "Expand sidebar"}
            onClick={() => setNavExpanded((open) => !open)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:text-zinc-100"
          >
            <PanelIcon className="h-4 w-4" />
          </button>
          <Link
            href="/"
            aria-label="Back to DataFormatter home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            <Logo className="h-7 w-7 rounded-md [&>svg]:h-4 [&>svg]:w-4" />
          </Link>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              API Client{" "}
              <span className="ml-1 align-middle text-[10px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
                beta
              </span>
            </p>
            <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              Build &amp; send HTTP requests entirely in your browser
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        {navExpanded && (
          <Sidebar
            activeHref={activeHref}
            mode={AUTO_DETECT}
            onSelectTool={handleToolSelect}
            open={navDrawerOpen}
            onClose={() => setNavDrawerOpen(false)}
          />
        )}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          {/* Request column */}
          <section className="flex min-h-0 flex-1 flex-col border-b border-zinc-200 dark:border-zinc-800 lg:border-b-0 lg:border-r">
            <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 p-2 dark:border-zinc-800">
              <select
                value={draft.method}
                onChange={(event) => patch({ method: event.target.value as HttpMethod })}
                aria-label="HTTP method"
                className={`h-9 shrink-0 rounded-md border border-zinc-300 bg-white px-1.5 font-mono text-xs font-bold focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 ${METHOD_TONES[draft.method]}`}
              >
                {HTTP_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <input
                value={draft.url}
                onChange={(event) => handleUrlInput(event.target.value)}
                placeholder="https://api.example.com/path — or paste a cURL command"
                aria-label="Request URL"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className={`h-9 min-w-0 flex-1 ${inputClass}`}
              />
              {sending ? (
                <Button variant="danger" size="md" onClick={handleCancel} title="Cancel the in-flight request">
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  Cancel
                </Button>
              ) : (
                <Button variant="primary" size="md" onClick={() => void handleSend()} title="Send request (⌘/Ctrl + Enter)">
                  <PlayIcon className="h-4 w-4" />
                  Send
                </Button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 px-2 dark:border-zinc-800" role="tablist" aria-label="Request sections">
              {(
                [
                  ["params", `Params${paramCount > 0 ? ` (${paramCount})` : ""}`],
                  ["headers", `Headers${headerCount > 0 ? ` (${headerCount})` : ""}`],
                  ["body", "Body"],
                  ["auth", "Auth"],
                ] as [RequestTab, string][]
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={requestTab === tab}
                  onClick={() => setRequestTab(tab)}
                  className={`border-b-2 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    requestTab === tab
                      ? "border-violet-500 text-violet-600 dark:text-violet-300"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-3">
              {requestTab === "params" && (
                <KeyValueTable
                  label="Query parameters"
                  rows={draft.query}
                  inputClass={inputClass}
                  onChange={(id, changes) => patchRows("query", id, changes)}
                  onAdd={() => addRow("query")}
                  onRemove={(id) => removeRow("query", id)}
                />
              )}
              {requestTab === "headers" && (
                <>
                  <KeyValueTable
                    label="Headers"
                    rows={draft.headers}
                    inputClass={inputClass}
                    onChange={(id, changes) => patchRows("headers", id, changes)}
                    onAdd={() => addRow("headers")}
                    onRemove={(id) => removeRow("headers", id)}
                  />
                  {forbiddenHeaders.length > 0 && (
                    <p className="mt-3 border-l-2 border-amber-400 pl-2 text-xs leading-snug text-amber-700 dark:border-amber-500/60 dark:text-amber-300">
                      Browsers silently drop restricted headers ({forbiddenHeaders.join(", ")}) from client-side fetch calls — they cannot be sent without a server-side proxy.
                    </p>
                  )}
                </>
              )}
              {requestTab === "body" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1" role="group" aria-label="Body type">
                    {BODY_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        aria-pressed={draft.bodyMode === mode.value}
                        onClick={() => patch({ bodyMode: mode.value })}
                        className={segButton(draft.bodyMode === mode.value)}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  {(draft.bodyMode === "json" || draft.bodyMode === "text") && (
                    <textarea
                      value={draft.bodyText}
                      onChange={(event) => patch({ bodyText: event.target.value })}
                      onPaste={(event) => {
                        // Pasting JSON auto-formats it; non-JSON pastes natively.
                        if (draft.bodyMode !== "json") {
                          return;
                        }
                        const text = event.clipboardData.getData("text/plain");
                        let formatted: string;
                        try {
                          formatted = `${JSON.stringify(JSON.parse(text), null, 2)}`;
                        } catch {
                          return;
                        }
                        event.preventDefault();
                        const el = event.currentTarget;
                        const start = el.selectionStart ?? draft.bodyText.length;
                        const end = el.selectionEnd ?? start;
                        patch({
                          bodyText: draft.bodyText.slice(0, start) + formatted + draft.bodyText.slice(end),
                        });
                        requestAnimationFrame(() => {
                          el.selectionStart = el.selectionEnd = start + formatted.length;
                        });
                      }}
                      rows={10}
                      placeholder={draft.bodyMode === "json" ? '{\n  "name": "value"\n}' : "Raw request body"}
                      aria-label="Request body"
                      spellCheck={false}
                      className={`${inputClass} block h-64 w-full resize-y`}
                    />
                  )}
                  {(draft.bodyMode === "urlencoded" || draft.bodyMode === "form-data") && (
                    <>
                      <KeyValueTable
                        label="Form fields"
                        rows={draft.formRows}
                        inputClass={inputClass}
                        onChange={(id, changes) => patchRows("formRows", id, changes)}
                        onAdd={() => addRow("formRows")}
                        onRemove={(id) => removeRow("formRows", id)}
                      />
                      <p className="text-xs leading-snug text-zinc-400 dark:text-zinc-500">
                        Text fields only in this version. The Content-Type header is generated automatically — don&apos;t set it manually.
                      </p>
                    </>
                  )}
                </div>
              )}
              {requestTab === "auth" && (
                <div className="max-w-md space-y-3">
                  <div className="flex items-center gap-1" role="group" aria-label="Auth type">
                    {AUTH_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        aria-pressed={draft.authMode === mode.value}
                        onClick={() => patch({ authMode: mode.value })}
                        className={segButton(draft.authMode === mode.value)}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  {draft.authMode === "bearer" && (
                    <input
                      type="password"
                      value={draft.bearerToken}
                      onChange={(event) => patch({ bearerToken: event.target.value })}
                      placeholder="Token"
                      aria-label="Bearer token"
                      autoComplete="off"
                      className={`block w-full ${inputClass}`}
                    />
                  )}
                  {draft.authMode === "basic" && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={draft.basicUsername}
                        onChange={(event) => patch({ basicUsername: event.target.value })}
                        placeholder="Username"
                        aria-label="Basic auth username"
                        autoComplete="off"
                        className={inputClass}
                      />
                      <input
                        type="password"
                        value={draft.basicPassword}
                        onChange={(event) => patch({ basicPassword: event.target.value })}
                        placeholder="Password"
                        aria-label="Basic auth password"
                        autoComplete="off"
                        className={inputClass}
                      />
                    </div>
                  )}
                  {draft.authMode !== "none" && (
                    <p className="text-xs leading-snug text-zinc-400 dark:text-zinc-500">
                      Credentials stay in this browser tab and are sent directly to the target server.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Saved + history */}
            <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 px-3 py-2">
                {saveOpen ? (
                  <>
                    <input
                      value={saveName}
                      onChange={(event) => setSaveName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSave();
                        }
                      }}
                      placeholder="Request name"
                      aria-label="Name for the saved request"
                      autoFocus
                      className={`h-7 flex-1 ${inputClass}`}
                    />
                    <Button size="sm" variant="primary" onClick={handleSave}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSaveOpen(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" onClick={() => setSaveOpen(true)}>
                      Save
                    </Button>
                    <Button size="md" onClick={() => void handleShare()} title="Copy a shareable link containing this request">
                      {copied ? <CheckIcon className="h-4 w-4 text-emerald-500" /> : <ShareIcon className="h-4 w-4" />}
                      {copied ? "Copied!" : "Share"}
                    </Button>
                    <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500">
                      ⌘/Ctrl + ↵ to send
                    </span>
                  </>
                )}
              </div>
              {saved.length > 0 && (
                <Disclosure open={savedOpen} onToggle={() => setSavedOpen((v) => !v)} label={`Saved (${saved.length})`}>
                  {saved.map((entry) => (
                    <div key={entry.id} className="group flex items-center gap-2 px-3 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <button
                        type="button"
                        onClick={() => setDraft(entry.draft)}
                        className="min-w-0 flex-1 truncate text-left text-zinc-700 dark:text-zinc-300"
                        title={describeDraft(entry.draft)}
                      >
                        {entry.name}
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete saved request ${entry.name}`}
                        onClick={() => setSaved((prev) => prev.filter((e) => e.id !== entry.id))}
                        className="invisible text-zinc-400 hover:text-red-500 group-hover:visible"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </Disclosure>
              )}
              {history.length > 0 && (
                <Disclosure open={historyOpen} onToggle={() => setHistoryOpen((v) => !v)} label={`History (${history.length})`}>
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setDraft(entry.draft);
                        setHistoryOpen(false);
                      }}
                      className="block w-full truncate px-3 py-1 text-left font-mono text-[11px] text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      {entry.label}
                    </button>
                  ))}
                </Disclosure>
              )}
            </div>
          </section>

          {/* Response column */}
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex h-9 shrink-0 items-center gap-2 border-y border-zinc-200 px-3 dark:border-zinc-800 lg:border-t-0">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Response</span>
              {sending && (
                <span className="inline-flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-300">
                  <LoaderIcon className="h-3 w-3 animate-spin" /> Waiting…
                </span>
              )}
              {response && !sending && (
                <>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${statusTone(response.status)}`}>
                    {response.status} {response.statusText || (response.ok ? "OK" : "")}
                  </span>
                  <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                    {Math.round(response.durationMs)} ms · {formatBytes(response.bodyBytes)}
                  </span>
                  <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-[11px]" onClick={() => void copyToClipboard(prettyBody)} disabled={response.bodyText.length === 0}>
                    <CopyIcon className="h-3 w-3" />
                    Copy body
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={handleReset}>
                    Clear
                  </Button>
                </>
              )}
            </div>

            {notice && (
              <div
                className={`mx-3 mt-3 whitespace-pre-wrap border-l-2 pl-2 text-sm ${
                  notice.tone === "error"
                    ? "border-red-400 text-red-600 dark:border-red-500/60 dark:text-red-400"
                    : "border-amber-400 text-amber-700 dark:border-amber-500/60 dark:text-amber-300"
                }`}
                role="alert"
              >
                {notice.tone === "error" && <AlertIcon className="mr-1 inline h-4 w-4 align-text-bottom" />}
                {notice.message}
              </div>
            )}

            {response ? (
              <>
                {response.kind !== "image" && (
                  <div className="flex shrink-0 items-center gap-1 px-3 pt-2" role="tablist" aria-label="Response views">
                    {(
                      [
                        ["pretty", "Pretty"],
                        ["raw", "Raw"],
                        ["headers", `Headers (${response.headers.length})`],
                      ] as [ResponseTab, string][]
                    ).map(([tab, label]) => (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={responseTab === tab}
                        onClick={() => setResponseTab(tab)}
                        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          responseTab === tab
                            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    {response.contentType && (
                      <span className="ml-auto truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-500" title={response.contentType}>
                        {response.contentType.split(";")[0]}
                      </span>
                    )}
                  </div>
                )}
                <div className="min-h-0 flex-1 overflow-auto p-3">
                  {response.kind === "image" ? (
                    objectUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={objectUrl} alt="Response image preview" className="max-h-full max-w-full object-contain" />
                    )
                  ) : responseTab === "headers" ? (
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {response.headers.map(([name, value]) => (
                          <tr key={name} className="border-b border-zinc-100 dark:border-zinc-800/60">
                            <td className="py-1 pr-4 align-top font-mono font-medium text-zinc-600 dark:text-zinc-300">{name}</td>
                            <td className="break-all py-1 font-mono text-zinc-500 dark:text-zinc-400">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <pre
                      className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] font-mono text-[13px] leading-relaxed ${
                        responseTab === "raw" ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {responseTab === "raw" ? response.bodyText : prettyBody}
                    </pre>
                  )}
                </div>
              </>
            ) : (
              !notice && (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
                  <GlobeGlyph />
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Send a request to see the response here.
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600">
                    Requests go straight from your browser to the target server — nothing is proxied or uploaded.
                  </p>
                </div>
              )
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function KeyValueTable({
  label,
  rows,
  inputClass,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string;
  rows: KeyValueRow[];
  inputClass: string;
  onChange: (id: string, changes: Partial<KeyValueRow>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="sr-only">{label}</p>
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(event) => onChange(row.id, { enabled: event.target.checked })}
            aria-label={`Enable ${row.name || "unnamed"} row`}
            className="h-3.5 w-3.5 shrink-0 accent-violet-600"
          />
          <input
            value={row.name}
            onChange={(event) => onChange(row.id, { name: event.target.value })}
            placeholder={label === "Headers" ? "Header name" : "Key"}
            aria-label={`${label} key`}
            spellCheck={false}
            autoCapitalize="off"
            className={`h-8 w-36 shrink-0 sm:w-44 ${inputClass}`}
          />
          <input
            value={row.value}
            onChange={(event) => onChange(row.id, { value: event.target.value })}
            placeholder={label === "Headers" ? "Value" : "Value"}
            aria-label={`${label} value`}
            spellCheck={false}
            className={`h-8 min-w-0 flex-1 ${inputClass}`}
          />
          <button
            type="button"
            aria-label={`Delete ${row.name || "unnamed"} row`}
            onClick={() => onRemove(row.id)}
            className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={onAdd}>
        + Add
      </Button>
    </div>
  );
}

function Disclosure({
  open,
  onToggle,
  label,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-zinc-200/70 dark:border-zinc-800/70">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        <ChevronIcon className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
        {label}
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
}

function GlobeGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-1 h-8 w-8 text-zinc-300 dark:text-zinc-700">
      <circle cx="12" cy="12" r="9" />
      <line x1="3" x2="21" y1="12" y2="12" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </svg>
  );
}
