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

export const metadata: Metadata = buildMetadata("/base64-encoder");

const faqs = [
  {
    q: "What is Base64 encoding used for?",
    a: "Base64 encodes binary or text data into a safe ASCII string, commonly used for embedding data in URLs, JSON payloads, emails, and HTTP headers where raw bytes are not allowed.",
  },
  {
    q: "How is text converted to Base64?",
    a: "This tool encodes the input as UTF-8 bytes first, so it handles letters, numbers, and Unicode like emoji and non-Latin scripts correctly, then converts the bytes to Base64.",
  },
  {
    q: "Is Base64 encoding the same as encryption?",
    a: "No. Base64 is not encryption — it only changes the representation so anyone can decode it. Do not use Base64 to protect sensitive data.",
  },
  {
    q: "Why does encoded output end with = signs?",
    a: "Padding. Base64 works on groups of 3 bytes; when the final group is incomplete, one or two = characters pad the output to a multiple of 4 characters.",
  },
  {
    q: "Why is the Base64 output longer than my input?",
    a: "The alphabet trades space for safety: every 3 bytes become 4 characters, so output is always about 33% larger regardless of content.",
  },
  {
    q: "Does it work with emoji and Chinese or Arabic characters?",
    a: "Yes. Input is converted to UTF-8 bytes before encoding, which is why decoding on any standard system reproduces your original characters exactly.",
  },
] as const;

export default function Base64EncoderPage() {
  return (
    <ToolLandingPage
      path="/base64-encoder"
      summary="Encode any text to Base64 online, free and instantly. Type or paste plain text, JSON, or binary-derived strings into the live tool below — correct UTF-8 handling included, all inside your browser."
    >
      <EmbeddedWorkspace mode="BASE64_ENCODE" label="Base64 encoder editor" />
      <QuickStart
        steps={[
          "Type or paste the text you want to encode above.",
          "Auto Detect encodes it to Base64 immediately.",
          "Copy the result — padding (=) is included automatically.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="How Base64 encoding works">
        <p>
          Base64 turns each group of 3 bytes into 4 printable ASCII characters from a 64-character
          alphabet. That makes binary or textual data safe to transport through protocols and
          formats that only accept simple text, such as JSON, query strings, or email.
        </p>
        <p>
          This encoder first converts your input to UTF-8 bytes, so characters such as accented
          letters, emoji, and other-language alphabets are encoded accurately rather than corrupted.
          The output is standard Base64, padded with &quot;=&quot; as needed.
        </p>
        <Example input="Hello, DataFormatter!" output="SGVsbG8sIERhdGFGb3JtYXR0ZXIh" />
      </Section>

      <Section title="How to encode text to Base64 online">
        <Bullets
          items={[
            "Paste the text, JSON string, or value you want to encode into the editor above.",
            "The Base64 output appears instantly in the editor.",
            "Use Copy or Download to grab the encoded result.",
            "Need the reverse? Switch the toolbar to Base64 Decode.",
          ]}
        />
      </Section>

      <Section title="Real-world encoding scenarios">
        <UseCases
          cases={[
            {
              title: "HTTP Basic auth headers",
              body: "Basic auth takes username:password encoded in Base64. Encode the combined string here before adding it to an Authorization header.",
            },
            {
              title: "Data URIs & embedded payloads",
              body: "Small assets and JSON blobs get tucked into stylesheets, HTML, or config files as Base64 — this is step one of building those data URIs.",
            },
            {
              title: "Safe transport through text-only systems",
              body: "Queue messages, webhook bodies and legacy protocols that choke on binary all accept Base64-encoded content instead.",
            },
          ]}
        />
      </Section>

      <Section title="Base64 vs URL encoding vs hex — quick comparison">
        <CompareTable
          headers={["Scheme", "Output size", "Typical home"]}
          rows={[
            ["Base64", "~133% of input", <>
              Headers, JSON blobs, data URIs (see also the{" "}
              <Link href="/base64" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                Base64 Tools hub
              </Link>
              )
            </>],
            [
              <>
                <Link href="/url-encoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                  Percent-encoding
                </Link>
              </>,
              "Grows only with unsafe chars",
              "Query strings, path segments",
            ],
            ["Hex", "200% of input", "Checksums, byte-level debugging"],
          ]}
          caption="When to choose Base64 versus percent-encoding or hexadecimal"
        />
      </Section>

      <Section title="Encoding problems, solved">
        <Troubleshooting
          items={[
            {
              error: "Encoded value differs from another tool's output",
              cause: "Trailing whitespace or a final newline got included in the input, changing the last bytes — and therefore the tail of the Base64 string.",
              fix: "Delete trailing newlines in the editor before copying, then re-encode.",
            },
            {
              error: "Decoded text comes back garbled elsewhere",
              cause: "Some decoders assume Latin-1 instead of UTF-8, mangling multi-byte characters that were correctly encoded here.",
              fix: "Decode with our Base64 Decoder, which treats bytes as UTF-8 exactly like this encoder produced them.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Encoding JSON? The decoder on the paired page pretty-prints it again automatically — handy round-trip check.",
            "Split view keeps your plaintext and encoded output visible at once while you tweak the source.",
            "Share links carry workspace state, so you can hand an encoded value plus context to a teammate in one URL.",
            "Everything runs client-side — encoding credentials or tokens for local testing leaks nothing.",
          ]}
        />
      </Section>

      <Section title="Encoding glossary">
        <Glossary
          terms={[
            {
              term: "Base64",
              definition:
                "An encoding scheme representing arbitrary bytes using 64 ASCII characters (A–Z, a–z, 0–9, + and /), with = for padding. It enables binary-safe transport over text-only channels but provides no confidentiality whatsoever.",
            },
            {
              term: "UTF-8",
              definition:
                "The dominant character encoding of the web, storing every Unicode character as one to four bytes. Encoding text to UTF-8 first is what makes Base64 round-trips safe for international characters and emoji.",
            },
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
