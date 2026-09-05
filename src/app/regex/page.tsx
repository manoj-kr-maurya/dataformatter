import type { Metadata } from "next";
import Link from "next/link";
import { RegexWorkbench } from "@/components/devtools/regex-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import {
  Section,
  Bullets,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata, FOOTER_LINKS, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/regex");

const faqs = [
  {
    q: "How accurate is the testing?",
    a: "It runs the browser's native RegExp engine on your exact pattern, flags and text. What you see here is precisely what JavaScript (Node or in-browser) will do — no interpreter mismatch.",
  },
  {
    q: "What does Whole text vs Per line mean?",
    a: "Whole text matches against the entire block, honoring the m (multiline) and s (dotAll) flags exactly like RegExp.text.test(). Per line splits input into lines first and reports per-line match counts — handy for checking log files line-by-line where ^ and $ should anchor each line regardless of the m flag.",
  },
  {
    q: "Which flags are supported?",
    a: "d (indices), g (global), i (ignore case), m (multiline), s (dotAll), u (unicode), v (unicodeSets, in modern engines) and y (sticky). Toggle them as chips; the engine validates them the way the browser would.",
  },
  {
    q: "Why does my non-global pattern show limited matches?",
    a: "Without g (or y), a RegExp only finds the first match by design. The tool tells you the pattern is non-global and scans as if global for display purposes — but the global badge makes the semantic clear.",
  },
  {
    q: "Can it show capture groups?",
    a: "Yes. Each match lists its positional groups and named groups (like (?<name>…)), so you can verify what would actually be captured in your code before you write it.",
  },
  {
    q: "Is anything uploaded?",
    a: "No. Everything runs locally, so it's safe to test patterns against real config or log samples that contain sensitive data.",
  },
] as const;

export default function RegexPage() {
  return (
    <>
      <RegexWorkbench activeHref="/regex" />
      <ToolSeoContent
        path="/regex"
        summary="Build and test regular expressions in your browser with instant feedback. See every match with position and capture groups, toggle flags, and try ready-made patterns for emails, UUIDs, dates and more."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Type a pattern between the slashes — or click a demo (Email, UUID, ISO date…).",
            "Toggle flags with the chips; the /g global flag changes the match count semantics.",
            "Paste your own sample text and watch matches highlight with position and groups.",
            "Switch to Per line when auditing config or log files line-by-line.",
          ]}
        />

        <Section title="What the playground shows">
          <Bullets
            items={[
              "Instant validity — a red error explains exactly what the engine rejected and why.",
              "Each match with its index, the matched text, and up to 6 capture groups.",
              "Named groups displayed as name=value pairs ready to reference in replacement code.",
              "A context preview showing the characters before and after each match.",
              "Per-line mode with match counts per input line for log and config auditing.",
            ]}
          />
        </Section>

        <Section title="Who tests regex online — and when">
          <UseCases
            cases={[
              {
                title: "Writing validators",
                body: "Draft an email or UUID pattern, flip i/g as needed, and verify the capture group before it lands in a validation rule.",
              },
              {
                title: "Auditing logs",
                body: "Build a pattern, switch to Per line, and confirm it isolates exactly the lines you want before wiring it into your log scanner.",
              },
              {
                title: "Learning by demo",
                body: "Five ready patterns show ranges, repetition, groups and character classes working against the same sample data you can edit.",
              },
            ]}
          />
        </Section>

        <Section title="When matches surprise you">
          <Troubleshooting
            items={[
              {
                error: "Only one match despite text containing several",
                cause: "The pattern lacks the g flag, so a non-global RegExp stops after the first match.",
                fix: "Toggle the g chip on and the count jumps to every occurrence.",
              },
              {
                error: "^ and $ don't match per line",
                cause: "Those anchors bind to string start/end unless m (multiline) is set.",
                fix: "Add m, or switch to Per line mode which anchors each line for you.",
              },
              {
                error: "Invalid escape",
                cause: "Patterns like \\d\\s written with single backslashes inside a string sometimes become doubled literals in JavaScript source.",
                fix: "In code, write String.raw`\\d+` or double the backslashes; here, paste the pattern as the engine sees it.",
              },
            ]}
          />
        </Section>

        <Section title="Pro tips">
          <ProTips
            tips={[
              "Copy Matches gives you a versioned record — pattern, flags, match count and every group — ready for a ticket or PR description.",
              "Named groups show their keys, so you can confirm (?<year>\\d{4}) captures the field you intend.",
              "Browser-parity means code you write here behaves identically in Node's regexp engine.",
            ]}
          />
        </Section>
      </ToolSeoContent>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {SITE_NAME} — free online developer data tools that run entirely in your browser. Your
            data stays private: nothing you paste is ever uploaded to a server.
          </p>
          <nav
            aria-label="All tools"
            className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}