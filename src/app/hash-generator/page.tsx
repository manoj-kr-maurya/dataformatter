import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import { Section, Bullets, Faq, FaqJsonLd, Example } from "@/components/seo/content-blocks";
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
] as const;

export default function HashGeneratorPage() {
  return (
    <ToolLandingPage
      path="/hash-generator"
      summary="Generate MD5, SHA-256 and other hash digests of any text online. Pick an algorithm in the live tool below — every digest is computed locally in your browser, nothing is uploaded."
    >
      <EmbeddedWorkspace mode="SHA256_HASH" label="Hash generator editor" />
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

      <Section title="Common uses">
        <Bullets
          items={[
            "Verifying file or payload integrity with a published checksum",
            "Building cache keys and deduplicating content",
            "Comparing two texts byte-for-byte without exposing them",
            "Learning how different algorithms change digest length and output",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
