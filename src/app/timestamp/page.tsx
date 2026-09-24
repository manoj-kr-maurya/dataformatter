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
    q: "What formats can it auto-detect?",
    a: "Unix seconds, milliseconds, microseconds and nanoseconds (with or without a sign), ISO-8601 strings (with fractional seconds and Z or numeric offsets), RFC-1123 HTTP dates, common US/EU and text-month dates, and the literal \"now\". Recognized zone abbreviations (IST, EST/EDT, CST/CDT, PST/PDT, GMT) are honoured inside pasted wall times.",
  },
  {
    q: "How does it tell seconds from milliseconds?",
    a: "By digit length with a confidence score: 10 or fewer digits is seconds, 13 is milliseconds, 16 is microseconds and 19 is nanoseconds. 11-digit values are honest about the ambiguity — both the seconds and milliseconds interpretations are listed as alternates you can override.",
  },
  {
    q: "Why are UTC and IST always shown first?",
    a: "UTC is the unambiguous reference instant and IST (Asia/Kolkata) is the default primary timezone. You can change the primary timezone in the toolbox and zone-less wall times you enter are interpreted in it; the choice is remembered on your device.",
  },
  {
    q: "What happens with DST-ambiguous wall times?",
    a: "A wall time that falls inside a fall-back overlap or a spring-forward gap is detected rather than guessed: you get a warning naming the DST event, the two candidate instants for overlaps, and the forward-resolved instant for gaps. The DST mode walks you through a whole transition.",
  },
  {
    q: "Are nanosecond timestamps kept exactly?",
    a: "Yes. All epoch math is BigInt-exact, so a 19-digit nanosecond value keeps its full precision. A precision report tells you when the value would lose sub-millisecond digits or exceed JavaScript's safe integer or int32/int64 ranges.",
  },
  {
    q: "Is my timestamp uploaded?",
    a: "No. Parsing, timezone math and DST analysis happen entirely in your browser — safe for logs, tokens, API responses and other timestamps that might be sensitive.",
  },
  {
    q: "What are the extra modes for?",
    a: "Difference and Compare reason across two or many timestamps (including out-of-order detection), Batch converts one value into many units, Generator builds exact instants, Live draws a set of zone clocks, Arithmetic does now ± 2h style math, and Log/JWT/HTTP panels pull timestamps straight out of log lines, token claims and cache headers.",
  },
] as const;

export default function TimestampPage() {
  return (
    <>
      <TimestampTool />
      <ToolSeoContent
        path="/timestamp"
        summary="Convert timestamps between epoch units and human-readable forms in your browser. Paste Unix seconds, milliseconds, microseconds or nanoseconds, ISO-8601 or HTTP dates, or wall-clock times with a zone — and see everything at once, DST-aware and BigInt-exact."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Paste a timestamp — Unix seconds (1736956800), milliseconds, ISO-8601 or a log line.",
            "Read the Convert report: every epoch unit, ISO-8601, RFC 1123, UTC, IST and your primary timezone.",
            "Switch modes with the tabs — Inspect, Zones, Ranges, Difference, Compare, Batch, Generator, Live, Arithmetic.",
            "Copy the whole report or any row in one click; nothing ever leaves your browser.",
          ]}
        />

        <Section title="What the converter produces">
          <Bullets
            items={[
              "Epoch units: seconds, milliseconds, microseconds and nanoseconds — BigInt-exact.",
              "Readable forms: ISO-8601 (Z), RFC-1123 HTTP text, UTC, IST and your primary timezone.",
              "A confidence label for auto-detected numeric input, with alternate unit interpretations listed.",
              "DST warnings when a wall time is ambiguous or does not exist in its zone.",
              "An int32 / int64 / beyond-2038 and JS-precision report for worried systems.",
            ]}
          />
        </Section>

        <Section title="Unix time explained — seconds, milliseconds, UTC, IST and ISO 8601">
          <p>
            A <strong>Unix timestamp</strong> (or epoch time) counts whole seconds since the epoch —
            1 January 1970 00:00:00 UTC — so one number identifies an exact instant on Earth.
            Milliseconds, the most common form in JS ({" "}
            <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">Date.now()</code>
            ) and most APIs, are simply the same count scaled by 1000. Because the epoch is defined
            in UTC, a timestamp always converts to an unambiguous instant; the local zone (such as IST)
            is only a display choice on top of that instant.
          </p>
          <Bullets
            items={[
              "Seconds vs milliseconds — the same instant: 1736956800 seconds equals 1736956800000 milliseconds. A 12-13 digit value is the millisecond form; 10 digits is the second form.",
              "UTC — the reference clock: 1736956800 is the same instant everywhere, always 2025-01-15T16:00:00Z no matter where you read it.",
              "IST (UTC+05:30) — the Indian Standard Time rendering of that instant is 2025-01-15 21:30:00, five and a half hours ahead of UTC.",
              "ISO 8601 — the text form 2025-01-15T16:00:00.000Z is the interchange format for API payloads and logs; the trailing Z pins it to UTC.",
            ]}
          />
          <Example
            input={"0"}
            output={`ISO-8601  1970-01-01T00:00:00.000Z\nUTC       Thu, 01 Jan 1970 00:00:00 GMT\nIST       1970-01-01 05:30:00 IST`}
            inputLabel="Epoch 0 (Unix seconds)"
            outputLabel="The epoch instant"
          />
        </Section>

        <Section title="How to convert a timestamp online">
          <Bullets
            items={[
              "Copy the timestamp however you got it — database row, API response, log line, cache header.",
              "Paste it in; the input auto-detects numeric unit, ISO/RFC form or wall-clock time.",
              "Check the Convert report, then use the ISO string in scripts or the numeric units in queries.",
              "Use the presets (Now, Unix 0, Epoch —) for quick experiments, and add extra time zones to compare.",
            ]}
          />
          <Example
            input={"1736956800000"}
            output={`ISO-8601  2025-01-15T16:00:00.000Z\nUTC       Wed, 15 Jan 2025 16:00:00 GMT\nIST       2025-01-15 21:30:00 IST`}
            inputLabel="Epoch milliseconds"
            outputLabel="Readable forms"
          />
        </Section>

        <Section title="Who converts timestamps — and when">
          <UseCases
            cases={[
              {
                title: "Reading a database row",
                body: "\"updated_at\": 1736956800000 means nothing until you convert it. One paste turns it into a human-readable instant you can compare against your incident timeline.",
              },
              {
                title: "Debugging a failing DST deploy",
                body: "A schedule written as 02:30 in America/New_York lands on 2026-03-08, when that wall time doesn't exist. The tool flags the gap, shows the transition and lets you pick the real instant.",
              },
              {
                title: "Auditing token and cache timestamps",
                body: "Paste a JWT or raw cache headers and the Log/JWT/HTTP panels extract iat, exp, nbf, Date and Retry-After claims, report validity and show each instant in UTC and IST.",
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
                fix: "Either interpretation is listed as an alternate with its confidence; click the override to force seconds or milliseconds.",
              },
              {
                error: "\"Number is too large\"",
                cause: "A random ID or a 20+-digit value pasted in by mistake, or a timestamp beyond the representable date range (about year 275760).",
                fix: "Try the 19-digit nanoseconds form instead, or check you didn't paste a row ID.",
              },
              {
                error: "Couldn't recognize that format",
                cause: "A format outside ISO/Unix/RFC/common shapes — e.g. a locale-specific string like '15 Jan 2026' in some European locale ordering.",
                fix: "Normalize to ISO-8601 first, or paste the exact instant as a Unix value.",
              },
            ]}
          />
        </Section>

        <Section title="Pro tips">
          <ProTips
            tips={[
              "Keep the Live mode open with your team's zones added — it draws UTC, IST and your extras as ticking clocks.",
              "Use Arithmetic for 'now + 2w' style deadlines instead of counting days by hand; the result stays exact.",
              "The DST debugger walks an entire transition hour-by-hour — invaluable when scheduling jobs around a jump.",
              "Epoch units copy in one click from the Convert report — no manual truncation of milliseconds.",
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