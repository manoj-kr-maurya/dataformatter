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
  Glossary,
  ProTips,
} from "@/components/seo/content-blocks";
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
  {
    q: "Why do I need to decode twice sometimes?",
    a: "Double encoding happens when software escapes an already-escaped value (%2520 instead of %20). Decode repeatedly until the output stops changing — that's your original text.",
  },
  {
    q: "Can it decode a full URL with many parameters at once?",
    a: "Yes. Paste the whole query string; every escape is decoded in place so you can read all parameter values exactly as the server would see them.",
  },
] as const;

export default function UrlDecoderPage() {
  return (
    <ToolLandingPage
      path="/url-decoder"
      summary="Decode percent-encoded URLs and query strings online. Paste an encoded string into the live tool below and read it as plain text instantly — entirely browser-based, nothing uploaded."
    >
      <EmbeddedWorkspace mode="URL_DECODE" label="URL decoder editor" />
      <QuickStart
        steps={[
          "Paste the encoded URL, query string or parameter above.",
          "The readable text appears instantly, escapes decoded in place.",
          "Copy the result — done.",
        ]}
      />
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

      <Section title="What developers actually decode">
        <UseCases
          cases={[
            {
              title: "Reading tracking & redirect links",
              body: "Marketing links bury three layers of parameters inside each other. Decode layer by layer to see the true destination before clicking.",
            },
            {
              title: "Debugging logged requests",
              body: "Server logs store URLs encoded for safety. Decode them here to reconstruct what users and clients actually sent.",
            },
            {
              title: "Untangling OAuth callbacks",
              body: "Redirect URIs arrive double-encoded through several hops. Decoding reveals the state, code and error parameters your flow depends on.",
            },
          ]}
        />
      </Section>

      <Section title="Decoding errors explained">
        <Troubleshooting
          items={[
            {
              error: "URIError: malformed URI sequence",
              cause: "A stray percent sign followed by non-hex characters (100% done), or an escape cut in half when the string was split.",
              fix: "Encode bare percent signs as %25 first, or re-copy the complete encoded value including its final characters.",
            },
            {
              error: "Output contains � replacement characters",
              cause: "The escape sequence was valid but doesn't form complete UTF-8 — usually half of a multi-byte character got lost upstream.",
              fix: "Recover the original full string if possible; partial multi-byte sequences cannot be reconstructed faithfully.",
            },
            {
              error: "Decoded text still looks encoded",
              cause: "The value was double-encoded (%2520 decodes to %20 on the first pass).",
              fix: "Run the output through decoding again — repeat until nothing changes.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "After decoding, drop the URL into the URL Parser to see scheme, host, path and each query component laid out separately.",
            "Reading a token from a redirect? The JWT Decoder picks JWTs out of pasted text automatically.",
            "Keep word wrap on — long encoded links become far easier to review when they wrap instead of scrolling.",
            "Share a decoded link plus context with teammates via the Share button without leaving the page.",
          ]}
        />
      </Section>

      <Section title="Decoder glossary">
        <Glossary
          terms={[
            {
              term: "Mojibake",
              definition:
                "Garbled text produced when bytes are decoded using the wrong character encoding. This decoder avoids creating mojibake by strictly validating UTF-8 and erroring on sequences that don't fit.",
            },
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
