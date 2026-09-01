import type { Metadata } from "next";
import { Suspense } from "react";
import { CompilerWorkbench } from "@/components/compiler/compiler-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import { Section, Bullets, UseCases } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/compiler");

const faqs = [
  {
    q: "Is DataFormatter's online compiler free and does it require signup?",
    a: "Yes, it is completely free with no account or signup. You can compile and run Dart, JavaScript and TypeScript directly in your browser.",
  },
  {
    q: "Is the code I compile uploaded to a server?",
    a: "No. Dart runs via WebAssembly and JavaScript/TypeScript run in a sandboxed worker — all execution happens in your browser and your code never leaves your machine.",
  },
  {
    q: "Which languages does the online compiler support?",
    a: "It supports Dart (compiled via WebAssembly) plus JavaScript and TypeScript (run in a sandboxed worker), with language-specific examples to get you started.",
  },
  {
    q: "What is the online compiler best used for?",
    a: "It is ideal for prototyping and testing small code snippets, trying out a language feature, or reproducing a bug without installing a local toolchain.",
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
        summary="DataFormatter Online Compiler is a free web tool that compiles and runs Dart, JavaScript and TypeScript in your browser — Dart via WebAssembly, JS/TS in a sandboxed worker — with no signup and no upload."
        faqs={faqs}
      >
        <Section title="What this online compiler does">
          <Bullets
            items={[
              "Write Dart, JavaScript or TypeScript in a full code editor with syntax highlighting and auto-complete.",
              "Run your code instantly by pressing ⌘/Ctrl + Enter, with output captured to the console panel.",
              "Switch languages and load built-in example snippets to see each language's syntax in action.",
              "Pipe a small standard-input sample through your program where the language supports it.",
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
      </ToolSeoContent>
    </>
  );
}
