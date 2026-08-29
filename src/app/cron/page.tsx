import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import {
  Section,
  Bullets,
  Faq,
  FaqJsonLd,
  Example,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { CronWorkbench } from "@/components/devtools/cron-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/cron");

const faqs = [
  {
    q: "What cron syntax is supported?",
    a: "The standard five fields (minute hour day-of-month month day-of-week) plus a six-field variant with a leading seconds column. Lists, ranges (1-5), steps (*/15 or 0-30/10), both * and ? wildcards, and month/day name shortcuts like JAN or mon all work.",
  },
  {
    q: "What does the description actually compute?",
    a: "It renders your expression as prose — for example 'at 02:30 every day' or 'every 20 seconds'. It's generated from the parsed fields, so it always matches exactly what the expression means.",
  },
  {
    q: "Why do my runs differ from other calculators?",
    a: "Two reasons: this tool is time-zone aware (DST transitions are handled by matching local wall time, skipping nonexistent hours and avoiding repeats), and the day-of-month + day-of-week rules follow Vixie cron semantics, where either field matching is enough when both are set.",
  },
  {
    q: "How are DST transitions handled?",
    a: "Runs are computed against the local wall clock of your selected zone. During spring-forward a 02:30 job simply doesn't fire; during fall-back it fires once even though the hour repeats in real time.",
  },
  {
    q: "Can I see runs in my own time zone?",
    a: "Yes. Every scheduled run is listed both in the selected zone and in your browser's local time, with date, weekday and 24-hour clock.",
  },
  {
    q: "Is anything uploaded?",
    a: "No. Parsing, describing and scheduling all run in your browser. The expression never leaves the page.",
  },
] as const;

export default function CronPage() {
  return (
    <ToolLandingPage
      path="/cron"
      summary="Read, validate and schedule cron expressions in your browser. Paste any 5- or 6-field expression to get a plain-English description plus the next (or previous) runs in any time zone."
    >
      <CronWorkbench />
      <QuickStart
        steps={[
          "Type or paste a cron expression (like 30 2 * * *).",
          "Read the plain-English description to confirm you said what you meant.",
          "Pick a time zone — or keep UTC — and choose Next or Previous runs.",
          "Scan the table; every row also shows your local time.",
          "Copy the runs or the description into your ticket or CI config comment.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="Cron syntax this tool reads">
        <Bullets
          items={[
            "Century-safe five-field input: minute (0-59), hour (0-23), day-of-month (1-31), month (1-12), day-of-week (0-7 with 0 and 7 both Sunday).",
            "Optional sixth leading seconds field — useful for 6-field Quartz/Node-schedule style jobs.",
            "Name shortcuts: JAN…DEC for months, SUN…SAT for weekdays (case-insensitive).",
            "Ranges 1-5, steps */15, combined lists 0,15,30,45, and the ? wildcard treated like *.",
            "DST-safe scheduling — a 16:00 UTC run stays 16:00 UTC across a 21:00 CET summer/winter change.",
          ]}
        />
      </Section>

      <Section title="How to check a cron expression online">
        <Bullets
          items={[
            "Paste an expression straight from a crontab, GitHub Actions schedule, or a code constant.",
            "Confirm the prose description — this catches the classic swapped day-of-week / day-of-month divergence.",
            "Switch zone to verify a job you configured for users elsewhere actually runs at a sane hour there.",
            "Copy the run list as plain text for docs or an excuse-free ticket.",
          ]}
        />
        <Example
          input={"30 2 * * *"}
          output={"At 02:30 every day (second 0)."}
          inputLabel="Cron expression"
          outputLabel="Plain-English description"
        />
      </Section>

      <Section title="Who checks cron expressions — and when">
        <UseCases
          cases={[
            {
              title: "Verifying before you deploy",
              body: "A mailer job set for '5 * * * *' runs 24 times a day. The description would've told you that the moment you typed it — check before the first at-scale run, not after.",
            },
            {
              title: "Coordinating with remote teams",
              body: "Your batch job must hit a database that Pauses between 00:00-01:00 Europe/Paris. Pick that zone and see exactly when it fires.",
            },
            {
              title: "Learning cron grammar",
              body: "Try presets, watch the prose change, and get an intuition for steps, lists and ranges without consulting man pages.",
            },
          ]}
        />
      </Section>

      <Section title="When runs look wrong">
        <Troubleshooting
          items={[
            {
              error: "\"Every minute\" fires fewer times than expected",
              cause: "A six-field expression with a seconds value other than 0 narrows the window (e.g. */20 seconds runs every 20 seconds, not every minute).",
              fix: "Check the leading field; toggle Include seconds to see what the 6th column is doing.",
            },
            {
              error: "A 02:30 Europe/Paris job is missing one spring day",
              cause: "DST: 02:00-03:00 doesn't exist on that date, so the job cannot run.",
              fix: "That's correct behavior — most schedulers skip it too. Pick an hour outside the gap if it matters.",
            },
            {
              error: "Job fires on unexpected weekday",
              cause: "Day-of-month and day-of-week are OR'd when both are specified (Vixie semantics), so '0 0 13 * 5' fires Friday AND the 13th.",
              fix: "Use a guard inside the job, or move to a single day column with an explicit range.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Presets are one click — 'Every minute', 'Daily 02:30', 'Weekdays 08:15' — then edit from there.",
            "Combine with the Timestamp tool to verify the exact UTC instant of a tricky run.",
            "The description text copies cleanly into READMEs and CI comment blocks.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}