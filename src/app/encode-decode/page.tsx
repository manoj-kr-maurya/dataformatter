import type { Metadata } from "next";
import Link from "next/link";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { HubContent } from "@/components/seo/hub-content";
import { ENCODE_DECODE_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/encode-decode");

const faqs = [
  {
    q: "What is the difference between encoding and encryption?",
    a: "Encoding (Base64, URL, HTML) changes how data is represented so it can travel safely — anyone can reverse it. Encryption requires a key and is designed so nobody without it can read the data. Nothing on this page encrypts.",
  },
  {
    q: "When does URL encoding matter?",
    a: "Whenever text becomes part of a link: query values containing spaces, & or emoji must be percent-encoded, or parsers will misread where one parameter ends and the next begins.",
  },
  {
    q: "Is Base32 or Base64 better?",
    a: "Base64 is more compact (~33% overhead vs ~60%) and is the default choice for payloads. Base32's case-insensitive, lookalike-free alphabet suits human transcription — recovery keys and one-time-password secrets.",
  },
  {
    q: "Why would I encode JSON as a URL component?",
    a: "When a whole JSON document must travel inside a query parameter, JSON URL escaping first encodes the structural characters so intermediate systems can't misinterpret braces and quotes.",
  },
  {
    q: "Do these tools work offline?",
    a: "After the page has loaded, every encoder and decoder runs locally in your browser. You can disconnect and continue converting without anything leaving your machine.",
  },
] as const;

export default function EncodeDecodePage() {
  return (
    <>
      <DevToolsShell
        tools={ENCODE_DECODE_TOOL_ORDER}
        activeHref="/encode-decode"
        heading="Encoding & Decoding Tools"
      />
      <HubContent
        path="/encode-decode"
        intro={
          <>
            <h2 className="text-xl font-semibold tracking-tight">Encode and decode anything, in one workspace</h2>
            <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
              Encoding problems are rarely about one format: a JWT segment turns out to be base64url,
              a query parameter arrives double percent-encoded, an API expects HTML-escaped entities.
              This workspace keeps every common codec side by side — pick a tool from the rail, paste
              your text, and convert instantly. Everything runs client-side, so tokens and credentials
              never leave your browser.
            </p>
          </>
        }
        tableHeaders={["Task", "Best tool"]}
        tableCaption="Which encoding or decoding tool to use for each task"
        tableRows={[
          [
            "Encode plain text for headers, configs and JSON blobs",
            <Link key="b64e" href="/base64-encoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
              Base64 Encoder
            </Link>,
          ],
          [
            "Read a Base64 value you received",
            <Link key="b64d" href="/base64-decoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
              Base64 Decoder
            </Link>,
          ],
          [
            "Escape values before putting them in links",
            <Link key="urle" href="/url-encoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
              URL Encoder
            </Link>,
          ],
          [
            "Read percent-encoded URLs from logs or redirects",
            <Link key="urld" href="/url-decoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
              URL Decoder
            </Link>,
          ],
          ["Recovery keys, OTP secrets, case-insensitive transport", "Base32 Encode / Decode"],
          ["Bitcoin-style addresses and identifiers", "Base58 Encode / Decode"],
          ["Escaping markup contexts", "HTML Encode / Decode, XML URL Encode / Decode"],
          ["Character-set debugging", "UTF-8 Converter, UTF-8 Decode, Hex to UTF-8"],
          ["Whole JSON documents inside query strings", "JSON URL Encode / Decode, JSON Encode / Decode"],
        ]}
        faqs={faqs}
      />
    </>
  );
}
