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
  {
    q: "How do I fix 'Unexpected token' errors quickly?",
    a: "Read the reported position, then look one character before it — most token errors come from a missing comma, an unclosed quote or an extra bracket immediately prior. The formatter can also re-indent the document so structural mistakes become visible.",
  },
  {
    q: "Can it validate JSON inside a larger string, like a log line?",
    a: "Auto Detect looks for JSON-shaped content in what you paste, but for mixed text it's best to extract the object first (from the first { to the matching }) and validate that on its own.",
  },
] as const;

export default function JsonValidatorPage() {
  return (
    <ToolLandingPage
      path="/json-validator"
      summary="Validate JSON online and find syntax errors fast. Paste your JSON into the live tool below — invalid documents get a clear message plus the exact line and column of the problem."
    >
      <EmbeddedWorkspace mode="JSON_VALIDATE" label="JSON validator editor" />
      <QuickStart
        steps={[
          "Paste the JSON you suspect into the editor above.",
          "A green status means valid; errors appear with line and column.",
          "Click the error line to jump straight to the broken character.",
        ]}
      />
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

      <Section title="Who validates JSON — and when">
        <UseCases
          cases={[
            {
              title: "Catching bad responses early",
              body: "Before wiring an endpoint into code, paste its response here. If this page flags invalid JSON, no amount of client-side parsing will save you.",
            },
            {
              title: "Pre-flight for config files",
              body: "One trailing comma in a deployment manifest can fail an entire pipeline. Validate the file as part of writing it, not after CI breaks.",
            },
            {
              title: "Teaching & learning JSON",
              body: "The precise line-and-column feedback turns every mistake into a small, fixable lesson about the grammar.",
            },
          ]}
        />
      </Section>

      <Section title="Frequent validation errors">
        <Troubleshooting
          items={[
            {
              error: "Unexpected token < in JSON at position 0",
              cause: "You pasted HTML (often an error page) instead of JSON — the response body started with a tag like <html>.",
              fix: "Check the request actually returned JSON; an API Client will show status codes and headers so you can see redirects or 500 pages.",
            },
            {
              error: "Unexpected token } in JSON at position …",
              cause: "Usually a trailing comma before the closing brace — legal in JavaScript objects, forbidden in JSON.",
              fix: "Delete the comma after the final property at or just before the reported position.",
            },
            {
              error: "Unexpected end of JSON input",
              cause: "The document stops mid-structure: an unclosed brace, bracket, or string literal cut short by a newline.",
              fix: "Re-copy the complete payload; the missing closer is usually the last character that got lost in transit.",
            },
            {
              error: "Bad escaped character in JSON",
              cause: "A backslash followed by something JSON doesn't allow, such as \\x41 or a raw Windows path like C:\\new\\test with unescaped backslashes.",
              fix: "Double every literal backslash (\\\\) or replace single backslashes with forward slashes in paths.",
            },
          ]}
        />
      </Section>

      <Section title="Validation glossary">
        <Glossary
          terms={[
            {
              term: "Well-formed JSON",
              definition:
                "Text that parses successfully under RFC 8259: correct quoting, balanced structure, allowed value types and no trailing tokens. Validity says nothing about meaning — a well-formed document can still contain wrong data.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Validate, then format: once the status turns green, switch to the formatter to make the document reviewable.",
            "The editor's bracket matching highlights paired braces — park your cursor next to one to find its partner.",
            "Large payloads? Code folding collapses sections so you can scan the top-level shape first.",
            "Everything is checked locally, so validating customer data or internal payloads leaks nothing.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
