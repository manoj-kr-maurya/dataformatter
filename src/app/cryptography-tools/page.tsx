import type { Metadata } from "next";
import Link from "next/link";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { HubContent } from "@/components/seo/hub-content";
import { CRYPTOGRAPHY_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/cryptography-tools");

const faqs = [
  {
    q: "Which hash algorithms does this workspace cover?",
    a: "The full MD5, SHA-1, SHA-2 (224/256/384/512) and SHA-3 (224/256/384/512) families, plus the truncated SHA-512/224 and SHA-512/256 variants — sixteen digests computed locally as you type.",
  },
  {
    q: "Is hashing the same as encryption?",
    a: "No. Hashing is one-way: digests can't be reversed into the original text. Encryption is two-way and requires a key. These tools only hash — that's exactly why they're safe for verifying data without exposing it.",
  },
  {
    q: "Which algorithm is secure for integrity checks?",
    a: "SHA-256 or stronger. MD5 and SHA-1 remain useful for legacy checksums and deduplication but are considered cryptographically broken against deliberate attacks.",
  },
  {
    q: "Can I crack or reverse a hash here?",
    a: "No, and no legitimate tool can: hashes are one-way functions. Lookup services merely compare against precomputed tables; unique inputs have no such shortcut.",
  },
] as const;

export default function CryptographyToolsPage() {
  return (
    <>
      <DevToolsShell
        tools={CRYPTOGRAPHY_TOOL_ORDER}
        activeHref="/cryptography-tools"
        heading="Cryptography Tools"
      />
      <HubContent
        path="/cryptography-tools"
        intro={
          <>
            <h2 className="text-xl font-semibold tracking-tight">Every common digest, computed on your machine</h2>
            <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
              Verifying a download, comparing payloads without exposing them, generating fingerprints
              for cache keys — hashing answers all of these. This workspace computes every mainstream
              digest family right in your browser, so sensitive input never crosses the network.
              Choose an algorithm from the rail and paste your text.
            </p>
          </>
        }
        tableHeaders={["Family", "Digest sizes", "Use today"]}
        tableCaption="Supported hash algorithm families and their recommended uses"
        tableRows={[
          ["MD5", "128-bit", "Legacy checksums and non-security deduplication"],
          ["SHA-1", "160-bit", "Verify old signatures only — deprecated for new designs"],
          [
            <>
              <Link key="hg" href="/hash-generator" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                Quick SHA-256 workflow
              </Link>
            </>,
            "224 / 256 / 384 / 512-bit",
            "The default choice for integrity checks and signatures",
          ],
          ["SHA-3", "224 / 256 / 384 / 512-bit", "Modern alternative with different internal construction than SHA-2"],
          ["SHA-512/224 & 512/256", "Truncated variants", "Match output length to constrained formats"],
          [
            "Token debugging",
            <>
              Inspect signed tokens with the{" "}
              <Link key="jwt" href="/jwt-decoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                JWT Decoder
              </Link>
            </>,
            "—",
          ],
        ]}
        faqs={faqs}
      />
    </>
  );
}
