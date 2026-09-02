"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar, type PageHref } from "@/components/app/sidebar";
import { CodeEditor } from "@/components/editor/code-editor";
import { Button } from "@/components/ui/button";
import {
  ClearButton,
  CopyButton,
  DownloadButton,
  Segmented,
} from "@/components/devtools/shared";
import {
  AlertIcon,
  DownloadIcon,
  MenuIcon,
  PanelIcon,
  PasteIcon,
  SearchIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { SAMPLE_OPENAPI } from "@/components/openapi/sample-spec";
import { parseOpenApi, detectOpenApiVersion, looksLikeJson } from "@/lib/openapi/parse";
import { validateOpenApi } from "@/lib/openapi/validate";
import {
  RESPONSE_LANGUAGES,
  TYPESCRIPT_GENERATORS,
  endpointToCode,
  endpointToCurl,
  endpointToRequestDraft,
  exampleRequestBody,
  exampleResponses,
  requestSchemaNode,
  responseSchemaNode,
} from "@/lib/openapi/codegen";
import { securityFor, requiresSecurity } from "@/lib/openapi/security";
import type {
  OpenApiDocumentModel,
  OpenApiEndpoint,
  OpenApiHttpMethod,
  OpenApiParameter,
} from "@/lib/openapi/types";
import { generateCode } from "@/lib/json-schema/codegen";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

type ParseUi =
  | { status: "idle" }
  | { status: "error"; message: string; line?: number; column?: number }
  | {
      status: "ready";
      model: OpenApiDocumentModel;
      format: "json" | "yaml";
      issues: { level: "error" | "warning"; location: string; message: string }[];
      errorCount: number;
    };

const METHOD_COLORS: Record<string, string> = {
  get: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  post: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  put: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  patch: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  delete: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

function MethodBadge({ method }: { method: OpenApiHttpMethod }) {
  return (
    <span
      className={`inline-flex w-14 shrink-0 items-center justify-center rounded px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        METHOD_COLORS[method] ?? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
      }`}
    >
      {method}
    </span>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const tone =
    status === "ready"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : status === "error"
        ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] ${tone}`}>
      {label}
    </span>
  );
}

function CodeBlock({
  title,
  text,
  filename,
  emptyMessage = "Nothing to generate yet.",
}: {
  title: string;
  text: string;
  filename: string;
  emptyMessage?: string;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
      <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-100 px-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <CopyButton text={text} label="Copy" />
          <DownloadButton filename={filename} text={text} label="" />
        </div>
      </div>
      {text ? (
        <pre className="max-h-72 min-h-24 overflow-auto whitespace-pre-wrap break-words bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {text}
        </pre>
      ) : (
        <p className="p-3 text-xs text-zinc-400 dark:text-zinc-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function pascalize(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9_$]/g, " ").split(/\s+/).filter(Boolean);
  const joined = cleaned.map((word) => word[0].toUpperCase() + word.slice(1)).join("");
  return joined.length > 0 ? joined[0].toUpperCase() + joined.slice(1) : "Type";
}

export function OpenApiWorkbench({ activeHref = "/openapi" }: { activeHref?: PageHref }) {
  const [input, setInput] = useState(SAMPLE_OPENAPI);
  const [debouncedInput, setDebouncedInput] = useState(SAMPLE_OPENAPI);
  const [explorerTab, setExplorerTab] = useState<"endpoints" | "schemas">("endpoints");
  const [endpointSearch, setEndpointSearch] = useState("");
  const [schemaSearch, setSchemaSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detailTab, setDetailTab] = useState<"overview" | "code" | "mock" | "security">("overview");
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [serverIndex, setServerIndex] = useState(0);
  const [pathVals, setPathVals] = useState<Record<string, string>>({});
  const [queryVals, setQueryVals] = useState<Record<string, string>>({});
  const [headerVals, setHeaderVals] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState("");
  const [mockStatus, setMockStatus] = useState("");
  const [codeTarget, setCodeTarget] = useState<string>("cURL");
  const [typesTarget, setTypesTarget] = useState<string>("typescript-interface");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [navExpanded, setNavExpanded] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedInput(input), 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  const parseUi = useMemo<ParseUi>(() => {
    const trimmed = debouncedInput.trim();
    if (!trimmed) return { status: "idle" };
    const result = parseOpenApi(trimmed);
    if (!result.ok) {
      return {
        status: "error",
        message: result.error.message,
        line: result.error.line,
        column: result.error.column,
      };
    }
    const issues = validateOpenApi(result.model);
    const errorCount = issues.filter((i) => i.level === "error").length;
    return { status: "ready", model: result.model, format: result.format, issues, errorCount };
  }, [debouncedInput]);

  const model = parseUi.status === "ready" ? parseUi.model : null;
  const endpoints = model?.paths ?? [];
  const safeIndex = model ? Math.min(selectedIndex, Math.max(endpoints.length - 1, 0)) : -1;
  const selected: OpenApiEndpoint | null = safeIndex >= 0 ? endpoints[safeIndex] : null;

  const lastEndpointKey = useRef<string | null>(null);
  useEffect(() => {
    if (!model || !selected) return;
    const key = `${selected.method} ${selected.path}`;
    if (key === lastEndpointKey.current) return;
    lastEndpointKey.current = key;
    setPathVals({});
    setQueryVals({});
    setHeaderVals({});
    setBodyText(exampleRequestBody(selected.requestBody, model));
    const firstResponse = exampleResponses(selected, model)[0];
    setMockStatus(firstResponse?.status ?? "");
    setServerIndex(0);
    setDetailTab("overview");
  }, [model, selected]);

  const detect = useMemo(() => {
    const trimmed = debouncedInput.trim();
    if (!trimmed) return { label: "Empty", tone: "idle" as const };
    const kind = detectOpenApiVersion(trimmed);
    if (kind.kind === "3.0" || kind.kind === "3.1") {
      return { label: `OpenAPI ${kind.version}`, tone: "ready" as const };
    }
    if (kind.kind === "swagger2") {
      return { label: "Swagger 2.0 (not supported)", tone: "error" as const };
    }
    return { label: "No OpenAPI detected", tone: "idle" as const };
  }, [debouncedInput]);

  const effectiveServers = useMemo(() => {
    if (!model) return [];
    if (selected?._servers && selected._servers.length > 0) return selected._servers;
    return model.servers;
  }, [model, selected]);

  const activeServerIndex = Math.min(serverIndex, Math.max(effectiveServers.length - 1, 0));
  const activeServer = effectiveServers[activeServerIndex]?.url ?? "/";

  const filteredEndpoints = useMemo(() => {
    if (!model) return [];
    const q = endpointSearch.trim().toLowerCase();
    if (!q) return model.paths;
    return model.paths.filter(
      (ep) =>
        ep.path.toLowerCase().includes(q) ||
        (ep.summary ?? "").toLowerCase().includes(q) ||
        ((ep.operationId ?? "").toLowerCase().includes(q)),
    );
  }, [model, endpointSearch]);

  const endpointGroups = useMemo(() => {
    const groups = new Map<string, OpenApiEndpoint[]>();
    for (const ep of filteredEndpoints) {
      const tags = ep.tags.length > 0 ? ep.tags : ["(untagged)"];
      for (const tag of tags) {
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag)!.push(ep);
      }
    }
    return groups;
  }, [filteredEndpoints]);

  const schemaNames = useMemo(() => {
    if (!model) return [];
    const q = schemaSearch.trim().toLowerCase();
    const names = Object.keys(model.components.schemas);
    if (!q) return names;
    return names.filter((n) => n.toLowerCase().includes(q));
  }, [model, schemaSearch]);

  const draft = useMemo(() => {
    if (!model || !selected) return null;
    return endpointToRequestDraft({
      server: activeServer,
      endpoint: selected,
      model,
      bodyText,
      headerParams: headerVals,
      pathParams: pathVals,
      queryParams: queryVals,
    });
  }, [model, selected, activeServer, bodyText, headerVals, pathVals, queryVals]);

  const requestCode = useMemo(() => {
    if (!model || !selected) return "";
    try {
      if (codeTarget === "cURL") return endpointToCurl({ server: activeServer, endpoint: selected, model, bodyText, headerParams: headerVals, pathParams: pathVals, queryParams: queryVals });
      return endpointToCode({ server: activeServer, endpoint: selected, model, bodyText, headerParams: headerVals, pathParams: pathVals, queryParams: queryVals }, codeTarget as "fetch" | "axios" | "python" | "java" | "go" | "csharp");
    } catch {
      return "";
    }
  }, [model, selected, activeServer, bodyText, headerVals, pathVals, queryVals, codeTarget]);

  const requestCodeExt = (() => {
    switch (codeTarget) {
      case "fetch": return "mjs";
      case "axios": return "ts";
      case "python": return "py";
      case "java": return "java";
      case "go": return "go";
      case "csharp": return "cs";
      default: return "sh";
    }
  })();

  const typesCode = useMemo(() => {
    if (!model || !selected) return "";
    const node = requestSchemaNode(selected, model) ?? responseSchemaNode(selected, model);
    if (!node) return "";
    const typeName = `${pascalize(selected.operationId ?? "Endpoint")}${requestSchemaNode(selected, model) ? "Request" : "Response"}`;
    try {
      return generateCode(typesTarget, node, typeName);
    } catch {
      return "";
    }
  }, [model, selected, typesTarget]);

  const mockResponses = useMemo(() => {
    if (!model || !selected) return [];
    return exampleResponses(selected, model);
  }, [model, selected]);

  const activeMock = mockResponses.find((r) => r.status === mockStatus) ?? mockResponses[0];

  const securityItems = useMemo(() => {
    if (!model || !selected) return [];
    return securityFor(selected, model);
  }, [model, selected]);

  const needsAuth = selected && model ? requiresSecurity(selected, model) : false;

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
      /* permission denied — ignore, the textarea still works */
    }
  }

  const setParam = (section: "path" | "query" | "header", name: string, value: string) => {
    const key = `${section}:${name}`;
    if (section === "path") setPathVals((prev) => ({ ...prev, [key]: value }));
    if (section === "query") setQueryVals((prev) => ({ ...prev, [key]: value }));
    if (section === "header") setHeaderVals((prev) => ({ ...prev, [key]: value }));
  };
  const onPathValue = (name: string, value: string) => setParam("path", name, value);
  const onQueryValue = (name: string, value: string) => setParam("query", name, value);
  const onHeaderValue = (name: string, value: string) => setParam("header", name, value);

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
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
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">OpenAPI Workbench</p>
            <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              View, validate &amp; generate code from OpenAPI documents — in your browser
            </p>
          </div>
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
          />
        )}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          {/* Specification input */}
          <section className="flex min-h-0 flex-1 flex-col border-b border-zinc-200 dark:border-zinc-800 lg:max-w-[42%] lg:border-b-0 lg:border-r xl:max-w-[38%]">
            <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800">
              <h2 className="ml-1 mr-auto truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Specification
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_OPENAPI)} title="Load the example document">
                Example
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
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Upload a .json / .yaml file">
                <DownloadIcon className="h-3.5 w-3.5" />
                Upload
              </Button>
              <ClearButton onClick={() => setInput("")} disabled={input.length === 0} className="!px-2" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml"
                className="hidden"
                aria-hidden="true"
                onChange={(event) => {
                  void handleUpload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <CodeEditor
                value={input}
                onChange={setInput}
                language={looksLikeJson(input) ? "json" : "text"}
                placeholder="Paste an OpenAPI 3.0/3.1 JSON or YAML document here…"
                ariaLabel="OpenAPI specification input"
                wordWrap
              />
              <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-zinc-200 px-2 py-2 dark:border-zinc-800">
                {detect.tone === "error" ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-[11px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
                    <AlertIcon className="h-3 w-3" />
                    {detect.label}
                  </span>
                ) : (
                  <StatusPill status={detect.tone} label={detect.label} />
                )}
                {parseUi.status === "ready" && (
                  <>
                    <StatusPill status="ready" label={parseUi.format.toUpperCase()} />
                    {parseUi.issues.length > 0 ? (
                      <StatusPill status="error" label={`${parseUi.errorCount} errors · ${parseUi.issues.length - parseUi.errorCount} warnings`} />
                    ) : (
                      <StatusPill status="ready" label="No issues" />
                    )}
                  </>
                )}
                {parseUi.status === "idle" && (
                  <StatusPill status="idle" label="Waiting for input" />
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-auto border-t border-zinc-200 p-2 dark:border-zinc-800">
                {parseUi.status === "idle" && (
                  <p className="p-2 text-xs text-zinc-400 dark:text-zinc-500">
                    Paste an OpenAPI 3.0/3.1 document, upload a spec file, or load the example to get started.
                  </p>
                )}
                {parseUi.status === "error" && (
                  <div className="rounded-md border border-red-300 bg-red-50 p-2 dark:border-red-500/40 dark:bg-red-500/10" role="alert">
                    <p className="flex items-start gap-1.5 text-xs font-medium text-red-700 dark:text-red-300">
                      <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {parseUi.message}
                    </p>
                    {typeof parseUi.line === "number" && (
                      <p className="mt-1 pl-5 font-mono text-[11px] text-red-600 dark:text-red-400">
                        at line {parseUi.line}
                        {typeof parseUi.column === "number" ? `, column ${parseUi.column}` : ""}
                      </p>
                    )}
                  </div>
                )}
                {parseUi.status === "ready" && (
                  <ul className="flex flex-col gap-1">
                    {parseUi.issues.length === 0 && (
                      <p className="p-1 text-xs text-emerald-600 dark:text-emerald-400">
                        The document passes basic structural validation.
                      </p>
                    )}
                    {parseUi.issues
                      .sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1))
                      .slice(0, 60)
                      .map((issue, index) => (
                        <li
                          key={index}
                          className={`rounded-md border px-2 py-1.5 text-[11px] leading-snug ${
                            issue.level === "error"
                              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                          }`}
                        >
                          <span className="font-mono font-semibold">{issue.location}</span>
                          <span className="ml-1.5">{issue.message}</span>
                        </li>
                      ))}
                  </ul>
                )}
                {uploadError && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>
                )}
              </div>
            </div>
          </section>

          {/* Explorer */}
          <section className="flex min-h-0 flex-col border-b border-zinc-200 dark:border-zinc-800 lg:h-auto lg:w-[30%] lg:flex-none lg:border-b-0 lg:border-r">
            <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 p-2 dark:border-zinc-800">
              <Segmented
                value={explorerTab}
                onChange={setExplorerTab}
                ariaLabel="Explorer"
                options={[
                  { value: "endpoints", label: "Endpoints" },
                  { value: "schemas", label: "Schemas" },
                ]}
              />
            </div>
            <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
              <SearchIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <input
                value={explorerTab === "endpoints" ? endpointSearch : schemaSearch}
                onChange={(event) =>
                  explorerTab === "endpoints" ? setEndpointSearch(event.target.value) : setSchemaSearch(event.target.value)
                }
                placeholder={explorerTab === "endpoints" ? "Filter endpoints…" : "Filter schemas…"}
                aria-label={explorerTab === "endpoints" ? "Filter endpoints" : "Filter schemas"}
                className="w-full bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 focus-visible:outline-none dark:text-zinc-200"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              {explorerTab === "endpoints" && (
                <>
                  {endpointGroups.size === 0 && (
                    <p className="p-3 text-xs text-zinc-400 dark:text-zinc-500">
                      No endpoints{model ? "" : " yet — load a specification first"}.
                    </p>
                  )}
                  {Array.from(endpointGroups.entries()).map(([tag, group]) => (
                    <div key={tag}>
                      <p className="sticky top-0 z-10 bg-zinc-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:bg-zinc-950 dark:text-zinc-500">
                        {tag}
                      </p>
                      {group.map((ep) => {
                        const index = model?.paths.indexOf(ep) ?? -1;
                        const active = index === safeIndex;
                        return (
                          <button
                            key={`${ep.method} ${ep.path}`}
                            type="button"
                            onClick={() => setSelectedIndex(index)}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                              active
                                ? "bg-violet-50 dark:bg-violet-500/10"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <MethodBadge method={ep.method} />
                            <span className="min-w-0">
                              <span className="block truncate font-mono text-xs text-zinc-800 dark:text-zinc-200">
                                {ep.path}
                              </span>
                              {(ep.summary ?? ep.operationId) && (
                                <span className="block truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                                  {ep.summary ?? ep.operationId}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}

              {explorerTab === "schemas" && (
                <>
                  {schemaNames.length === 0 && (
                    <p className="p-3 text-xs text-zinc-400 dark:text-zinc-500">
                      {model ? "No component schemas defined." : "No schemas yet — load a specification first."}
                    </p>
                  )}
                  {schemaNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedSchema(name)}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                        selectedSchema === name
                          ? "bg-violet-50 dark:bg-violet-500/10"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <span className="truncate font-mono text-zinc-800 dark:text-zinc-200">{name}</span>
                      <span className="ml-2 shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {schemaFields(name) ?? ""}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </section>

          {/* Details */}
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            {!model || !selected ? (
              <div className="flex flex-1 items-center justify-center p-6 text-center">
                <div className="max-w-sm">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {model ? "No endpoint selected." : "No specification loaded yet."}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
                    Load a document on the left, then pick an endpoint to explore parameters, generate request code
                    and types, preview mock responses and review its security requirements.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 p-2 dark:border-zinc-800">
                  <h2 className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <MethodBadge method={selected.method} />
                      <span className="truncate font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {selected.path}
                      </span>
                    </span>
                    {(selected.summary ?? selected.operationId) && (
                      <span className="mt-0.5 block truncate pl-16 text-xs text-zinc-400 dark:text-zinc-500">
                        {selected.summary ?? selected.operationId}
                      </span>
                    )}
                  </h2>
                  {effectiveServers.length > 1 && (
                    <select
                      value={activeServerIndex}
                      onChange={(event) => setServerIndex(Number(event.target.value))}
                      aria-label="Server"
                      className="h-7 shrink-0 rounded-md border border-zinc-300 bg-white px-1.5 font-mono text-[11px] text-zinc-700 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      {effectiveServers.map((server, index) => (
                        <option key={server.url + index} value={index}>
                          {server.description ?? server.url}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 px-2 pt-1.5 dark:border-zinc-800">
                  <Segmented
                    value={detailTab}
                    onChange={setDetailTab}
                    ariaLabel="Endpoint details"
                    options={[
                      { value: "overview", label: "Overview" },
                      { value: "code", label: "Code" },
                      { value: "mock", label: "Mock response" },
                      { value: "security", label: "Security" },
                    ]}
                  />
                  <span className="ml-auto self-stretch" />
                </div>

                <div className="min-h-0 flex-1 overflow-auto p-3">
                  {detailTab === "overview" && (
                    <OverviewPane
                      endpoint={selected}
                      pathVals={pathVals}
                      queryVals={queryVals}
                      headerVals={headerVals}
                      bodyText={bodyText}
                      activeServer={activeServer}
                      draftUrl={draft?.url ?? ""}
                      onPathValue={onPathValue}
                      onQueryValue={onQueryValue}
                      onHeaderValue={onHeaderValue}
                      onBodyChange={setBodyText}
                      onMock={(status) => {
                        setMockStatus(status);
                        setDetailTab("mock");
                      }}
                    />
                  )}
                  {detailTab === "code" && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Request snippet
                          </span>
                        </div>
                        <Segmented
                          value={codeTarget}
                          onChange={setCodeTarget}
                          ariaLabel="Request snippet language"
                          options={RESPONSE_LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
                        />
                        <div className="mt-2">
                          <CodeBlock
                            title={`${selected.method.toUpperCase()} ${selected.path}`}
                            text={requestCode}
                            filename={`request.${requestCodeExt}`}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Types from schema
                          </span>
                        </div>
                        <Segmented
                          value={typesTarget}
                          onChange={setTypesTarget}
                          ariaLabel="Type generator"
                          options={TYPESCRIPT_GENERATORS.map((g) => ({ value: g.id, label: g.label }))}
                        />
                        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                          Derived from the {requestSchemaNode(selected, model) ? "request body" : "success response"} schema.
                        </p>
                        <div className="mt-2">
                          <CodeBlock
                            title={typesTarget.replace(/-/g, " ")}
                            text={typesCode}
                            filename={`types.${typesTarget.startsWith("typescript") ? "ts" : "txt"}`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {detailTab === "mock" && (
                    <MockPane
                      mockResponses={mockResponses}
                      mockStatus={activeMock?.status ?? ""}
                      onMockStatus={setMockStatus}
                    />
                  )}
                  {detailTab === "security" && <SecurityPane items={securityItems} needsAuth={needsAuth} />}
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );

  function schemaFields(name: string): number | null {
    if (!model) return null;
    const schema = model.components.schemas[name];
    if (!schema) return null;
    return schema.properties ? Object.keys(schema.properties).length : 0;
  }
}

function ParamRow({
  param,
  value,
  onValue,
  editable,
  placeholder,
}: {
  param: OpenApiParameter;
  value: string;
  onValue: (name: string, value: string) => void;
  editable: boolean;
  placeholder: string;
}) {
  const locClasses: Record<string, string> = {
    path: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    query: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    header: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    cookie: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
  };
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`inline-flex w-14 shrink-0 items-center justify-center rounded px-1 py-0.5 text-[10px] font-semibold uppercase ${locClasses[param.in]} `}>
        {param.in}
      </span>
      <span className="w-28 min-w-0 shrink-0 truncate font-mono text-xs text-zinc-800 dark:text-zinc-200">
        {param.name}
        {param.required && <span className="text-red-500" title="Required"> *</span>}
      </span>
      {editable ? (
        <input
          value={value}
          onChange={(event) => onValue(param.name, event.target.value)}
          placeholder={placeholder}
          aria-label={`${param.in} parameter ${param.name}`}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-xs text-zinc-800 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {value || "—"}
        </span>
      )}
    </div>
  );
}

function OverviewPane({
  endpoint,
  pathVals,
  queryVals,
  headerVals,
  bodyText,
  activeServer,
  draftUrl,
  onPathValue,
  onQueryValue,
  onHeaderValue,
  onBodyChange,
  onMock,
}: {
  endpoint: OpenApiEndpoint;
  pathVals: Record<string, string>;
  queryVals: Record<string, string>;
  headerVals: Record<string, string>;
  bodyText: string;
  activeServer: string;
  draftUrl: string;
  onPathValue: (name: string, value: string) => void;
  onQueryValue: (name: string, value: string) => void;
  onHeaderValue: (name: string, value: string) => void;
  onBodyChange: (value: string) => void;
  onMock: (status: string) => void;
}) {
  const body = endpoint.requestBody;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {endpoint.description ?? "No description provided for this operation."}
        </p>
        <p className="mt-2 break-all font-mono text-[11px] text-zinc-400 dark:text-zinc-500">{activeServer}</p>
        <p className="mt-1 break-all font-mono text-xs text-zinc-700 dark:text-zinc-200">{draftUrl}</p>
      </div>

      {endpoint.parameters.length > 0 && (
        <section>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Parameters ({endpoint.parameters.length})
          </h3>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            {endpoint.parameters.map((param) => {
              const map =
                param.in === "path" ? pathVals : param.in === "query" ? queryVals : headerVals;
              const onValue =
                param.in === "path" ? onPathValue : param.in === "query" ? onQueryValue : onHeaderValue;
              return (
                <ParamRow
                  key={`${param.in}:${param.name}`}
                  param={param}
                  value={map[`${param.in}:${param.name}`] ?? ""}
                  onValue={onValue}
                  editable
                  placeholder={String(param.example ?? param.schema?.example ?? "")}
                />
              );
            })}
          </div>
        </section>
      )}

      {body && (
        <section>
          <h3 className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Request body
            {body.required && <span className="text-red-500">required</span>}
          </h3>
          <textarea
            value={bodyText}
            onChange={(event) => onBodyChange(event.target.value)}
            aria-label="Request body JSON"
            spellCheck={false}
            className="min-h-24 w-full resize-y rounded-lg border border-zinc-300 bg-white p-2.5 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            Generated placeholder — edit freely; it feeds the code snippets below.
          </p>
        </section>
      )}

      <section>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Responses
        </h3>
        <ul className="flex flex-col gap-1">
          {endpoint.responses.map((response) => (
            <li key={response.status}>
              <button
                type="button"
                onClick={() => onMock(response.status)}
                className="flex w-full items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 text-left transition-colors hover:border-violet-400 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-800 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10"
              >
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                    /^2/.test(response.status)
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : /^4|^5/.test(response.status)
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {response.status}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">
                  {response.description ?? "No description"}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  {(response.content ?? []).map((c) => c.mediaType).join(", ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MockPane({
  mockResponses,
  mockStatus,
  onMockStatus,
}: {
  mockResponses: { status: string; description?: string; headers: Record<string, string>; body: string }[];
  mockStatus: string;
  onMockStatus: (status: string) => void;
}) {
  if (mockResponses.length === 0) {
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        This operation does not describe any responses, so no mock body can be generated.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Segmented
        value={mockStatus}
        onChange={onMockStatus}
        ariaLabel="Mock response status"
        options={mockResponses.map((r) => ({ value: r.status, label: r.status }))}
      />
      {mockResponses.map((response) =>
        response.status === mockStatus ? (
          <div key={response.status} className="flex flex-col gap-3">
            {response.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{response.description}</p>
            )}
            {Object.keys(response.headers).length > 0 && (
              <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                {Object.entries(response.headers).map(([name, value]) => (
                  <p key={name} className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                    {name}: {value}
                  </p>
                ))}
              </div>
            )}
            <CodeBlock title={`${response.status} response body`} text={response.body} filename={`mock-${response.status}.json`} />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Placeholder generated from the response schema — not real API output. Values are illustrative.
            </p>
          </div>
        ) : null,
      )}
    </div>
  );
}

function SecurityPane({ items, needsAuth }: { items: { schemeName: string; type: string; summary: string; scopes: string[]; description?: string }[]; needsAuth: boolean }) {
  if (!needsAuth || items.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <ShieldIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        This operation does not require authentication.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={`${item.schemeName}-${index}`} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="flex items-center gap-2 text-sm">
            <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.schemeName}</span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {item.type}
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{item.summary}</p>
          {item.description && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{item.description}</p>}
          {item.scopes.length > 0 && (
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Scopes: <span className="font-mono">{item.scopes.join(", ")}</span>
            </p>
          )}
        </div>
      ))}
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        Generated request snippets never include your token or key — add credentials only in your own client.
      </p>
    </div>
  );
}