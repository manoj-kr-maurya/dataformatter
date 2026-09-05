import type { Metadata } from "next";
import Link from "next/link";
import { DevCalcWorkbench } from "@/components/devtools/devcalc-workbench";
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

export const metadata: Metadata = buildMetadata("/developer-calculator");

const faqs = [
  {
    q: "What's different from a normal calculator?",
    a: "It's built for code: hex/binary/octal literals, bitwise operators and two's complement, IEEE-754 float layout, bit-width masking, byte and encoding sizes, IPv4 CIDR math, JSON size, plus performance, bandwidth, storage, cache and queue estimators. No eval() is ever used — everything runs through small operator-precedence parsers.",
  },
  {
    q: "Can I use 0xFF and 0b1010 in expressions?",
    a: "Yes. The expression tab accepts decimal, hex (0x), binary (0b) and octal (0o) integer literals alongside + - * / % ** and parentheses, following standard precedence.",
  },
  {
    q: "What does signed width mean in Radix mode?",
    a: "Masking a value to 8/16/32 bits shows what C-style casts and bitwise operations actually produce at that width — useful for byte arithmetics, checksums and register work. The Two's complement tool shows the full signed representation for any width.",
  },
  {
    q: "What does Bytes mode measure?",
    a: "UTF-8 byte length of your text plus its hex dump and Base64 encoding — so you can predict payload sizes before you send them. The Data-size tool converts between KB/MB/GB (decimal) and KiB/MiB/GiB (binary) exactly.",
  },
  {
    q: "How do the estimator tools work?",
    a: "Concurrency uses Little's law (RPS × latency), bandwidth is RPS × request+response size, and the storage/cache/queue tools apply your replication, growth, retention and overhead inputs with the math shown in the UI. They're planning estimates, not guarantees.",
  },
  {
    q: "Is CRC-32 deterministic?",
    a: "Yes — it's the standard IEEE 802.3 CRC-32 (polynomial 0xEDB88320), and it always returns the same unsigned 32-bit value for the same text, which makes it handy for quick equality checks.",
  },
  {
    q: "Is anything uploaded?",
    a: "No. Every calculation runs locally in your browser, including the CRC-32 hash and your calculation history — safe even for code fragments and secret samples.",
  },
] as const;

export default function DevCalcPage() {
  return (
    <>
      <DevCalcWorkbench activeHref="/developer-calculator" />
      <ToolSeoContent
        path="/developer-calculator"
        summary="A calculator built for developers: expressions with hex/binary literals, bitwise math, two's complement, IEEE-754 floats, byte and JSON sizes, IPv4 CIDR, timestamps, and performance, bandwidth, storage and cache estimators — all locally."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Start on the Expression tab with a literal like 0xFF * 4.",
            "Hit Radix to see a number in all four bases, or Two's complement for signed widths.",
            "Use Bytes on API payloads to predict request size before sending.",
            "Estimate concurrency, bandwidth or cache memory as you plan a service.",
            "Grab a CRC-32 when you need a quick content fingerprint.",
          ]}
        />

        <Section title="What the developer calculator does">
          <Bullets
            items={[
              "Arithmetic with + - * / % **, parens, 0x/0b/0o literals, functions (sqrt, log, min, max…), constants and scientific notation.",
              "Bitwise operator parser (& | ^ ~ << >> >>>) with width masking, integer-type ranges (Int8…UInt64), two's complement and overflow flags.",
              "IEEE-754 float32/float64 bit layout: sign, exponent, mantissa, subnormals, infinity and NaN.",
              "Data size in decimal vs binary units, JSON size (pretty vs minified), encoding sizes (UTF-8/16, hex, Base64, URL).",
              "Timestamps & durations, IPv4 CIDR ranges, statistics and percentiles, string analysis.",
              "Percent math and CRC-32 hashing returning the unsigned 32-bit integer and its hex form.",
            ]}
          />
        </Section>

        <Section title="How to use it in your workflow">
          <Bullets
            items={[
              "Size an API body with Bytes, then trim it to fit your limit.",
              "Check an 8-bit signed cast with Two's complement or a 192.168.1.0/24 subnet with CIDR.",
              "Validate a bump to 120ms average latency: concurrency = RPS × latency.",
              "Confirm two config blobs are byte-identical with CRC-32.",
            ]}
          />
          <Example
            input={"0xFF + 1"}
            output={"256"}
            inputLabel="Expression with hex literal"
            outputLabel="Evaluated result"
          />
        </Section>

        <Section title="Who reaches for a dev calculator — and when">
          <UseCases
            cases={[
              {
                title: "Estimating payload sizes",
                body: "A JSON body that lives in Bytes mode for 30 seconds tells you whether it'll fit in a 1KB webhook or needs chunking before you ship it.",
              },
              {
                title: "Byte-level debugging",
                body: "Masked radix output reveals what an 8-bit signed cast does to a value that 'looks fine' in decimal; the float tool shows why 0.1 + 0.2 isn't 0.3.",
              },
              {
                title: "Capacity planning",
                body: "Put realistic RPS and latency into Performance, or a key count and value size into Cache, to sanity-check your sizing before you scale.",
              },
              {
                title: "Sanity-checking hashes",
                body: "Compare CRC-32 of two config blobs to confirm whether a deploy artifact actually changed.",
              },
            ]}
          />
        </Section>

        <Section title="When numbers surprise you">
          <Troubleshooting
            items={[
              {
                error: "Radix mode refuses a negative number",
                cause: "Radix conversion is defined for non-negative integers only.",
                fix: "Mask with a signed width to see the width-truncated representation, or use the Two's complement tool for the full signed view.",
              },
              {
                error: "Expression says 'Result is not finite'",
                cause: "Division by zero, or a huge exponent overflow.",
                fix: "Check for /0 and % 0 operands; use ** within a sane range.",
              },
              {
                error: "CRC-32 differs from another tool",
                cause: "Some tools output zlib (adler) or use a different polynomial, or print the signed 32-bit interpretation.",
                fix: "Compare against this tool's unsigned value; note that standard CRC-32 does not seed with the standard init in a few legacy tools.",
              },
            ]}
          />
        </Section>

        <Section title="Pro tips">
          <ProTips
            tips={[
              "Radix accepts a 0x/0b/0o prefix directly, so paste-what-you-copy works from docs.",
              "Percentage mode guards against B=0 with a clear message instead of NaN.",
              "Estimator tools show the exact formula under the results, so the numbers are auditable.",
              "Calculation history is stored only in your browser — clear it from the History tab.",
              "CRC-32 runs locally — use it on files you'd never upload to a public hash site.",
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