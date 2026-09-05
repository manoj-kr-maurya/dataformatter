import type { Metadata } from "next";
import Link from "next/link";
import { EnvValidatorWorkbench } from "@/components/devtools/env-validator-workbench";
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

export const metadata: Metadata = buildMetadata("/env-validator");

const faqs = [
  {
    q: "What does the validator check?",
    a: "Every line of your .env file: invalid key names, empty values, duplicate keys, stray spaces before/after the key, spaces around the equals sign, and lines that aren't a comment, blank line or KEY=VALUE pair. Values are never logged or sent anywhere.",
  },
  {
    q: "Why would I use Compare A vs B?",
    a: "To check your local .env against your .env.example (or a teammate's). You get three lists: keys in the example that are missing from your file, keys that exist only in yours, and keys whose values differ.",
  },
  {
    q: "Are secrets shown in the output?",
    a: "The diff lists key names and (truncated) values, and the report you copy/download names keys but never values unless a value differs from the example. Real secret values are never transmitted anywhere.",
  },
  {
    q: "What counts as an invalid name?",
    a: "dotenv-compatible names: start with a letter or underscore, then letters, digits and underscores. Lines like 123=value or MY-KEY=value are flagged invalid.",
  },
  {
    q: "Does it catch duplicate keys?",
    a: "Yes — and this is the dangerous one, because most loaders silently keep the last occurrence. The validator flags every definition of a key that appears more than once.",
  },
  {
    q: "Can it read export-prefixed lines?",
    a: "Yes. Lines like export NODE_ENV=production are parsed too (the export keyword is stripped), matching what dotenv with export support and shell sourcing do.",
  },
] as const;

export default function EnvValidatorPage() {
  return (
    <>
      <EnvValidatorWorkbench activeHref="/env-validator" />
      <ToolSeoContent
        path="/env-validator"
        summary="Validate and compare .env files in your browser. Check syntax and duplicates, then diff your local secrets against your .env.example — all locally, nothing uploaded."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Paste your .env contents into File A (validation runs instantly).",
            "Review line-by-line findings, or switch to Compare A vs B and paste your .env.example into File B.",
            "Use the three diff lists: missing keys, extra keys, and changed values.",
            "Copy or download the report for your team or a ticket.",
          ]}
        />

        <Section title="What ENV validation catches">
          <Bullets
            items={[
              "Duplicate keys — most loaders keep only the last value; your config is silently wrong.",
              "Empty values like API_KEY= that often mean a missing secret, not an intentional blank.",
              "Spaces around the equals (KEY = value) — tolerated by some parsers, rejected by others.",
              "Invalid names — leading digits, hyphens and other characters that engines refuse or mangle.",
              "Stray leading/trailing whitespace that shifts the key or the value unexpectedly.",
              "Lines that are neither a KEY=VALUE pair, a comment, nor blank.",
            ]}
          />
        </Section>

        <Section title="Who validates .env files — and when">
          <UseCases
            cases={[
              {
                title: "Before you push .env.example",
                body: "Run the diff against your local file to guarantee the example lists every key you actually use — and nothing stale.",
              },
              {
                title: "Mysterious config drift",
                body: "Production behaves differently from your laptop. Diff your local .env against the deployed file (via a safe channel) and find the changed key.",
              },
              {
                title: "Onboarding a new team member",
                body: "Send them the validator findings window as the checklist: add these keys, remove these, fix these values.",
              },
            ]}
          />
        </Section>

        <Section title="When the report looks odd">
          <Troubleshooting
            items={[
              {
                error: "\"Duplicate key\" you didn't expect",
                cause: "The same key appears twice — maybe once in an export NODE_ENV=… line and once plain, or across two pasted stanzas.",
                fix: "Search the file for the key name and merge the duplicates; keep the last occurrence's value.",
              },
              {
                error: "Spaces-around-equals on a health check line",
                cause: "Some generators emit KEY = value with spaces, which this validator flags as fragile.",
                fix: "Normalize to KEY=value — jjdotenv and most runtimes accept only the tight form.",
              },
              {
                error: "A line you expect to be valid is flagged unquoted",
                cause: "Values containing # comments or spaces benefit from quotes; without them parsing is ambiguous.",
                fix: "Wrap the value in double quotes and escape inner quotes/backslashes as your runtime expects.",
              },
            ]}
          />
        </Section>

        <Section title="Pro tips">
          <ProTips
            tips={[
              "Always keep the example file in sync — the diff is only as honest as the source of truth.",
              "Diff before a deploy to catch a key you added in code but never put in CI environments.",
              "Pair with the Fake Data generator for non-secret placeholders you need to fill mock config.",
              "The validator runs locally, so real tokens and connection strings are safe to paste.",
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