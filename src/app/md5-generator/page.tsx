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

export const metadata: Metadata = buildMetadata("/md5-generator");

const faqs = [
  {
    q: "What is an MD5 hash?",
    a: "MD5 is a 128-bit cryptographic hash function that produces a fixed 32-character hexadecimal string from any input. It is one-way: you cannot recover the original text from the digest.",
  },
  {
    q: "Is MD5 secure?",
    a: "No — MD5 is cryptographically broken for security purposes. It is still widely used for non-security jobs like checksums, deduplication keys and legacy validations, which is exactly what this tool generates it for.",
  },
  {
    q: "How is the hash computed?",
    a: "Your input is encoded as UTF-8 and hashed locally in your browser using a pure JavaScript implementation — no server involved, so passwords and sensitive text never leave your machine.",
  },
  {
    q: "Does the same text always produce the same MD5?",
    a: "Yes, MD5 is deterministic: identical input bytes always produce the identical digest. That's what makes it useful for comparing two values without revealing them.",
  },
  {
    q: "Can an MD5 hash be reversed?",
    a: "No algorithm can reverse a hash directly. Lookup services only try to match your digest against precomputed tables of common passwords — unique or random input has no such shortcut.",
  },
  {
    q: "Which algorithm should I use instead for security?",
    a: "SHA-256 or stronger. The SHA-256 Generator, the full Hash Generator workspace and the Cryptography Tools hub all compute the stronger families locally.",
  },
] as const;

export default function Md5GeneratorPage() {
  return (
    <ToolLandingPage
      path="/md5-generator"
      summary="Generate an MD5 checksum of any text instantly — a 32-character lowercase hex digest, recomputed as you type. The hash is calculated in your browser, so the text you paste never leaves the page. Free and no signup."
    >
      <EmbeddedWorkspace mode="MD5_HASH" label="MD5 generator editor" />
      <QuickStart
        steps={[
          "Paste or type the text you want to hash into the editor above.",
          "The 32-character MD5 digest appears instantly in the output pane.",
          "Use Copy to grab the hash, or Download to save it as a .txt file.",
          "Compare it against a reference digest — identical inputs produce identical MD5.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="How MD5 works here">
        <Bullets
          items={[
            "Your input is read as UTF-8, then hashed with the standard MD5 algorithm.",
            "Output is always 32 lowercase hex characters, regardless of input length.",
            "The same input bytes always produce the same digest (deterministic).",
            "Hashing is one-way — nothing here can reverse a digest back into your text.",
            "The whole computation runs locally; nothing is uploaded.",
          ]}
        />
      </Section>

      <Section title="MD5 example">
        <Example
          input="hello world"
          output="5eb63bbbe01eeed093cb22bb8f5acdc3"
          inputLabel="Input text"
          outputLabel="MD5 digest"
        />
      </Section>

      <Section title="Handy for">
        <UseCases
          cases={[
            {
              title: "Comparing values without revealing them",
              body: "Hash two inputs and compare digests: equal text gives equal hashes, so you can verify a match without ever sharing or storing the original.",
            },
            {
              title: "Legacy checksums and integrations",
              body: "Older systems and vendor tools still verify MD5 checksums. Compute the reference digest for a small string the same way those tools expect.",
            },
            {
              title: "Deduplication keys",
              body: "A stable, compact key from a longer string — MD5's fixed 32-character output works well for short non-security keys.",
            },
          ]}
        />
      </Section>

      <Section title="MD5 gotchas">
        <Troubleshooting
          items={[
            {
              error: "My hash doesn't match a reference MD5 online",
              cause: "Usually a whitespace or encoding difference — a trailing newline, or the other tool hashing hex/bytes instead of text.",
              fix: "Paste both versions into the editor and compare byte-for-byte; also confirm the reference hashes the raw text, not a file with a trailing newline.",
            },
            {
              error: "Someone told me MD5 is broken — why do I still see it?",
              cause: "MD5 is collision-broken: attackers can craft two different inputs with the same hash. For integrity against deliberate tampering it's unsafe.",
              fix: "Use SHA-256 for anything security-sensitive; keep MD5 for non-adversarial checksums and dedupe only.",
            },
            {
              error: "Can I use this to crack a password hash?",
              cause: "No — this tool hashes forward only. There is no reverse lookup here, by design.",
              fix: "If you need to verify a stored (salted) password, hash the candidate yourself and compare with a secure, salted scheme.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "The digest updates as you type — no button to press.",
            "Pair it with a SHA-256 or SHA-3 digest from the same workspace to stay on secure algorithms.",
            "For file checksums, hash the file content instead of your own annotation around it.",
            "Because hashing is local, real password policy or API keys are safe to paste for a one-off check.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}