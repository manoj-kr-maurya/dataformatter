import type { Metadata } from "next";
import { ContentPage } from "@/components/seo/content-page";
import { Section, Bullets, Faq, Cta } from "@/components/seo/content-blocks";

export const metadata: Metadata = {
  title: "Base64 Decoder — Decode Base64 to Text & JSON Online",
  description:
    "Free online Base64 decoder. Decode Base64 back to text or JSON instantly, with automatic detection of base64-encoded JSON. 100% private and runs entirely in your browser.",
  alternates: { canonical: "/base64-decoder" },
};

const faqs = [
  {
    q: "Why won't my Base64 string decode?",
    a: "Decoding requires valid Base64 characters (A–Z, a–z, 0–9, +, /) with correct padding. Invalid characters, missing padding, or data that is not valid UTF-8 text will produce an error rather than garbage output.",
  },
  {
    q: "Can it decode Base64 that contains JSON?",
    a: "Yes. If the decoded bytes are valid JSON, the tool pretty-prints it automatically so you can read the structure instantly.",
  },
  {
    q: "Does Base64 decoding work on private or sensitive data?",
    a: "Yes — everything is decoded locally in your browser. Nothing you paste is uploaded, so it is safe for sensitive payloads.",
  },
];

export default function Base64DecoderPage() {
  return (
    <ContentPage
      pageTitle="Base64 Decoder"
      summary="Decode Base64 back to plain text or JSON online, free and instantly. Paste a Base64 string and this tool converts it back to readable text in your browser — never uploading your data."
    >
      <Section title="How Base64 decoding works">
        <p>
          Decoding reverses the Base64 process: the tool validates the 64-character alphabet,
          restores padding when it is missing, converts the characters back to raw bytes, and then
          decodes those bytes as UTF-8 text.
        </p>
        <p>
          If the resulting text is valid JSON, DataFormatter detects it and pretty-prints it
          automatically — handy when you receive Base64-wrapped API payloads or configuration and
          want to read them immediately.
        </p>
      </Section>

      <Section title="How to decode Base64 online">
        <Bullets
          items={[
            "Open the free Base64 Decoder tool from DataFormatter.",
            "Paste the Base64 string you received from an API, header, or config.",
            "The decoded text appears instantly, pretty-printed if it is JSON.",
            "Whitespace and line breaks inside the Base64 are handled automatically.",
          ]}
        />
      </Section>

      <Section title="When you'll need a Base64 decoder">
        <Bullets
          items={[
            "Reading data URIs and embedded images",
            "Inspecting Base64-encoded JSON from APIs",
            "Checking values inside JWT fragments and auth headers",
            "Debugging tokens and encoded configuration values",
          ]}
        />
      </Section>

      <Faq items={faqs} />

      <Cta label="Open the free Base64 Decoder tool" href="/" />
    </ContentPage>
  );
}