"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { dart } from "@codemirror/legacy-modes/mode/clike";
import { javascript } from "@codemirror/legacy-modes/mode/javascript";
import CodeMirror from "@uiw/react-codemirror";
import {
  AlertIcon,
  CheckIcon,
  CopyIcon,
  LoaderIcon,
  MenuIcon,
  PanelIcon,
  PlayIcon,
  RotateIcon,
  ShareIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar, pageHrefForTool } from "@/components/app/sidebar";
import { usePersistedState } from "@/hooks/usePersistedState";
import { AUTO_DETECT } from "@/lib/tools";
import type { ToolMode } from "@/types/tools";
import { editorTheme } from "@/components/editor/codemirror-theme";
import { copyToClipboard } from "@/lib/clipboard/copy";
import {
  CompilerEngine,
  type RunState,
  type WorkbenchEvent,
} from "@/lib/compiler/run-controller";
import {
  COMPILER_EXAMPLES_BY_LANGUAGE,
  DEFAULT_EXAMPLE,
  DEFAULT_EXAMPLE_BY_LANGUAGE,
  type CompilerExample,
  type CompilerLanguage,
} from "@/lib/compiler/examples";
import { createCompilerShareLink, restoreCompilerShare } from "@/lib/compiler/share";
import { JsRunner } from "@/lib/compiler/js-runner";
import { transpileTypeScript } from "@/lib/compiler/ts-transpile";

/**
 * The compiler playground — Dart, JavaScript and TypeScript.
 *
 * Dart runs on the self-hosted WebAssembly engine (one instance per page).
 * JavaScript runs directly in a sandboxed Web Worker; TypeScript is
 * transpiled in-browser (type-check-free) first, then executed the same way.
 * All browser APIs are touched from effects or event handlers only so the
 * prerender pass stays clean.
 */

const LANGUAGES: { id: CompilerLanguage; label: string; file: string; tab: string }[] = [
  { id: "dart", label: "Dart", file: "main.dart", tab: "Dart" },
  { id: "js", label: "JavaScript", file: "index.js", tab: "JS" },
  { id: "ts", label: "TypeScript", file: "index.ts", tab: "TS" },
];

function languageById(id: CompilerLanguage) {
  return LANGUAGES.find((entry) => entry.id === id) ?? LANGUAGES[0];
}

const RUN_LABELS: Record<RunState, string> = {
  idle: "",
  compiling: "Compiling…",
  running: "Running…",
  done: "Done",
  "compile-error": "Compile errors",
  "runtime-error": "Crashed",
};

/** Tail classes for the outcome chip shown beside the toolbar buttons. */
const RUN_TONES: Record<RunState, string> = {
  idle: "",
  compiling: "text-violet-600 dark:text-violet-300",
  running: "text-violet-600 dark:text-violet-300",
  done: "text-emerald-600 dark:text-emerald-400",
  "compile-error": "text-red-600 dark:text-red-400",
  "runtime-error": "text-amber-600 dark:text-amber-400",
};

export function CompilerWorkbench() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<CompilerLanguage>(
    searchParams.get("lang") === "js"
      ? "js"
      : searchParams.get("lang") === "ts"
        ? "ts"
        : searchParams.get("lang") === "dart"
          ? "dart"
          : "dart",
  );
  // Separate drafts per language so switching tabs never loses code.
  const [codeByLanguage, setCodeByLanguage] = useState<Record<CompilerLanguage, string>>({
    dart: DEFAULT_EXAMPLE.code,
    js: DEFAULT_EXAMPLE_BY_LANGUAGE.js.code,
    ts: DEFAULT_EXAMPLE_BY_LANGUAGE.ts.code,
  });
  const [stdinText, setStdinText] = useState(DEFAULT_EXAMPLE.stdin);
  const [stdinOpen, setStdinOpen] = useState(DEFAULT_EXAMPLE.stdin.length > 0);
  const [output, setOutput] = useState<{ level: string; message: string; id: number }[]>([]);
  const [phase, setPhase] = useState<"cold" | "booting" | "ready">("cold");
  const [runState, setRunState] = useState<RunState>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);

  const code = codeByLanguage[language];

  // Collapsible sidebar: visible by default so users can hop back to the
  // other tools; collapsed state persists across visits. On mobile (< sm)
  // the rail is hidden and the header button opens the drawer instead.
  const [navExpanded, setNavExpanded] = usePersistedState<boolean>("devtools-compiler-nav", true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const engineRef = useRef<CompilerEngine | null>(null);
  const jsRunnerRef = useRef<JsRunner | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const runStartRef = useRef(0);

  // Lazily create the engine exactly once. The constructor is browser-safe
  // (all window access is deferred until boot), and the `== null` check
  // satisfies the react-hooks/refs rule for one-time ref initialization.
  if (engineRef.current == null) {
    engineRef.current = new CompilerEngine();
  }

  // Wire the engine's event stream into component state (Dart only).
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    const apply = (event: WorkbenchEvent) => {
      switch (event.kind) {
        case "phase":
          setPhase(event.phase);
          break;
        case "runState":
          setRunState(event.state);
          if (event.state === "compiling") {
            setNotice(null);
            setElapsedMs(null);
          } else if (event.state !== "running") {
            setElapsedMs(Math.round(performance.now() - runStartRef.current));
          }
          break;
        case "console":
          if (event.message.message.length > 0) {
            setOutput((prev) =>
              appendLine(prev, event.message.level, event.message.message),
            );
          }
          break;
        case "diagnostics":
          break; // v1 renders diagnostics through the Problems strip below
        case "notice":
          setNotice(event.message);
          break;
      }
    };
    return engine.subscribe(apply);
  }, []);

  // Warm the Dart engine up (~8MB wasm in the background) — but only while
  // Dart is the active language, so JS/TS-first visitors don't pay for a
  // download they never use.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || language !== "dart") {
      return;
    }
    void engine.preload().catch((error: unknown) => {
      setEngineError(error instanceof Error ? error.message : String(error));
    });
  }, [language]);

  // Dispose exactly once on unmount — not on language switches, which must
  // leave a warmed-up Dart session intact for when the user returns.
  useEffect(() => {
    const engine = engineRef.current;
    return () => {
      void engine?.dispose();
      jsRunnerRef.current?.dispose();
    };
  }, []);

  // Auto-scroll the output pane.
  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [output]);

  // Restore a shared program from the URL fragment.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await restoreCompilerShare(window.location.href);
      if (cancelled || result.status !== "ok") {
        return;
      }
      const shared = result.payload;
      const lang = shared.language ?? "dart";
      setLanguage(lang);
      setCodeByLanguage((prev) => ({ ...prev, [lang]: shared.code }));
      setStdinText(shared.stdin);
      setStdinOpen(shared.stdin.length > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Ensure the lazy JS runner exists and streams console lines. */
  const ensureJsRunner = useCallback((): JsRunner => {
    if (jsRunnerRef.current == null) {
      const runner = new JsRunner();
      runner.onConsole((level, message) => {
        setOutput((prev) => appendLine(prev, level, message));
      });
      jsRunnerRef.current = runner;
    }
    return jsRunnerRef.current;
  }, []);

  const handleRun = useCallback(async () => {
    if (runState === "compiling" || runState === "running") {
      return;
    }
    runStartRef.current = performance.now();

    if (language === "dart") {
      const engine = engineRef.current;
      if (!engine || phase === "booting") {
        return;
      }
      try {
        await engine.run(codeByLanguage.dart, stdinText);
      } catch {
        // State + notice already emitted by the engine.
      }
      return;
    }

    // JS / TS: transpile (TS only), then execute inside the worker.
    setNotice(null);
    setElapsedMs(null);
    setOutput([]);
    let source = code;
    if (language === "ts") {
      setRunState("compiling");
      try {
        source = await transpileTypeScript(code);
      } catch (error) {
        setRunState("compile-error");
        setElapsedMs(Math.round(performance.now() - runStartRef.current));
        setNotice(error instanceof Error ? error.message : String(error));
        return;
      }
    }
    setRunState("running");
    const runner = ensureJsRunner();
    const result = await runner.run(source, stdinText);
    setElapsedMs(Math.round(performance.now() - runStartRef.current));
    if (result.status === "done") {
      setRunState("done");
    } else if (result.status === "timeout") {
      setRunState("runtime-error");
      setNotice("The program ran longer than 10 seconds and was stopped.");
    } else {
      setRunState("runtime-error");
      setNotice(result.message ?? "The program crashed.");
    }
  }, [language, runState, phase, code, codeByLanguage.dart, stdinText, ensureJsRunner]);

  const handleReset = useCallback(async () => {
    setOutput([]);
    setNotice(null);
    setElapsedMs(null);
    if (language === "dart") {
      await engineRef.current?.reset();
    } else {
      jsRunnerRef.current?.dispose();
      jsRunnerRef.current = null;
      setRunState("idle");
    }
  }, [language]);

  /** Swap languages: keep each draft, clear the shared output pane. */
  const switchLanguage = useCallback((next: CompilerLanguage) => {
    setLanguage(next);
    setOutput([]);
    setNotice(null);
    setElapsedMs(null);
    setRunState("idle");
    setExamplesOpen(false);
  }, []);

  // Deep links: sidebar fly-out and URLs like /compiler?lang=ts select the
  // language tab directly. Adjusting during render (not in an effect), per
  // the React docs' derived-state pattern, keeps this cascade-free.
  const langParam = searchParams.get("lang");
  const [appliedLangParam, setAppliedLangParam] = useState(langParam);
  if (
    (langParam === "dart" || langParam === "js" || langParam === "ts") &&
    langParam !== appliedLangParam &&
    langParam !== language
  ) {
    setAppliedLangParam(langParam);
    switchLanguage(langParam);
  }

  /** Fly-out tool picks navigate to the page hosting that tool. */
  const handleToolSelect = useCallback(
    (tool: ToolMode) => {
      setNavDrawerOpen(false);
      router.push(pageHrefForTool(tool));
    },
    [router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handleRun();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRun]);

  // Keep the module-level run handler (used by the CodeMirror keymap)
  // pointing at the latest closure.
  useEffect(() => {
    globalRunHandler = () => void handleRun();
    return () => {
      globalRunHandler = null;
    };
  }, [handleRun]);

  const handleShare = useCallback(async () => {
    const link = await createCompilerShareLink({ code, stdin: stdinText, language });
    if (link.tooLarge) {
      setNotice("This program is too large for a share link.");
      return;
    }
    try {
      window.history.replaceState(null, "", link.url.split("#")[1] ? `#${link.url.split("#")[1]}` : "");
    } catch {
      // Ignore — copying still works.
    }
    await copyToClipboard(link.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [code, stdinText, language]);

  const busy = runState === "compiling" || runState === "running";
  const activeLang = languageById(language);
  const usingEngine = language === "dart";

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex min-w-0 items-center gap-2">
          {/* Mobile: open the tools drawer. Desktop: collapse/expand the rail. */}
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
            title={navExpanded ? "Collapse sidebar" : "Expand sidebar"}
            onClick={() => setNavExpanded((open) => !open)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
              {activeLang.label} Playground{" "}
              <span className="ml-1 align-middle text-[10px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
                beta
              </span>
            </p>
            <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              Compile &amp; run entirely in your browser — nothing leaves your machine
            </p>
          </div>
          {/* Language switcher */}
          <div
            role="tablist"
            aria-label="Playground language"
            className="ml-1 flex shrink-0 items-center rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700"
          >
            {LANGUAGES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={language === entry.id}
                onClick={() => switchLanguage(entry.id)}
                title={entry.label}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-500 ${
                  language === entry.id
                    ? "bg-violet-600 text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                {entry.tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExamplesMenu
            open={examplesOpen}
            onOpenChange={setExamplesOpen}
            examples={COMPILER_EXAMPLES_BY_LANGUAGE[language]}
            onPick={(example) => {
              setCodeByLanguage((prev) => ({ ...prev, [language]: example.code }));
              setStdinText(example.stdin);
              setStdinOpen(example.stdin.length > 0);
              setOutput([]);
              setNotice(null);
              setElapsedMs(null);
            }}
          />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        {navExpanded && (
          <Sidebar
            activeHref="/compiler"
            mode={AUTO_DETECT}
            onSelectTool={handleToolSelect}
            open={navDrawerOpen}
            onClose={() => setNavDrawerOpen(false)}
          />
        )}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        {/* Editor column */}
        <section className="flex min-h-0 flex-1 flex-col border-b border-zinc-200 dark:border-zinc-800 lg:border-b-0 lg:border-r">
          <div className="flex h-9 shrink-0 items-center gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{activeLang.file}</span>
            <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500">
              ⌘/Ctrl + ↵ to run
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <CodeMirror
              /* Remount per language: swapping both value and extensions on
                 one live view makes @uiw/react-codemirror drop the new value.
                 Drafts live in React state, so nothing is lost. */
              key={language}
              value={code}
              onChange={(value) => setCodeByLanguage((prev) => ({ ...prev, [language]: value }))}
              extensions={language === "dart" ? dartExtensions : javascriptExtensions}
              theme={editorTheme}
              /* Stretch to the pane so the editor — not its clipped wrapper —
                 owns scrolling, and clicks on blank space land inside CM. */
              style={{ height: "100%" }}
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                highlightActiveLine: true,
                highlightActiveLineGutter: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: false,
                highlightSelectionMatches: true,
              }}
              aria-label={`${activeLang.label} source code`}
            />
          </div>
        </section>

        {/* Output column */}
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-9 shrink-0 items-center gap-2 border-y border-zinc-200 px-3 dark:border-zinc-800 lg:border-t-0">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Output</span>
              {usingEngine && phase === "booting" && (
                <span className="inline-flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-300">
                  <LoaderIcon className="h-3 w-3 animate-spin" /> Loading Dart engine…
                </span>
              )}
              {output.length > 0 && (
                <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-[11px]" onClick={() => setOutput([])}>
                  Clear
                </Button>
              )}
            </div>
            <div
              ref={outputRef}
              className="min-h-0 flex-1 overflow-auto bg-white p-3 font-mono text-[13px] leading-relaxed dark:bg-zinc-950"
              aria-label="Program output"
              role="log"
              aria-live="polite"
            >
              {output.length === 0 && !notice ? (
                <p className="font-sans text-sm text-zinc-400 dark:text-zinc-500">
                  Press Run to compile and execute your program.
                </p>
              ) : null}
              {output.map((line) => (
                <pre
                  key={line.id}
                  className={
                    line.level === "error"
                      ? "whitespace-pre-wrap break-words text-red-600 dark:text-red-400"
                      : line.level === "warn"
                        ? "whitespace-pre-wrap break-words text-amber-600 dark:text-amber-400"
                        : line.level === "info"
                          ? "whitespace-pre-wrap break-words text-zinc-400 dark:text-zinc-500"
                          : "whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200"
                  }
                >
                  {line.message}
                </pre>
              ))}
              {notice && (
                <p className="mt-2 whitespace-pre-wrap border-l-2 border-red-400 pl-2 font-sans text-sm text-red-600 dark:border-red-500/60 dark:text-red-400">
                  {notice}
                </p>
              )}
            </div>
          </div>

          {/* stdin — same layout for every language, per-language hint */}
          <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setStdinOpen((open) => !open)}
              aria-expanded={stdinOpen}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-500 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              STDIN
              <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
                input lines for your program
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`ml-auto h-3.5 w-3.5 text-zinc-400 transition-transform ${stdinOpen ? "" : "rotate-180"}`}
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </button>
            {stdinOpen && (
              <div className="px-3 pb-2">
                <textarea
                  value={stdinText}
                  onChange={(event) => setStdinText(event.target.value)}
                  rows={3}
                  placeholder={"One input value per line, e.g.\n42\nhello"}
                  aria-label="Standard input for the program"
                  className="h-auto max-h-40 w-full resize-y rounded-md border border-zinc-300 bg-white p-2 font-mono text-[13px] text-zinc-800 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500"
                />
                <p className="mt-1 text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">
                  {usingEngine ? (
                    <>
                      Browsers have no real stdin. Read these lines in Dart with:
                      <code className="ml-1 rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
                        @JS(&apos;dartpadReadLine&apos;) external String? dartpadReadLine();
                      </code>{" "}
                      via <code className="font-mono text-[10px]">dart:js_interop</code>.
                    </>
                  ) : (
                    <>
                      Call <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] dark:bg-zinc-800">readLine()</code> to get
                      the next line (<code className="font-mono text-[10px]">null</code> when exhausted).
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex shrink-0 items-center gap-2 border-t border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
            <Button
              variant="primary"
              size="md"
              onClick={() => void handleRun()}
              disabled={(usingEngine && busy) || (usingEngine && phase === "booting")}
              title={
                usingEngine
                  ? "Compile and run in your browser (⌘/Ctrl + Enter)"
                  : language === "ts"
                    ? "Transpile TypeScript and run it in a sandboxed worker (⌘/Ctrl + Enter)"
                    : "Run in a sandboxed worker (⌘/Ctrl + Enter)"
              }
            >
              {busy ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <PlayIcon className="h-4 w-4" />}
              Run
            </Button>
            <Button size="md" onClick={() => void handleReset()} disabled={usingEngine && phase !== "ready"} title="Kill the running program and reset state">
              <RotateIcon className="h-4 w-4" />
              Reset
            </Button>
            {runState !== "idle" && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium tabular-nums dark:bg-zinc-800 ${RUN_TONES[runState]}`}
                role="status"
              >
                {busy && <LoaderIcon className="h-3 w-3 animate-spin" />}
                {RUN_LABELS[runState]}
                {runState === "done" && elapsedMs !== null && ` · ${elapsedMs}ms`}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button size="md" onClick={() => void copyToClipboard(code)} title="Copy source">
                <CopyIcon className="h-4 w-4" />
              </Button>
              <Button size="md" onClick={() => void handleShare()} title="Copy a shareable link containing this program">
                {copied ? <CheckIcon className="h-4 w-4 text-emerald-500" /> : <ShareIcon className="h-4 w-4" />}
                {copied ? "Copied!" : "Share"}
              </Button>
            </div>
          </div>
        </section>
        </main>
      </div>

      {engineError && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-start gap-2 border-t border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/60 dark:text-red-300">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{engineError}</p>
        </div>
      )}
    </div>
  );
}

let outputLineSeq = 0;

function appendLine(
  prev: { level: string; message: string; id: number }[],
  level: string,
  message: string,
): typeof prev {
  return [...prev.slice(-500), { level, message, id: ++outputLineSeq }];
}

function ExamplesMenu({
  open,
  onOpenChange,
  examples,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examples: CompilerExample[];
  onPick: (example: CompilerExample) => void;
}) {
  return (
    <div className="relative">
      <Button size="md" onClick={() => onOpenChange(!open)} aria-expanded={open} aria-haspopup="menu">
        Examples
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => onOpenChange(false)} />
          <ul
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {examples.map((example) => (
              <li key={example.name} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onPick(example);
                    onOpenChange(false);
                  }}
                  className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-500 dark:hover:bg-zinc-800"
                >
                  <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">{example.name}</span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">{example.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const dartLanguage = StreamLanguage.define(dart);
const jsLanguage = StreamLanguage.define(javascript);

/**
 * Static extensions for the editors. The ⌘/Ctrl+Enter binding routes to
 * the latest run handler via a ref so the extension list stays referentially
 * stable (CodeMirror reconfigures on identity change).
 */

/**
 * Clicking the blank space below the code should drop the caret at the end
 * of the last line that actually has content (not on a phantom trailing
 * empty line created by a final newline). CodeMirror's native behaviour
 * already maps below-document clicks to the document end; this refines it.
 */
const blankClickToLastCodeLine = EditorView.domEventHandlers({
  mousedown(event, view) {
    const doc = view.state.doc;
    let last = doc.line(doc.lines);
    while (last.length === 0 && last.number > 1) {
      last = doc.line(last.number - 1);
    }
    const endCoords = view.coordsAtPos(last.to);
    if (!endCoords) {
      return false; // last line not rendered — let CM handle it
    }
    if (event.clientY > endCoords.bottom + 4) {
      event.preventDefault();
      view.dispatch({ selection: { anchor: last.to }, scrollIntoView: true });
      return true;
    }
    return false;
  },
});

const modEnterKeymap = Prec.highest(
  keymap.of([
    {
      key: "Mod-Enter",
      run: () => {
        globalRunHandler?.();
        return true;
      },
    },
  ]),
);

const dartExtensions = [
  dartLanguage,
  blankClickToLastCodeLine,
  modEnterKeymap,
  EditorView.lineWrapping,
];

const javascriptExtensions = [
  jsLanguage,
  blankClickToLastCodeLine,
  modEnterKeymap,
  EditorView.lineWrapping,
];

let globalRunHandler: (() => void) | null = null;
