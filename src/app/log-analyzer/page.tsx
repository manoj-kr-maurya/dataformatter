import type { Metadata } from "next";
import Link from "next/link";
import { LogAnalyzerWorkbench } from "@/components/devtools/log-analyzer-workbench";
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

export const metadata: Metadata = buildMetadata("/log-analyzer");

const faqs = [
  {
    q: "What kinds of logs can it analyze?",
    a: "Line-based text: JSON logs, Java/Node style lines with a level label (DEBUG, INFO, WARN, ERROR, FATAL, TRACE), console-prefixed output, nginx access logs and generic timestamped lines. Each line is scored for level, timestamp and message separately.",
  },
  {
    q: "How are error groups built?",
    a: "ERROR/FATAL lines are grouped by a normalized message — parameter values, numbers and IDs are stripped, so 'Rejected order 4815: stock unavailable' and 'Rejected order 9999: stock unavailable' collapse into one group with a count.",
  },
  {
    q: "What does the timeline show?",
    a: "When timestamps are detected, lines are bucketed into UTC hours with separate counts for all lines, errors and warnings. It's a quick way to spot error spikes around a deploy or a batch run.",
  },
  {
    q: "Does size matter?",
    a: "Analysis covers up to 50,000 lines so the page stays fast. For bigger files, slice the relevant window or filter in your log tool first.",
  },
  {
    q: "Is my log uploaded?",
    a: "No. Logs are analyzed entirely in your browser. This is the safe way to inspect a log that contains live user data or internal endpoint names.",
  },
  {
    q: "Can I share the summary?",
    a: "Yes — Copy Report produces a plain-text summary (totals, level counts, error groups) and Download saves it. Raw log lines are never sent anywhere.",
  },
] as const;

export default function LogAnalyzerPage() {
  return (
    <>
      <LogAnalyzerWorkbench activeHref="/log-analyzer" />
      <ToolSeoContent
        path="/log-analyzer"
        summary="Analyze log files in seconds — paste your logs and get level counts, deduplicated error groups and an hourly timeline. Runs locally, so server logs never leave your machine."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Copy the log lines you care about (any size up to 50,000 lines).",
            "Paste them into the editor — analysis updates as you type.",
            "Read the summary chips: total lines, errors, unique error groups.",
            "Flip between Levels, Error groups and Timeline to dig in.",
          ]}
        />

        <Section title="What log analysis delivers">
          <Bullets
            items={[
              "Per-level counts — FATAL, ERROR, WARN, INFO, DEBUG, TRACE, plus an unknown bucket for unprefixed lines.",
              "Deduplicated error groups with occurrence counts, not 400 copies of the same stack line.",
              "An hourly timeline (UTC) separating all lines, errors and warnings to surface spikes.",
              "Message extraction from JSON logs, level-prefixed lines, nginx access logs and plain text.",
            ]}
          />
        </Section>

        <Section title="How to analyze logs online">
          <Bullets
            items={[
              "Paste a representative window of your log, not a trimmed stub — grouping is more useful at volume.",
              "Check the Levels tab for the overall mix, then Errors to see what actually repeats.",
              "Use Timeline when you suspect a time-correlated problem (deploys, cron, traffic peaks).",
              "Copy Report into your incident doc or GitHub issue for a shareable summary.",
            ]}
          />
          <Example
            input={`2026-08-30T08:02:45.000Z ERROR Rejected order 4815: stock unavailable\n2026-08-30T08:03:11.900Z ERROR Rejected order 1022: stock unavailable`}
            output={`Rejected order *: stock unavailable  (2x)`}
            inputLabel="Raw error lines"
            outputLabel="Grouped summary"
          />
        </Section>

        <Section title="Who analyzes logs — and when">
          <UseCases
            cases={[
              {
                title: "Incident triage",
                body: "You have a 5,000 line tail and ten minutes. Paste it, find the one error that repeats 400 times, and chase it instead of the noise.",
              },
              {
                title: "Verifying a deploy",
                body: "Compare error groups before and after a rollout to confirm the change introduced (or fixed) specific failures.",
              },
              {
                title: "Privacy-safe log sharing",
                body: "Because analysis is local, you can inspect logs that contain customer data instead of redacting them for an online tool.",
              },
            ]}
          />
        </Section>

        <Section title="When analysis looks off">
          <Troubleshooting
            items={[
              {
                error: "Everything lands in one bucket",
                cause: "Level-less log formats (like pure access-log lines with only an IP and status) have no recognizable level label.",
                fix: "Paste into Levels and accept the UNKNOWN bucket, or switch to the Timeline view which works off timestamps alone.",
              },
              {
                error: "Two errors that look different grouped together",
                cause: "Normalized grouping strips IDs/numbers on purpose so repeats collapse.",
                fix: "Check the raw log line for the true distinguishing field — grouping only needs to flag 'likely the same problem'.",
              },
              {
                error: "Empty timeline",
                cause: "No timestamps were detected in RFC-3339 or nginx access-log form.",
                fix: "Use the Epoch/millisecond columns of your log, or convert timestamps with the Timestamp tool first.",
              },
            ]}
          />
        </Section>

        <Section title="Pro tips">
          <ProTips
            tips={[
              "Parse a tail -f window rather than the whole file when hunting recent incidents — the analyzer is fast, but focused slices make the summary clearer.",
              "Pair with the Stack Trace analyzer: copy an error group's stack out of the Raw log and clean it there.",
              "The summary report downloads as plain text — pipe it straight into Slack or a ticket.",
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