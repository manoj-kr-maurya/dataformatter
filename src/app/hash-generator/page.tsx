import type { Metadata } from "next";
import Link from "next/link";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import {
  Section,
  Bullets,
  Faq,
  FaqJsonLd,
  Example,
  QuickStart,
  UseCases,
  Troubleshooting,
  CompareTable,
  Glossary,
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/hash-generator");

const faqs = [
  {
    q: "Which hash algorithms are supported?",
    a: "MD5, SHA-1, SHA-224, SHA-256, SHA-384 and SHA-512 (the SHA-2 family), plus the newer SHA-3 family: SHA3-224/256/384/512 and the shorter SHA-512/224 and SHA-512/256 variants.",
  },
  {
    q: "Which algorithm should I use?",
    a: "SHA-256 is the safe default for checksums and integrity checks. MD5 and SHA-1 are fast but cryptographically broken — fine for non-security deduplication, not for verifying untrusted data.",
  },
  {
    q: "Can I use this to store passwords?",
    a: "No. Plain hashes are designed to be fast, which makes them weak against brute force. Use a dedicated password hashing scheme such as bcrypt, scrypt or Argon2 in your application.",
  },
  {
    q: "Why does my hash differ from another tool's?",
    a: "Almost always hidden input differences: a trailing newline your editor added, CRLF instead of LF line endings, or comparing a hex digest against raw bytes. Match the exact input bytes first.",
  },
  {
    q: "Is it safe to hash secrets here?",
    a: "Hashing runs entirely in your browser — nothing is transmitted. Still, as with any browser tool, avoid processing credentials that would be catastrophic if exposed on a shared screen.",
  },
] as const;

export default function HashGeneratorPage() {
  return (
    <ToolLandingPage
      path="/hash-generator"
      summary="Generate MD5, SHA-256 and other hash digests of any text online. Pick an algorithm in the live tool below — every digest is computed locally in your browser, nothing is uploaded."
    >
      <EmbeddedWorkspace mode="SHA256_HASH" label="Hash generator editor" />
      <QuickStart
        steps={[
          "Paste or type the text above — SHA-256 is selected by default.",
          "The hex digest updates instantly as you edit.",
          "Switch algorithms any time from the tool menu; Copy grabs the digest.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="What is a hash?">
        <p>
          A hash function converts input of any size into a fixed-length fingerprint called a
          digest. The same input always produces the same digest, while changing even one
          character produces a completely different one. Hashes are one-way — you cannot recover
          the original text from the digest.
        </p>
        <Example
          input="Hello, DataFormatter!"
          output="6c074e71…(64 hex characters)"
          outputLabel="SHA-256 digest"
        />
      </Section>

      <Section title="How to generate a hash online">
        <Bullets
          items={[
            "Paste your text into the editor above — SHA-256 is selected by default.",
            "Switch algorithms from the tool menu for MD5, SHA-1, SHA-2 or SHA-3 variants.",
            "The hex digest appears instantly; copy it with one click.",
            "Hashes are computed locally — sensitive input never leaves your machine.",
          ]}
        />
      </Section>

      <Section title="Where checksums matter day to day">
        <UseCases
          cases={[
            {
              title: "Verifying downloads",
              body: "Publishers post SHA-256 checksums next to releases. Hash the file's text content or manifest here to confirm what you received is what was shipped.",
            },
            {
              title: "Cache keys & deduplication",
              body: "Long payloads make unwieldy cache keys. A SHA-256 digest gives you a fixed-size fingerprint that changes whenever content does.",
            },
            {
              title: "Comparing without exposing",
              body: "Need to know if two texts match without pasting either into chat? Compare their digests instead — identical inputs always produce identical hashes.",
            },
          ]}
        />
      </Section>

      <Section title="Choosing an algorithm">
        <CompareTable
          headers={["Algorithm", "Digest length", "Status today"]}
          rows={[
            ["MD5", "128-bit", "Broken for security — acceptable for legacy checksums only"],
            ["SHA-1", "160-bit", "Collision attacks demonstrated — migrate away"],
            [
              "SHA-256 / SHA-512",
              "256 / 512-bit",
              <>
                The current standard for integrity — also used inside{" "}
                <Link href="/jwt-decoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                  JWT signing
                </Link>{" "}
                (HS/RS families)
              </>,
            ],
            ["SHA-3 family", "224–512-bit", "Modern alternative with a different internal design than SHA-2"],
          ]}
          caption="Supported hash algorithms and their recommended uses"
        />
      </Section>

      <Section title="When hashes don't match">
        <Troubleshooting
          items={[
            {
              error: "My digest differs from the published checksum",
              cause: "Hidden byte differences: editors appending a trailing newline, Windows CRLF line endings, or BOM characters at the start of a file.",
              fix: "Strip the final newline (Restore Original helps compare), normalise line endings, then re-hash. The input must match byte-for-byte.",
            },
            {
              error: "Hash matches locally but not in production",
              cause: "One side is hashing raw bytes while the other hashes a hex string of those bytes, or encodings differ (UTF-8 vs UTF-16).",
              fix: "Confirm both sides operate on identical UTF-8 bytes before hashing, then compare hex-to-hex.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Generate strong passphrases to protect hashed archives with the Password Generator in String Functions.",
            "Need unique identifiers rather than fingerprints? The UUID Generator produces collision-resistant IDs.",
            "Split view lets you keep reference text and candidate variants visible while checking digests.",
            "Share links encode workspace state — useful for showing a colleague exactly which input produced a digest.",
          ]}
        />
      </Section>

      <Section title="Hashing glossary">
        <Glossary
          terms={[
            {
              term: "Checksum",
              definition:
                "A digest published alongside data so recipients can verify integrity. Recompute the hash of what you received and compare: matching digests mean the bytes survived transport unchanged.",
            },
            {
              term: "Digest",
              definition:
                "The fixed-length output of a hash function, usually written as hexadecimal. SHA-256 digests are 256 bits — 64 hex characters — regardless of whether the input was one word or a whole book.",
            },
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
