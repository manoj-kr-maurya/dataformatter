import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import { Section, Bullets, Faq, FaqJsonLd, Example } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-formatter");

const faqs = [
  {
    q: "What is a JSON formatter?",
    a: "A JSON formatter takes compact or minified JSON and re-writes it with readable indentation and line breaks, making nested objects and arrays easy to scan.",
  },
  {
    q: "How do I format JSON?",
    a: "Paste your JSON into the editor above. It is detected automatically and pretty-printed with standard 2-space indentation — no setup or button presses required.",
  },
  {
    q: "Is this JSON formatter free and safe to use?",
    a: "Yes. The tool is free, requires no account, and runs entirely in your browser. Your JSON is never sent to a server.",
  },
  {
    q: "Can it also minify JSON or validate it?",
    a: "Yes. Use the toolbar to switch to JSON Minify to compress the output back to a single line, or JSON Validate to check that your JSON is well-formed.",
  },
  {
    q: "Can I format large JSON files?",
    a: "Yes. Formatting happens locally at editor speed, and the editor includes line numbers, bracket matching and code folding for navigating big documents.",
  },
] as const;

export default function JsonFormatterPage() {
  return (
    <ToolLandingPage
      path="/json-formatter"
      summary="Prettify, minify, and validate JSON online in one click. Paste compact JSON into the live tool below and it reformats with clean indentation instantly — every operation runs locally in your browser."
    >
      <EmbeddedWorkspace mode="JSON_FORMAT" label="JSON formatter editor" />
      <FaqJsonLd items={faqs} />

      <Section title="Why format JSON?">
        <p>
          JSON is the most common data format for APIs, configuration files, and storage. When it
          arrives minified on a single line, it is hard to read: nested objects blur together and
          syntax mistakes are easy to miss. A <strong>JSON formatter</strong> (also called a{" "}
          <strong>JSON pretty printer</strong> or beautifier) reformats the data so every key,
          array, and value sits on its own readable line.
        </p>
        <Example input={`{"name":"John","age":30,"roles":["admin","dev"]}`} output={`{
  "name": "John",
  "age": 30,
  "roles": [
    "admin",
    "dev"
  ]
}`} />
      </Section>

      <Section title="How to format JSON online">
        <Bullets
          items={[
            "Paste your compact JSON, or type it directly into the editor above.",
            "The JSON is detected automatically and pretty-printed with 2-space indentation.",
            "Copy the result, download it as a file, or share it as a link.",
            "Switch tools in the toolbar to minify the JSON or validate it instead.",
          ]}
        />
      </Section>

      <Section title="Features">
        <Bullets
          items={[
            "Automatic JSON detection — no setup required",
            "Pretty-print with standard 2-space indentation",
            "Built-in JSON minifier to compress output back to a single line",
            "Same-page validation with clear error messages, including line and column of the error",
            "Line numbers, bracket matching, folding, find, and word wrap",
            "100% client-side: your data never leaves the browser",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
