import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import { Section, Bullets, Faq, FaqJsonLd, Example } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-validator");

const faqs = [
  {
    q: "What does the JSON validator check?",
    a: "It parses your input against the JSON grammar (RFC 8259): matching braces and brackets, quoted keys, valid value types, no trailing commas, and no stray characters after the top-level value.",
  },
  {
    q: "My JSON is reported invalid — where is the error?",
    a: "The status line shows the error message with the exact line and column. Click it to jump the editor straight to the offending character.",
  },
  {
    q: "Does validation change or upload my JSON?",
    a: "No to both. Validation only reads your input, and everything runs locally in your browser — nothing is sent to any server.",
  },
  {
    q: "Is my JSON valid if JavaScript's eval accepts it?",
    a: "Not necessarily. JSON forbids single quotes, unquoted keys, trailing commas, comments and NaN — constructs that lenient JavaScript parsing may accept.",
  },
] as const;

export default function JsonValidatorPage() {
  return (
    <ToolLandingPage
      path="/json-validator"
      summary="Validate JSON online and find syntax errors fast. Paste your JSON into the live tool below — invalid documents get a clear message plus the exact line and column of the problem."
    >
      <EmbeddedWorkspace mode="JSON_VALIDATE" label="JSON validator editor" />
      <FaqJsonLd items={faqs} />

      <Section title="What JSON validation catches">
        <p>
          The validator checks that your document conforms to the JSON grammar defined in{" "}
          <a
            href="https://www.rfc-editor.org/rfc/rfc8259"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
          >
            RFC 8259
          </a>
          . The most common failures it reports are:
        </p>
        <Bullets
          items={[
            "Trailing commas after the last element of an object or array",
            "Single quotes instead of double quotes around keys and strings",
            "Unquoted or wrongly quoted object keys",
            "Undefined values such as NaN, Infinity or bare undefined",
            "Missing brackets or braces, and data after the closing root token",
          ]}
        />
      </Section>

      <Section title="How to check JSON syntax online">
        <Bullets
          items={[
            "Paste your JSON into the editor above.",
            "Valid JSON is confirmed instantly; the content is left untouched.",
            "Invalid JSON produces an error message with line and column.",
            "Once fixed, switch tools to format or minify the result.",
          ]}
        />
        <Example
          input={'{\n  "name": "John",\n  "age": 30,\n}'}
          output={"Error at line 4, column 1:\nUnexpected token }"}
          inputLabel="Invalid JSON"
          outputLabel="Validation report"
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
