import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import { Section, Bullets, Faq, FaqJsonLd, Example } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/url-encoder");

const faqs = [
  {
    q: "Which characters get percent-encoded?",
    a: "This tool encodes like JavaScript's encodeURIComponent: everything except A–Z, a–z, 0–9, - _ . ! ~ * ' ( ) is replaced with %XX byte escapes — including spaces, &, =, ?, # and slash.",
  },
  {
    q: "When do I need URL encoding?",
    a: "Whenever arbitrary text becomes part of a URL — query parameter values, path segments with special characters, or fragments. Unencoded & or = inside a value would otherwise be read as separators.",
  },
  {
    q: "Is URL encoding the same as Base64?",
    a: "No. Percent-encoding keeps text readable and only escapes reserved characters; Base64 rewrites all data into a different alphabet and always grows the input by about a third.",
  },
] as const;

export default function UrlEncoderPage() {
  return (
    <ToolLandingPage
      path="/url-encoder"
      summary="Encode text for safe use in URLs online. Paste any string into the live tool below and it is percent-encoded exactly like encodeURIComponent — instantly, privately, in your browser."
    >
      <EmbeddedWorkspace mode="URL_ENCODE" label="URL encoder editor" />
      <FaqJsonLd items={faqs} />

      <Section title="How URL encoding works">
        <p>
          URLs can only carry a limited set of ASCII characters safely. Everything else — spaces,
          symbols, non-Latin scripts, emoji — must be replaced by percent escapes (
          <code>%20</code>, <code>%26</code>, …) that describe the UTF-8 bytes of the original
          character. This process is also known as percent-encoding.
        </p>
        <Example
          input={'search?q=hello world & more'}
          output={"search%3Fq%3Dhello%20world%20%26%20more"}
          outputLabel="Encoded"
        />
      </Section>

      <Section title="How to encode a URL online">
        <Bullets
          items={[
            "Paste the text or parameter value you want to make URL-safe into the editor above.",
            "The percent-encoded result appears instantly.",
            "Copy the encoded string and drop it into your link, query string or API call.",
            "Going the other way? Switch the toolbar to URL Decode.",
          ]}
        />
      </Section>

      <Section title="Common uses">
        <Bullets
          items={[
            "Escaping user-supplied values before adding them to a query string",
            "Making redirect or callback URLs safe to nest inside another URL",
            "Encoding UTM tags, filters and search terms programmatically",
            "Debugging why an unencoded character broke a request",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
