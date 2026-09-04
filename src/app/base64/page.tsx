import type { Metadata } from "next";
import Link from "next/link";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { HubContent } from "@/components/seo/hub-content";
import { BASE64_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/base64");

const faqs = [
  {
    q: "How do I convert an image to Base64?",
    a: "Pick Image → Base64 (or PNG/JPG variants) in the workspace above, paste or load the file, and copy the resulting data URI. The conversion happens locally — the image is never uploaded.",
  },
  {
    q: "What is a data URI?",
    a: "A data URI embeds file content directly in text form, e.g. data:image/png;base64,iVBOR…. Browsers render it like a normal URL, which is how small images get inlined into CSS and HTML.",
  },
  {
    q: "Why decode Base64 to JSON instead of plain text?",
    a: "APIs frequently Base64-wrap structured payloads. Decoding straight to pretty-printed JSON saves you a second formatting step when inspecting what was actually sent.",
  },
  {
    q: "Does converting hex or binary to Base64 change the data?",
    a: "No. Hex, binary, octal and Base64 are all textual representations of the same bytes. These converters re-encode the underlying bytes; nothing about the content changes.",
  },
  {
    q: "Is there a size limit for images?",
    a: "Processing runs at browser speed with no artificial cap, but very large files compete for the tab's memory. Inlined data URIs also grow ~33%, so keep embedded images small.",
  },
] as const;

export default function Base64Page() {
  return (
    <>
      <DevToolsShell tools={BASE64_TOOL_ORDER} activeHref="/base64" heading="Base64 Tools" />
      <HubContent
        path="/base64"
        intro={
          <>
            <h2 className="text-xl font-semibold tracking-tight">Base64 beyond plain text</h2>
            <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
              Plain-text encoding is only half the story. This hub handles the conversions developers
              actually stumble on in production: inlining images as data URIs, unwrapping
              Base64-encoded JSON payloads from APIs, and translating between hex, binary, octal and
              Base64 views of the same bytes. Load a file, paste a string, and every conversion stays
              on your machine.
            </p>
          </>
        }
        tableHeaders={["Task", "Best tool"]}
        tableCaption="Which Base64 tool to use for each conversion"
        tableRows={[
          [
            "Encode or decode plain text",
            <>
              <Link key="e" href="/base64-encoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                Base64 Encoder
              </Link>{" "}
              /{" "}
              <Link key="d" href="/base64-decoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                Base64 Decoder
              </Link>
            </>,
          ],
          ["Inline an image as a data URI", "Image/PNG/JPG → Base64"],
          ["Render a data URI back into a previewable image", "Base64 → Image"],
          ["Unwrap API payloads that arrive Base64-wrapped", "Base64 → JSON (pretty-printed)"],
          ["Embed XML, YAML, CSV or TSV documents in text channels", "Format → Base64"],
          ["Inspect byte-level values across representations", "Hex ⇄ Base64, Binary ⇄ Base64, Octal ⇄ Base64"],
        ]}
        faqs={faqs}
      />
    </>
  );
}
