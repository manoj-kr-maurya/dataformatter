"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CodeEditor } from "@/components/editor/code-editor";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar, type PageHref } from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";
import {
  CompressIcon,
  MenuIcon,
  PasteIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import {
  CopyButton,
  DownloadButton,
  ClearButton,
  Segmented,
  Stat,
  Field,
  inputClass,
} from "@/components/devtools/shared";
import { parseJson } from "@/lib/json-diff/diff";
import { infer, rootObject, type SchemaNode } from "@/lib/json-schema/infer";
import { generateCode, CODE_GENERATORS } from "@/lib/json-schema/codegen";
import { getTextCounts } from "@/lib/text/counts";

const SAMPLE = `{
  "id": 42,
  "name": "DataFormatter",
  "roles": ["admin", "editor"],
  "profile": { "joined": "2026-01-15", "active": true }
}`;

export function JsonToCodeWorkbench({ activeHref = "/json-to-code" }: { activeHref?: PageHref }) {
  const [text, setText] = useState(SAMPLE);
  const [typeName, setTypeName] = useState("User");
  const [target, setTarget] = useState(CODE_GENERATORS[0].id);
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const generator = CODE_GENERATORS.find((gen) => gen.id === target) ?? CODE_GENERATORS[0];

  const counts = useMemo(() => getTextCounts(text), [text]);

  const { code, node, error } = useMemo(() => {
    const parsed = parseJson(text);
    if (!("value" in parsed)) {
      return { code: "", node: null, error: `${parsed.error}` };
    }
    let node: SchemaNode;
    try {
      node = infer(parsed.value);
    } catch (cause) {
      return { code: "", node: null, error: `Inference failed: ${String(cause)}` };
    }
    const root = rootObject(node);
    if (root.kind !== "object") {
      return { code: "", node: null, error: "JSON→code expects an object at the root (or a single sample)." };
    }
    try {
      return {
        code: generateCode(generator.id, root, typeName || "User"),
        node: root,
        error: null,
      };
    } catch (cause) {
      return { code: "", node: null, error: `Generation failed: ${String(cause)}` };
    }
  }, [text, typeName, generator.id]);

  const filename = `${(typeName || "Model").replace(/[^A-Za-z0-9_-]/g, "_")}.${generator.extension}`;

  async function handlePaste() {
    if (!navigator.clipboard?.readText) return;
    try {
      const pasted = await navigator.clipboard.readText();
      if (pasted.trim()) setText(pasted);
    } catch {
      /* clipboard permission denied */
    }
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
            JSON to Code
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
                <span className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  JSON input
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => void handlePaste()} title="Paste from the clipboard">
                    <PasteIcon className="h-3.5 w-3.5" />
                    Paste
                  </Button>
                  <ClearButton onClick={() => setText("")} disabled={text.length === 0} />
                </div>
              </div>
              <div className="min-h-72 flex-1 lg:min-h-0">
                <CodeEditor
                  value={text}
                  onChange={setText}
                  language="json"
                  ariaLabel="JSON input for code generation"
                  placeholder="Paste a JSON document…"
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
                <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                  {counts.characters} chars · {counts.words} words · {counts.lines} lines
                </span>
                <span className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                  Paste any JSON — the tool infers a type and emits idiomatic code for your chosen language.
                </span>
              </div>
            </section>

            {/* Controls + output column */}
            <div className="flex min-h-0 flex-col gap-3 lg:w-1/2">
              <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <Field label="Target type name" className="min-w-[10rem]">
                  <input
                    className={inputClass}
                    value={typeName}
                    onChange={(event) => setTypeName(event.target.value)}
                    placeholder="User"
                    aria-label="Target type name"
                  />
                </Field>
                <div className="ml-auto flex flex-col items-start gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Language
                  </span>
                  <Segmented
                    ariaLabel="Code language"
                    value={target}
                    onChange={setTarget}
                    options={CODE_GENERATORS.map((gen) => ({ value: gen.id, label: gen.label }))}
                  />
                </div>
              </div>

              {node && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Stat label="props" value={node.props?.length ?? 0} />
                  <Stat label="array items" value={node.items ? "yes" : "no"} />
                  <Stat label="root" value={node.scalar ?? node.kind} />
                </div>
              )}

              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
                  <span className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Generated {generator.label}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <CopyButton text={code} label="Copy" />
                    <DownloadButton
                      filename={filename}
                      text={code}
                      label="Download"
                      mimeType="text/plain;charset=utf-8"
                    />
                  </div>
                </div>
                {error ? (
                  <p className="m-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                  </p>
                ) : (
                  <pre className="min-h-[16rem] max-h-[34rem] flex-1 overflow-auto whitespace-pre rounded-b-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100 dark:bg-zinc-900">
                    {code || " "}
                  </pre>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}