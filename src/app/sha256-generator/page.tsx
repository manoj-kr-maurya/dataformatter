import type { Metadata } from "next";
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
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/sha256-generator");

const faqs = [
  {
    q: "What is a SHA-256 hash?",
    a: "SHA-256 is a member of the SHA-2 family that produces a fixed 256-bit digest — 64 lowercase hex characters — from any input. It is one-way and collision-resistant, making it the standard choice for integrity checks.",
  },
  {
    q: "Is SHA-256 secure?",
    a: "Today, yes — SHA-256 shows no practical collision or preimage weakness and is the algorithm behind TLS certificates and most checksum tooling. It remains the sensible default for integrity and fingerprinting.",
  },
  {
    q: "How is the hash computed here?",
    a: "Your input is encoded as UTF-8 and hashed locally in your browser. There is no server in the pipeline, so the text you paste never leaves your machine.",
  },
  {
    q: "Does the same text always produce the same SHA-256?",
    a: "Yes — SHA-256 is deterministic. Identical input bytes always yield the identical 64-character digest, which is exactly why it works for comparing or fingerprinting data.",
  },
  {
    q: "How is SHA-256 different from MD5?",
    a: "Both are one-way hashes, but SHA-256 is far stronger: MD5 is collision-broken, SHA-256 is not. For anything security-sensitive, use SHA-256 — MD5 is only for legacy checksums.",
  },
  {
    q: "Can a SHA-256 hash be reversed?",
    a: "No. Hashing is one-way by design, and no algorithm can invert a 256-bit digest. A lookup against precomputed tables may only succeed for already-known inputs such as common passwords.",
  },
] as const;

export default function Sha256GeneratorPage() {
  return (
    <ToolLandingPage
      path="/sha256-generator"
      summary="Compute a SHA-256 hash of any text in seconds — a 64-character lowercase hex digest, updated as you type. Hashing runs entirely in your browser, so nothing you paste is ever uploaded. Free and no signup."
    >
      <EmbeddedWorkspace mode="SHA256_HASH" label="SHA-256 generator editor" />
      <QuickStart
        steps={[
          "Paste or type the text you want to hash into the editor above.",
          "The 64-character SHA-256 digest appears instantly in the output pane.",
          "Use Copy to grab the hash, or Download to save it as a .txt file.",
          "Compare it against a reference digest — identical inputs produce identical SHA-256.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="How SHA-256 works here">
        <Bullets
          items={[
            "Your input is read as UTF-8, then hashed with the standard SHA-256 algorithm.",
            "Output is always 64 lowercase hex characters, regardless of input length.",
            "The same input bytes always produce the same digest (deterministic).",
            "Hashing is one-way — nothing here can reverse a digest back into your text.",
            "The whole computation runs locally; nothing is uploaded.",
          ]}
        />
      </Section>

      <Section title="SHA-256 example">
        <Example
          input="hello world"
          output="b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
          inputLabel="Input text"
          outputLabel="SHA-256 digest"
        />
      </Section>

      <Section title="Handy for">
        <UseCases
          cases={[
            {
              title: "Verifying downloads and artifacts",
              body: "Compare the digest of a downloaded file's content against the checksum the publisher ships — matching digests mean the bytes arrived intact and untampered.",
            },
            {
              title: "Webhook and payload fingerprints",
              body: "Hash a payload side-by-side with the signature base your provider documents, or fingerprint cache keys and content versions without storing the original.",
            },
            {
              title: "Comparing secrets without exposing them",
              body: "Hash two candidate values and compare digests to confirm equality without ever printing or storing the originals — useful for parity checks on minimal data.",
            },
          ]}
        />
      </Section>

      <Section title="SHA-256 gotchas">
        <Troubleshooting
          items={[
            {
              error: "My digest doesn't match the reference I was given",
              cause: "Almost always a formatting difference: a trailing newline, a different encoding, or hashing hex/ASCII when the reference hashes raw bytes.",
              fix: "Re-paste both sources into the editor and compare exact bytes; for files, hash the file content itself, not a copy that added a newline.",
            },
            {
              error: "A tool asks for SHA-256 but I only see a 32-character hash",
              cause: "That's an MD5 digest — 32 hex characters vs SHA-256's 64. The two are not interchangeable.",
              fix: "Use this SHA-256 Generator for 64-character digests, or the MD5 Generator if the legacy format is genuinely required.",
            },
            {
              error: "Is pasting a hash or secret here safe?",
              cause: "Yes — hashing is one-way and runs locally, so the original text and the result never leave your machine.",
              fix: "Copy the result wherever you need it; no server has ever seen the input.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "The digest updates as you type — no button to press.",
            "Use the full Hash Generator or Cryptography Tools workspace for SHA-1, SHA-512 and the SHA-3 family too.",
            "For integrity checks, compare the whole digest visually or automate equality — SHA-256 is deterministic, so byte-for-byte equality settles it.",
            "Because hashing is local, real payloads or secrets are safe to hash here for a one-off check.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}