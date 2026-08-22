import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import { Section, Bullets, Faq, FaqJsonLd, Example } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-minifier");

const faqs = [
  {
    q: "What does a JSON minifier do?",
    a: "It removes every character JSON doesn't need — indentation, line breaks and extra spaces — producing the shortest valid single-line representation of your data.",
  },
  {
    q: "Does minifying JSON change the data?",
    a: "No. Whitespace between tokens is not significant in JSON, so the minified output parses to exactly the same values as the input.",
  },
  {
    q: "How much smaller will my JSON be?",
    a: "It depends on how much whitespace your source has. Pretty-printed documents with deep nesting typically shrink by 20–40%; already-compact JSON barely changes.",
  },
  {
    q: "Is minifying the same as compressing with gzip?",
    a: "No. Minification removes unnecessary characters; gzip is lossless compression applied on top. The two work well together — minify before serving, and let the server gzip the result.",
  },
] as const;

export default function JsonMinifierPage() {
  return (
    <ToolLandingPage
      path="/json-minifier"
      summary="Minify JSON online instantly. Paste pretty-printed or indented JSON into the live tool below and get it compressed to a single compact line — right in your browser, nothing uploaded."
    >
      <EmbeddedWorkspace mode="JSON_MINIFY" label="JSON minifier editor" />
      <FaqJsonLd items={faqs} />

      <Section title="Why minify JSON?">
        <p>
          Pretty-printed JSON is great for humans but wastes bytes on spaces, tabs and newlines.
          A <strong>JSON minifier</strong> strips all of that away, which matters when every byte
          counts: API responses, configuration shipped to browsers, cached payloads, or log lines
          where one record must stay on one line.
        </p>
        <Example
          input={`{
  "name": "John",
  "age": 30,
  "roles": [
    "admin",
    "dev"
  ]
}`}
          output={`{"name":"John","age":30,"roles":["admin","dev"]}`}
          inputLabel="Pretty JSON"
          outputLabel="Minified JSON"
        />
      </Section>

      <Section title="How to minify JSON online">
        <Bullets
          items={[
            "Paste your formatted or indented JSON into the editor above.",
            "The minified single-line result appears instantly.",
            "Copy it or download it as a .json file.",
            "Need it readable again? Switch the toolbar to JSON Format.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
