import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import { Section, Bullets, Faq, FaqJsonLd, Example } from "@/components/seo/content-blocks";
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
] as const;

export default function Base64EncoderPage() {
  return (
    <ToolLandingPage
      path="/base64-encoder"
      summary="Encode any text to Base64 online, free and instantly. Type or paste plain text, JSON, or binary-derived strings into the live tool below — correct UTF-8 handling included, all inside your browser."
    >
      <EmbeddedWorkspace mode="BASE64_ENCODE" label="Base64 encoder editor" />
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

      <Section title="Common uses">
        <Bullets
          items={[
            "Encoding strings before placing them in URLs, query parameters or Basic auth headers",
            "Storing binary-like values inside JSON payloads",
            "Embedding small images as data URIs (see the Base64 Tools hub for images)",
            "Representing tokens and identifiers in a transport-friendly form",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
