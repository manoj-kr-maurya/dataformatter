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
    a: "It's built for code: binary/hex/octal literals in arithmetic, radix conversion with signed-width masking, byte counting with UTF-8 hex and Base64 output, percent math, and CRC-32 hashing. No eval() is ever used — expressions run through a small operator-precedence parser.",
  },
  {
    q: "Can I use 0xFF and 0b1010 in expressions?",
    a: "Yes. The expression tab accepts decimal, hex (0x), binary (0b) and octal (0o) integer literals alongside + - * / % ** and parentheses, following standard precedence.",
  },
  {
    q: "What does signed width mean in Radix mode?",
    a: "Masking a value to 8/16/32 bits shows what C-style casts and bitwise operations actually produce at that width — useful for byte arithmetics, checksums and register work.",
  },
  {
    q: "What does Bytes mode measure?",
    a: "UTF-8 byte length of your text plus its hex dump and Base64 encoding — so you can predict payload sizes before you send them.",
  },
  {
    q: "Is CRC-32 deterministic?",
    a: "Yes — it's the standard IEEE 802.3 CRC-32 (polynomial 0xEDB88320), and it always returns the same unsigned 32-bit value for the same text, which makes it handy for quick equality checks.",
  },
  {
    q: "Is anything uploaded?",
    a: "No. Every calculation runs locally in your browser, including the CRC-32 hash — safe even for code fragments and secret samples.",
  },
] as const;

export default function DevCalcPage() {
  return (
    <>
      <DevCalcWorkbench activeHref="/developer-calculator" />
      <ToolSeoContent
        path="/developer-calculator"
        summary="A calculator built for developers: evaluate expressions with hex/binary literals, convert between radices, measure byte size, do percent math and compute CRC-32 — all locally."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Start on the Expression tab with a literal like 0xFF * 4.",
            "Hit Radix to see any decimal/hex/binary/octal number in all four bases.",
            "Use Bytes on API payloads to predict request size before sending.",
            "Grab a CRC-32 when you need a quick content fingerprint.",
          ]}
        />

        <Section title="What the developer calculator does">
          <Bullets
            items={[
              "Arithmetic with + - * / % **, parens and 0x/0b/0o literals.",
              "Radix conversion: decimal, hex, binary, octal plus optional 8/16/32-bit masking and the printable ASCII character.",
              "UTF-8 byte length, hex dump and Base64 for any text.",
              "Percent math: 'A is what percent of B?' with zero-guarding.",
              "CRC-32 hashing returning the unsigned 32-bit integer and its hex form.",
            ]}
          />
        </Section>

        <Section title="How to use it in your workflow">
          <Bullets
            items={[
              "Size an API body with Bytes, then trim it to fit your limit.",
              "Convert a device register value to hex with a 16-bit mask.",
              "Check 'phase B is what percent of phase A' when planning time estimates.",
              "Fingerprint two payloads with CRC-32 to confirm byte-identical content.",
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
                body: "Masked radix output reveals what an 8-bit signed cast does to a value that 'looks fine' in decimal.",
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
                cause: "Radix conversion is defined for non-negative integers only (two's-complement formatting is out of scope).",
                fix: "Mask with a signed width to see the width-truncated representation instead.",
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
              "Percent mode guards against B=0 with a clear message instead of NaN.",
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