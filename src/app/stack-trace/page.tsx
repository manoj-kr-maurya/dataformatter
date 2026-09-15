import type { Metadata } from "next";
import Link from "next/link";
import { StackTraceWorkbench } from "@/components/devtools/stack-trace-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import {
  Section,
  Bullets,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
  Example,
} from "@/components/seo/content-blocks";
import { buildMetadata, FOOTER_LINKS, SITE_NAME } from "@/lib/seo";

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
  {
    q: "Does it format a Java stack trace?",
    a: "Yes. Paste a raw Java stack trace — as produced by e.printStackTrace() and most loggers — and the tool parses the exception banner line (exception type and message) plus every 'at ...(File.java:line)' frame, then builds a clean call chain. Formatting, parsing and summary extraction all happen locally.",
  },
  {
    q: "What does a Java printStackTrace() output give me?",
    a: "Java's printStackTrace() writes the exception class, a colon and the exception message on the first line, then one 'at' frame per line showing class.method, source file and line number. Pasting that block here gives you the exception, the origin file/line and a trimmed call chain in one view.",
  },
  {
    q: "Can I convert a Java stack trace to a string here?",
    a: "Not by writing Java for you — but the tool is built around exactly the string form produced by Throwable.printStackTrace(), StringWriter + PrintWriter, or Apache Commons ExceptionUtils.getStackTrace(). If you can get the trace as text, paste that text here and it is parsed instantly.",
  },
] as const;

export default function StackTracePage() {
  return (
    <>
      <StackTraceWorkbench activeHref="/stack-trace" />
      <ToolSeoContent
        path="/stack-trace"
        summary="Read any stack trace at a glance. Paste a Java, JavaScript, Python or Go trace — including raw printStackTrace() output — and get the exception, the first-project frame and a clean call chain. Parsed locally, nothing uploaded."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Copy the full trace, including the exception line at the top.",
            "Paste it in — language detection runs automatically.",
            "Check the Exception box and the first highlighted location ('.java:42' style).",
            "Walk the Call chain, then open Frames for the gritty detail.",
          ]}
        />

        <Section title="Java stack trace formatter">
          <p>
            A Java stack trace — whether from <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">printStackTrace()</code>, a logger&apos;s
            <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800"> &ldquo;stack trace&rdquo;</code> output, or Sentry/BugSnag — follows a consistent shape. Reading it as a
            Java developer means separating four things: the exception type, the exception message,
            the stack frames, and the origin (file and line) where the failure actually began.
          </p>
          <Example
            inputLabel="Java stack trace"
            input={`java.lang.NullPointerException: Cannot invoke "String.length()" because "name" is null\n\tat com.example.OrderService.charge(OrderService.java:42)\n\tat com.example.OrdersController.create(OrdersController.java:18)\n\tat java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(...)\n\tat org.springframework.web.method.support.InvocableHandlerMethod.invoke(...)`}
            outputLabel="What the tool extracts"
            output={`Exception: java.lang.NullPointerException\n  — Cannot invoke "String.length()" because "name" is null\nWhere: OrderService.java:42\n\nCall chain (clean → deep):\n1. charge\n2. create\n3. invoke\n4. invoke`}
          />
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Exception type</dt>
              <dd className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                The first token, <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">java.lang.NullPointerException</code>. It names the failure class and is typically enough to classify the bug (null dereference, invalid index, type cast, …).
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Exception message</dt>
              <dd className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Everything after the colon on the first line. Messages are the highest-signal hint and are often all you need to reproduce the failure.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Stack frames</dt>
              <dd className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                The <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">at com.example.OrderService.charge(OrderService.java:42)</code> lines. Each lists <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">class.method</code>, the source file and the line number.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Finding your code</dt>
              <dd className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Your project&apos;s frames carry <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">com.yourcompany</code> package or file paths. Frames from <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">java.base/</code>, Spring, Hibernate or the JVM runtime are framework noise — the tool trims repeated framework segments so your application frames stay at the top of the chain.
              </dd>
            </div>
          </dl>
          <p className="mt-3">
            The parser models exactly this structure: the banner line is split into exception type and
            message, each <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">at ...(File.java:line)</code> frame captures function, file and line, and the
            call chain is produced by deduplicating and trimming framework-level repetition.
          </p>
        </Section>

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