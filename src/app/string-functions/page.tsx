import type { Metadata } from "next";
import Link from "next/link";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { HubContent } from "@/components/seo/hub-content";
import { STRING_FUNCTION_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/string-functions");

const faqs = [
  {
    q: "What string operations are included?",
    a: "Case conversion, reversing, repeating, word and character counting, frequency analysis, line sorting, deduplication, whitespace and punctuation removal, accent stripping, delimited extraction, hex/binary conversion, number-to-words and more — over twenty utilities in one place.",
  },
  {
    q: "How do I generate a strong password?",
    a: "Pick Password Generator in the rail. It creates high-entropy passwords locally; pair it with the NTLM hash tool when working with Windows identity systems.",
  },
  {
    q: "Can I clean up copy-pasted text from PDFs or emails?",
    a: "Yes — the whitespace removers (extra spaces, empty lines, line breaks) plus accent stripping fix the usual artifacts of copied text in a couple of clicks.",
  },
  {
    q: "How does word frequency help with writing?",
    a: "Paste an article to see which words dominate. Writers use it to catch repetition; SEOs use it to sanity-check keyword distribution before publishing.",
  },
] as const;

export default function StringFunctionsPage() {
  return (
    <>
      <DevToolsShell
        tools={STRING_FUNCTION_TOOL_ORDER}
        activeHref="/string-functions"
        heading="String Functions"
      />
      <HubContent
        path="/string-functions"
        intro={
          <>
            <h2 className="text-xl font-semibold tracking-tight">Twenty-plus text utilities, zero setup</h2>
            <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
              Most text chores don&apos;t deserve a script: flip a name upside down for a bio, count words
              before publishing, normalise case across a list, extract values from delimited logs, or
              spell out a number in words for a cheque-style document. Pick a utility from the rail,
              paste your text, and the transformation happens instantly — locally, with nothing
              uploaded.
            </p>
          </>
        }
        tableHeaders={["Job", "Utility"]}
        tableCaption="String utilities grouped by job"
        tableRows={[
          ["Strong secrets", <>
            Password Generator — verify digests afterwards in the{" "}
            <Link key="hg" href="/hash-generator" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
              Hash Generator
            </Link>
          </>],
          ["Windows identity work", "NTLM hash"],
          ["Cleaning pasted text", "Remove accents / duplicates / empty lines / extra spaces / punctuation"],
          ["Editorial checks", "Word counter, word frequency counter"],
          ["Lists & sorting", "Sort text lines, word sorter, remove lines containing…"],
          ["Fun & social", "Upside-down text, text repeater, random word"],
          ["Encoding curiosity", "String ⇄ hex, string ⇄ binary"],
          ["Documents & forms", "Number to words, words to number, string builder"],
          [
            "Structured extraction",
            <>
              Delimited text extractor — then parse structured data with{" "}
              <Link key="pa" href="/parsers" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                Parsers
              </Link>
            </>,
          ],
        ]}
        faqs={faqs}
      />
    </>
  );
}
