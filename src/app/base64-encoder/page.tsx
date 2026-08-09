import type { Metadata } from "next";
import { ContentPage } from "@/components/seo/content-page";
import { Section, Bullets, Faq, Cta } from "@/components/seo/content-blocks";

export const metadata: Metadata = {
  title: "Base64 Encoder — Encode Text to Base64 Online",
  description:
    "Free online Base64 encoder. Encode text, JSON, or any string to Base64 in one click, with exact UTF-8 handling. 100% private — runs entirely in your browser.",
  alternates: { canonical: "/base64-encoder" },
};

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
];

export default function Base64EncoderPage() {
  return (
    <ContentPage
      pageTitle="Base64 Encoder"
      summary="Encode any text to Base64 online, free and instantly. Type or paste plain text, JSON, or binary-derived strings and this tool converts them to standard Base64 using correct UTF-8 handling — all inside your browser."
    >
      <Section title="How Base64 encoding works">
        <p>
          Base64 turns each group of 3 bytes into 4 printable ASCII characters from a 64-character
          alphabet. That makes binary or textual data safe to transport through protocols and
          formats that only accept simple text, such as JSON, query strings, or email.
        </p>
        <p>
          This encoder first converts your input to UTF-8 bytes, so characters such as accented
          letters, emoji, and other-language alphabets are encoded accurately rather than corrupted.
          The output is standard Base64, optionally ending with padding (&quot;=&quot;) as needed.
        </p>
      </Section>

      <Section title="How to encode to Base64 online">
        <Bullets
          items={[
            "Open the free Base64 Encoder tool from DataFormatter.",
            "Paste the text, JSON string, or value you want to encode.",
            "The Base64 output appears instantly in the editor.",
            "Use Copy or Download to grab the encoded result.",
          ]}
        />
      </Section>

      <Section title="Common uses">
        <Bullets
          items={[
            "Encoding JSON strings before placing them in URLs or query parameters",
            "Storing binary-like values inside JSON payloads",
            "Embedding small images as data URIs",
            "Representing tokens and identifiers in a transport-friendly form",
          ]}
        />
      </Section>

      <Faq items={faqs} />

      <Cta label="Open the free Base64 Encoder tool" href="/" />
    </ContentPage>
  );
}