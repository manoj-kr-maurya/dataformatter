import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import {
  Section,
  Bullets,
  Faq,
  FaqJsonLd,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { StackTraceWorkbench } from "@/components/devtools/stack-trace-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/stack-trace");

const faqs = [
  {
    q: "Which languages can it parse?",
    a: "Java (and Kotlin/Spring), JavaScript/Node.js (V8 stack traces, including async and webpack/source-map style frames), Python tracebacks, and Go. Detection is automatic — Node is matched by its stricter frame shape so Java traces aren't misread.",
  },
  {
    q: "What does it extract?",
    a: "The exception type and message, the first project frame (a best guess at 'where it happened'), a deduplicated list of frames with file and line, and a simplified top-down call chain with framework noise trimmed.",
  },
  {
    q: "How is the call chain derived?",
    a: "Frames are deduplicated and repeated framework segments (reflection loops, React render internals) are collapsed, leaving the meaningful application-level steps in order.",
  },
  {
    q: "Is it lossy?",
    a: "Yes, intentionally. The goal is a readable summary — a clean chain and a few key frames — not a byte-perfect reconstruction of framework internals. The Frames table keeps the detail for when you need it.",
  },
  {
    q: "Is my trace uploaded?",
    a: "No. Parsing happens entirely in the browser, so traces that include file paths or stack internals of your app never leave the machine.",
  },
  {
    q: "Can I copy the summary?",
    a: "Yes. Copy Summary produces a compact text version (language, exception, first-project location and the call chain) ready for a ticket or chat.",
  },
] as const;

export default function StackTracePage() {
  return (
    <ToolLandingPage
      path="/stack-trace"
      summary="Read any stack trace at a glance. Paste a Java, JavaScript, Python or Go trace and get the exception, the first-project frame and a clean call chain — parsed locally, nothing uploaded."
    >
      <StackTraceWorkbench />
      <QuickStart
        steps={[
          "Copy the full trace, including the exception line at the top.",
          "Paste it in — language detection runs automatically.",
          "Check the Exception box and the first highlighted location ('.java:42' style).",
          "Walk the Call chain, then open Frames for the gritty detail.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="What stack parsing extracts">
        <Bullets
          items={[
            "Language detection across Java, JavaScript/Node, Python and Go.",
            "Exception type and message, separated cleanly from the frames.",
            "A candidate origin location (file + line) from the first project-level frame.",
            "A deduplicated, framework-trimmed call chain you can paste into reports.",
            "The full frame table with file and line numbers when you need to dig deeper.",
          ]}
        />
      </Section>

      <Section title="Who parses stack traces — and when">
        <UseCases
          cases={[
            {
              title: "Triage in a ticket",
              body: "Instead of pasting a 200-line trace, paste it here, copy the two-line summary, and file the ticket with the signal not the noise.",
            },
            {
              title: "Comparing backtraces",
              body: "Extract clean chains from two traces and compare them directly to confirm they're the same failure or different ones.",
            },
            {
              title: "Reading unfamiliar frameworks",
              body: "Spring reflection, React render internals, V8 async wrappers — the trimmed chain tells you which app frames matter.",
            },
          ]}
        />
      </Section>

      <Section title="When parsing looks off">
        <Troubleshooting
          items={[
            {
              error: "Wrong language guessed",
              cause: "Very short traces may be ambiguous — a lone 'at packagename.Class.method(File.java:12)' line could read as Java or be inside JS hydration internals.",
              fix: "Paste the whole trace including the first exception line; detection is stricter and more reliable with full context.",
            },
            {
              error: "Empty frames",
              cause: "The paste may be a log line rather than an actual backtrace, or a minified/obfuscated format with no recognizable frame markers.",
              fix: "Copy from the 'at …' / 'at …' section specifically, or paste the original console output where frames aren't on one line.",
            },
            {
              error: "Chain looks shorter than expected",
              cause: "Repeated framework segments are intentionally collapsed to keep the chain readable.",
              fix: "Check the Frames table — every parsed frame is there, just not repeated in the chain.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Include the exception header line — it sets language detection and gives you the message for free.",
            "Past full traces from Sentry/BugSnag copy buttons; the parser discards what it doesn't model.",
            "For grouped error trends across many traces, pair this with the Log Analyzer's error grouping.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}