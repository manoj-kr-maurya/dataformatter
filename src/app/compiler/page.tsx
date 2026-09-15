import type { Metadata } from "next";
import { Suspense } from "react";
import { CompilerWorkbench } from "@/components/compiler/compiler-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import {
  Section,
  Bullets,
  QuickStart,
  UseCases,
  Example,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/compiler");

const faqs = [
  {
    q: "Is DataFormatter's online compiler free and does it require signup?",
    a: "Yes, it is completely free with no account or signup. You can compile and run Dart, JavaScript and TypeScript directly in your browser.",
  },
  {
    q: "Is the code I compile uploaded to a server?",
    a: "No. Dart runs via the DDC compiler and WebAssembly in your browser, while JavaScript and TypeScript execute in a sandboxed Web Worker. Nothing you type leaves your machine.",
  },
  {
    q: "Which languages does the online compiler support?",
    a: "Dart (compiled in-browser via WebAssembly), JavaScript (run in a sandboxed Web Worker) and TypeScript (transpiled type-check-free, then executed in the same sandbox). Switch between them using the language tabs.",
  },
  {
    q: "What is the online compiler best used for?",
    a: "It is ideal for prototyping and testing small code snippets, trying out a language feature, or reproducing a bug without installing a local toolchain.",
  },
  {
    q: "Do I need to install Dart to use the online Dart compiler?",
    a: "No. The Dart compiler runs entirely in your browser. You do not need to install the Dart SDK, a package manager or any local toolchain — just open the page and start writing code.",
  },
  {
    q: "How do I run Dart code in the browser?",
    a: "Select the Dart tab (it is the default), write your code in the editor, then press ⌘/Ctrl + Enter or click the Run button. The Dart engine boots on first run via WebAssembly — this takes a moment on the initial load, then subsequent runs are fast.",
  },
  {
    q: "What browser do I need for the online compiler?",
    a: "Any modern browser with WebAssembly and Web Worker support: Chrome 57+, Firefox 52+, Safari 11+ or Edge 16+. The Dart engine loads automatically when you select the Dart language.",
  },
] as const;

export default function CompilerPage() {
  return (
    <>
      {/* Suspense boundary required because the workbench reads ?lang= via
          useSearchParams while this page prerenders statically. */}
      <Suspense fallback={null}>
        <CompilerWorkbench />
      </Suspense>
      <ToolSeoContent
        path="/compiler"
        summary="Run Dart, JavaScript and TypeScript online — an online compiler and playground in your browser. Dart compiles via WebAssembly (DDC), JS/TS runs in a sandboxed Web Worker — no install, no signup, code never leaves your machine."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Choose a language using the Dart / JS / TS tabs (Dart is the default).",
            "Write or paste code in the editor on the left.",
            "Press ⌘/Ctrl + Enter or click Run to compile and execute.",
            "Read the output in the panel on the right — errors appear there too.",
          ]}
        />

        <Section title="Run Dart online — how the Dart compiler works">
          <p>
            DataFormatter includes a full online Dart compiler. When you select Dart and click Run, the
            page boots the DartPad DDC (Dart Development Compiler) engine — a WebAssembly build of
            the Dart compiler and runtime that runs entirely in your browser. There is no remote server
            involved: the Dart SDK, compiler and execution sandbox are all loaded into your browser tab.
          </p>
          <p className="mt-3">
            The first Dart run loads the WebAssembly engine in the background (a single fetch that
            takes a few seconds on a typical connection). Subsequent runs are instant because the
            compiler keeps a persistent incremental compilation session between runs — edit your code,
            press Run again, and changes compile and execute immediately.
          </p>
        </Section>

        <Section title="Supported languages and execution models">
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <th scope="col" className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">Language</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">Execution model</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">What it means for you</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                  <td className="px-3 py-2 align-top font-medium text-zinc-800 dark:text-zinc-200">Dart</td>
                  <td className="px-3 py-2 align-top leading-relaxed text-zinc-600 dark:text-zinc-400">
                    DDC (Dart Development Compiler) → WebAssembly + sandboxed iframe
                  </td>
                  <td className="px-3 py-2 align-top leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Full Dart language support including classes, async/await, generics, collections and dart:core. Output goes to the console panel; standard input is read via the STDIN box using <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">dart:js_interop</code>.
                  </td>
                </tr>
                <tr className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                  <td className="px-3 py-2 align-top font-medium text-zinc-800 dark:text-zinc-200">JavaScript</td>
                  <td className="px-3 py-2 align-top leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Sandboxed Web Worker (V8 / SpiderMonkey)
                  </td>
                  <td className="px-3 py-2 align-top leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Current JavaScript (ES2024+). Runs in a sandboxed worker with access to <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">console.log</code> and a 10-second timeout. Network and DOM are not available.
                  </td>
                </tr>
                <tr className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                  <td className="px-3 py-2 align-top font-medium text-zinc-800 dark:text-zinc-200">TypeScript</td>
                  <td className="px-3 py-2 align-top leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Type-check-free transpile → JavaScript sandboxed worker
                  </td>
                  <td className="px-3 py-2 align-top leading-relaxed text-zinc-600 dark:text-zinc-400">
                    TypeScript is stripped of type annotations (no type-checking), then run in the same sandboxed JavaScript worker. Types appear in the editor for clarity but errors are not enforced.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="How to run Dart code online — the quick workflow">
          <p>
            The Dart tab loads by default. Write a <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">void main()</code> function
            with <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">print()</code> statements,
            press Run, and the output appears in the panel on the right. The editor includes
            syntax highlighting; press ⌘/Ctrl + Enter to run from anywhere in the editor.
          </p>
          <Example
            inputLabel="Dart source"
            input={`void main() {\n  final name = 'Dart';\n  print('Hello from $name — running in the browser!');\n}`}
            outputLabel="Output"
            output="Hello from Dart — running in the browser!"
          />
          <p className="mt-3">
            To read lines from the STDIN box (the collapsible input area below the output pane), use the <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">dartpadReadLine</code> JS function exposed through <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">dart:js_interop</code> — see the &quot;stdin echo&quot; example in the Examples menu for a working template.
          </p>
        </Section>

        <Section title="Limitations">
          <Bullets
            items={[
              "Dart programs execute in a browser sandbox — there is no filesystem, network (fetch) or OS access.",
              "JavaScript and TypeScript have a 10-second execution timeout; long-running programs are stopped.",
              "TypeScript is transpiled type-check-free — types exist for editor clarity but are not enforced at compile time.",
              "The Dart engine loads a WebAssembly bundle on first run (~8 MB); the first run takes a few seconds on slower connections.",
              "Standard input is available but read via the JS bridge — there is no real terminal or TTY.",
            ]}
          />
        </Section>

        <Section title="When to reach for an in-browser compiler">
          <UseCases
            cases={[
              {
                title: "Prototyping a snippet",
                body: "Test a function or algorithm in Dart, JS or TypeScript before committing it to a real project.",
              },
              {
                title: "Reproducing a bug",
                body: "Paste the failing code into the editor to see the exact error without standing up an environment.",
              },
              {
                title: "Learning a language",
                body: "Try Dart or TypeScript alongside the built-in examples to understand syntax and output.",
              },
            ]}
          />
        </Section>

        <Section title="How it differs from a hosted compiler">
          <p>
            Many online compilers send your code to a remote server to run it. This one executes
            entirely in your browser — Dart through WebAssembly and JavaScript/TypeScript in a
            sandboxed worker — so there is no code upload, no queue and no server-side logging. That
            makes it a good fit when you are experimenting with code you would rather keep local.
          </p>
        </Section>

        <Section title="When something does not work as expected">
          <Troubleshooting
            items={[
              {
                error: 'Dart run hangs at "Loading Dart engine…"',
                cause: "The first Dart run downloads a WebAssembly compiler bundle in the background. A slow connection or large bundle may delay the initial boot.",
                fix: "Wait for the engine to finish loading — subsequent runs are instant. If it persists, try reloading the page or switching to JS/TS in the meantime.",
              },
              {
                error: "JavaScript/TypeScript program times out",
                cause: "The sandboxed worker has a 10-second execution timeout to prevent infinite loops from locking the browser.",
                fix: "Reduce loop iterations or async waits, or break the program into smaller steps.",
              },
              {
                error: "TypeScript errors are not reported",
                cause: "TypeScript is transpiled without type-checking — types exist in the editor but are stripped before execution.",
                fix: "This is by design. The editor still shows types for readability; compile errors appear only for invalid JavaScript after transpilation.",
              },
            ]}
          />
        </Section>

        <Section title="Pro tips">
          <ProTips
            tips={[
              "Open the Examples menu to load built-in snippets for each language — a quick way to see syntax in action without writing code from scratch.",
              "Use the collapsible STDIN box to pipe data to your program: for Dart, use the dartpadReadLine JS bridge; for JS/TS, call readLine() which returns the next line or null.",
              "Dart and JavaScript drafts are separate — switching tabs never loses your code. Each language remembers its last edit.",
              "Use the Share button to generate a shareable URL containing the current program, ready to send to someone or bookmark.",
            ]}
          />
        </Section>
      </ToolSeoContent>
    </>
  );
}
