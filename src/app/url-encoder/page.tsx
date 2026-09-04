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
  {
    q: "What's the difference between encodeURI and encodeURIComponent?",
    a: "encodeURI preserves full-URL syntax like / ? : @ & = + $ # so a complete link stays navigable; encodeURIComponent escapes those too, which is what you want for individual parameter VALUES. This tool behaves like encodeURIComponent.",
  },
  {
    q: "Should I encode the whole URL or just its parameters?",
    a: "Just the values. Encoding an entire URL double-escapes its structure and produces links that no longer work. Encode each dynamic value right before inserting it into the query string.",
  },
] as const;

export default function UrlEncoderPage() {
  return (
    <ToolLandingPage
      path="/url-encoder"
      summary="Encode text for safe use in URLs online. Paste any string into the live tool below and it is percent-encoded exactly like encodeURIComponent — instantly, privately, in your browser."
    >
      <EmbeddedWorkspace mode="URL_ENCODE" label="URL encoder editor" />
      <QuickStart
        steps={[
          "Paste the value that belongs inside a link above.",
          "Auto Detect percent-encodes it instantly.",
          "Copy the escaped output into your query string or API call.",
        ]}
      />
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

      <Section title="Where escaping saves your links">
        <UseCases
          cases={[
            {
              title: "Building search & filter URLs",
              body: "User-typed terms break query strings the moment they contain & or =. Escape every dynamic value before concatenating it into the link.",
            },
            {
              title: "Nesting redirect targets",
              body: "OAuth callbacks and SSO redirects carry a full URL inside another URL. The inner one must be fully percent-encoded or parsers will split it at the wrong places.",
            },
            {
              title: "UTM tags that analytics can read",
              body: "Campaign names with spaces or ampersands silently corrupt attribution. Encoded UTM values keep dashboards clean.",
            },
          ]}
        />
      </Section>

      <Section title="Encoding problems explained">
        <Troubleshooting
          items={[
            {
              error: "My encoded link opens the wrong page",
              cause: "Double encoding: a value was already escaped once (%26) and got encoded again (%2526), so the server decodes it to literal %26 instead of &.",
              fix: "Encode once, at the last moment before insertion. If you see %25 sequences, strip one layer first with the URL Decoder.",
            },
            {
              error: "+ appears instead of %20",
              cause: "Form encoding (application/x-www-form-urlencoded) represents spaces as +, while strict percent-encoding uses %20. Mixing conventions confuses some servers.",
              fix: "Pick one convention per request; this tool always emits %20, which is correct for path segments and most modern APIs.",
            },
            {
              error: "Non-Latin characters turn into long escape runs",
              cause: "That's expected: each UTF-8 byte becomes its own %XX escape, so emoji or CJK text expands several times over.",
              fix: "Nothing is wrong — paste the escapes back into the URL Decoder to verify the round trip restores your text.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "After building a gnarly link, run it through the URL Parser to confirm every component landed where you intended.",
            "Encoding whole payloads instead? Base64 keeps binary-ish data intact where percent-encoding only handles text safely.",
            "Split view shows original and escaped strings side by side — perfect for spotting accidental double encodes.",
            "Restore Original undoes experiments instantly if you've edited yourself into a corner.",
          ]}
        />
      </Section>

      <Section title="Percent-encoding glossary">
        <Glossary
          terms={[
            {
              term: "Percent-encoding",
              definition:
                "The URL escaping mechanism defined by RFC 3986: unsafe bytes are written as % followed by two hex digits. Spaces become %20, ampersands %26, and multi-byte Unicode characters become one escape per UTF-8 byte.",
            },
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
