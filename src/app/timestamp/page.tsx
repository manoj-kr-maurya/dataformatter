import type { Metadata } from "next";
import Link from "next/link";
import { TimestampTool } from "@/components/devtools/timestamp-tool";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import {
  Section,
  Bullets,
  Example,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata, FOOTER_LINKS, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/timestamp");

const faqs = [
  {
    q: "What formats can it convert?",
    a: "ISO-8601 strings (with or without milliseconds and time zone), Unix seconds (11 digits or fewer, like 1736956800), Unix milliseconds (13 digits), RFC-1123 HTTP dates (Thu, 15 Jan 2026 12:00:00 GMT), and plain text dates the browser can understand.",
  },
  {
    q: "How does it tell seconds from milliseconds?",
    a: "By length: 11 or fewer digits is treated as seconds, 13 digits as milliseconds. 12-digit values are ambiguous and warned about — 12 digits can't be a seconds timestamp and is too short for most valid millisecond timestamps.",
  },
  {
    q: "What does each conversion row mean?",
    a: "Milliseconds, seconds, microseconds and nanoseconds are the epoch units. ISO-8601, UTC and your local time are the readable forms. Relative shows how far the instant is from right now, tagged future or past.",
  },
  {
    q: "How accurate is the 'now' reference?",
    a: "The clock reference ticks every second, so the past/future label and relative strings stay fresh while you work. The reference zone lets you see the current time in UTC or any listed IANA zone.",
  },
  {
    q: "Is my timestamp uploaded?",
    a: "No. Parsing and conversion happen entirely in your browser — safe for logs, API responses and other timestamps that might be sensitive.",
  },
  {
    q: "Can it handle timestamps far in the past or future?",
    a: "Yes, up to about year 275760 for ISO dates. Unix numeric input is sanity-checked so overflow and negative-so-far-it's-weird values are reported rather than silently mangled.",
  },
] as const;

export default function TimestampPage() {
  return (
    <>
      <TimestampTool />
      <ToolSeoContent
        path="/timestamp"
        summary="Convert timestamps between epoch units and human-readable formats in your browser. Paste Unix seconds or milliseconds, ISO-8601 or HTTP dates and see every form at once."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Paste a timestamp — ISO string, Unix seconds (1736956800) or milliseconds.",
            "Read the Conversions box: milliseconds, seconds, microseconds, nanoseconds.",
            "See the ISO-8601, UTC and your-local-time columns for the same instant.",
            "Watch the relative badge (past/future) tick against the live clock reference.",
          ]}
        />

        <Section title="What the converter produces">
          <Bullets
            items={[
              "Epoch units: milliseconds, seconds, microseconds and nanoseconds.",
              "Readable forms: ISO-8601 (Z), full UTC (RFC-1123 style) and your local time.",
              "A live relative tag — e.g. '2h ago' or 'in 1y' — recomputed every second.",
              "A per-zone 'now' readout for quick mental arithmetic across time zones.",
              "Automatic format detection, so one paste converts no matter what you copied.",
            ]}
          />
        </Section>

        <Section title="How to convert a timestamp online">
          <Bullets
            items={[
              "Copy the timestamp however you got it — database row, API response, log line, header.",
              "Paste it in; the input auto-detects seconds vs milliseconds by length.",
              "Check the Conversions box, then use the ISO string in scripts or the numeric units in queries.",
              "Use presets (Now, Today 09:00 local, Unix 0) for quick experiments.",
            ]}
          />
          <Example
            input={"1736956800000"}
            output={`ISO-8601  2026-01-15T12:00:00.000Z\nUTC       Thu, 15 Jan 2026 12:00:00 GMT`}
            inputLabel="Epoch milliseconds"
            outputLabel="Readable forms"
          />
        </Section>

        <Section title="Who converts timestamps — and when">
          <UseCases
            cases={[
              {
                title: "Reading a database row",
                body: "\"updated_at\": 1786000000000 means nothing until you convert it. One paste turns it into a human-readable instant you can compare against your incident timeline.",
              },
              {
                title: "Writing an API test",
                body: "Grab the exact milliseconds from an ISO assertion, or produce the ISO form you need for a request body — both copy cleanly from the Conversions box.",
              },
              {
                title: "Debugging cache headers",
                body: "An Expires or Last-Modified header lands in Unix or HTTP form; paste and confirm whether that cache entry really lives for 24 hours.",
              },
            ]}
          />
        </Section>

        <Section title="When conversion looks wrong">
          <Troubleshooting
            items={[
              {
                error: "Date 47 years off",
                cause: "A 12-13 digit number is being read as milliseconds when your source is actually seconds rounded, or vice-versa — 12-digit seconds are genuine ambiguity.",
                fix: "If the number has 12 digits, decide: divide by 1000 for seconds semantics or treat as ms. The length rule is documented, not magic.",
              },
              {
                error: "\"Number is too large\"",
                cause: "A 16+-digit value like a nanosecond timestamp or a random ID pasted in by mistake.",
                fix: "Nanoseconds aren't supported; convert to microseconds or seconds first. Check you didn't paste a row ID.",
              },
              {
                error: "Couldn't recognize that format",
                cause: "A format outside ISO/Unix/HTTP — e.g. '15 Jan 2026', EEE-MMM patterns, or locale strings.",
                fix: "Normalize to ISO-8601 first, or paste the exact instant as a Unix value.",
              },
            ]}
          />
        </Section>

        <Section title="Pro tips">
          <ProTips
            tips={[
              "The relative badge ticks live — leave the page open while a scheduled job approaches and watch it flip from future to past.",
              "Pair with the Cron tool: schedule an expression, check its next run in UTC, then convert that instant here.",
              "Epoch units copy in one click from the Conversions box — no manual truncation of milliseconds.",
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