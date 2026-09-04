"use client";

import { useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  Stat,
  Hint,
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

export function StackTraceWorkbench() {
  const [text, setText] = useState(SAMPLE_JAVA);

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Stat label="language" value={parse ? parse.language : "—"} />
        <Stat label="frames" value={parse?.frames.length ?? 0} />
        {parse?.exceptionType && <Stat label="exception" value={parse.exceptionType} tone="error" />}
        <div className="ml-auto flex items-center gap-2">
          <CopyButton text={summary} label="Copy summary" />
          <DownloadButton filename="stack-summary.txt" text={summary} label="Download" />
        </div>
      </div>

      <Toolbox
        title="Stack trace"
        actions={
          <div className="flex items-center gap-1">
            <button type="button" className="text-[11px] font-medium text-violet-600 hover:underline dark:text-violet-400" onClick={() => setText(SAMPLE_JS)}>
              Node/JS sample
            </button>
            <button type="button" className="text-[11px] font-medium text-violet-600 hover:underline dark:text-violet-400" onClick={() => setText(SAMPLE_JAVA)}>
              Java sample
            </button>
            <ClearButton onClick={() => setText("")} disabled={text.length === 0} />
          </div>
        }
      >
        <textarea
          className="min-h-[200px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Stack trace"
          spellCheck={false}
        />
        <Hint>Paste a Java, JavaScript/Node, Python or Go stack trace. Parsing runs locally.</Hint>
      </Toolbox>

      {parsed.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{parsed.error}</p>
      )}

      {parse && parse.frames.length > 0 && (
        <>
          <Toolbox title="Exception" actions={(parse.location && <span className="font-mono text-[10px] text-zinc-400">{parse.location.file}:{parse.location.line ?? "?"}</span>) ?? undefined}>
            <p className="font-mono text-sm font-semibold text-red-700 dark:text-red-300">
              {parse.exceptionType ? parse.exceptionType : parse.language}
            </p>
            {parse.message && <p className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-300">{parse.message}</p>}
          </Toolbox>

          <Toolbox title="Call chain" actions={<span className="font-mono text-[10px] text-zinc-400">{parse.chain.length} steps</span>}>
            <ol className="flex flex-col gap-1.5">
              {parse.chain.map((step, index) => (
                <li key={`${step}-${index}`} className="flex items-baseline gap-2.5">
                  <span className="w-6 shrink-0 text-right font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{index + 1}</span>
                  <span className="font-mono text-xs text-zinc-700 dark:text-zinc-200">{step}</span>
                </li>
              ))}
            </ol>
          </Toolbox>

          <Toolbox title="Frames" actions={<span className="font-mono text-[10px] text-zinc-400">{parse.frames.length} frames</span>}>
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
          </Toolbox>
        </>
      )}
    </div>
  );
}