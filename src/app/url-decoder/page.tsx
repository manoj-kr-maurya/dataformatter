import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import { Section, Bullets, Faq, FaqJsonLd, Example } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/url-decoder");

const faqs = [
  {
    q: "What does URL decoding do?",
    a: "It converts percent escapes like %20 or %E2%9C%85 back into the characters they represent, turning machine-safe encoded URLs back into readable text.",
  },
  {
    q: "Why does my decoded text look garbled?",
    a: "The decoder interprets byte sequences as UTF-8. Input that was encoded from a different character set, or escapes that don't form valid UTF-8, will produce an error rather than mojibake.",
  },
  {
    q: "Does it turn + into spaces?",
    a: "No — this tool decodes percent-encoding only, matching decodeURIComponent. The '+' convention belongs to form encoding (application/x-www-form-urlencoded).",
  },
] as const;

export default function UrlDecoderPage() {
  return (
    <ToolLandingPage
      path="/url-decoder"
      summary="Decode percent-encoded URLs and query strings online. Paste an encoded string into the live tool below and read it as plain text instantly — entirely browser-based, nothing uploaded."
    >
      <EmbeddedWorkspace mode="URL_DECODE" label="URL decoder editor" />
      <FaqJsonLd items={faqs} />

      <Section title="How URL decoding works">
        <p>
          Percent-encoding represents unsafe characters as <code>%XX</code> byte escapes. Decoding
          reverses this: each escape is turned back into its byte, and the byte sequence is decoded
          as UTF-8 text. Multi-byte characters such as emoji or accented letters are restored from
          their full escape sequence.
        </p>
        <Example
          input={"search%3Fq%3Dhello%20world%20%26%20more"}
          output={"search?q=hello world & more"}
          inputLabel="Encoded"
          outputLabel="Decoded"
        />
      </Section>

      <Section title="How to decode a URL online">
        <Bullets
          items={[
            "Paste the encoded URL, query string or parameter into the editor above.",
            "The readable result appears instantly.",
            "Copy the decoded text with one click.",
            "Need to encode instead? Switch the toolbar to URL Encode.",
          ]}
        />
      </Section>

      <Section title="When you'll need a URL decoder">
        <Bullets
          items={[
            "Reading tracking links, UTM parameters and redirect targets",
            "Inspecting values inside logged request URLs",
            "Understanding double-encoded parameters in APIs (decode twice if needed)",
            "Debugging callback URLs and OAuth redirect URIs",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
