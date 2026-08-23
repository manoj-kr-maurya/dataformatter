import type { Metadata } from "next";
import Link from "next/link";
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
  CompareTable,
  Glossary,
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-formatter");

const faqs = [
  {
    q: "What is a JSON formatter?",
    a: "A JSON formatter takes compact or minified JSON and re-writes it with readable indentation and line breaks, making nested objects and arrays easy to scan.",
  },
  {
    q: "How do I format JSON online?",
    a: "Paste your JSON into the editor above. It is detected automatically and pretty-printed with standard 2-space indentation — no setup or button presses required.",
  },
  {
    q: "Is my data uploaded to a server?",
    a: "No. Formatting runs entirely in your browser using JavaScript — the text you paste never leaves your machine, which makes the tool safe for API payloads with real customer data.",
  },
  {
    q: "Can it also minify JSON or validate it?",
    a: "Yes. Use the toolbar to switch to JSON Minify to compress the output back to a single line, or JSON Validate to check that your JSON is well-formed.",
  },
  {
    q: "Is a formatter different from a beautifier or pretty printer?",
    a: "No — the three names describe the same operation: re-indenting compact JSON so humans can read it. This page's tool handles all three jobs identically.",
  },
  {
    q: "Can I format large JSON files?",
    a: "Yes. Formatting happens locally at editor speed, and the editor includes line numbers, bracket matching and code folding for navigating big documents.",
  },
  {
    q: "Does it support JSON5, comments or trailing commas?",
    a: "No. The formatter follows strict RFC 8259 JSON, so comments, single quotes and trailing commas are reported as errors rather than silently accepted. Clean the input first, then format it.",
  },
] as const;

export default function JsonFormatterPage() {
  return (
    <ToolLandingPage
      path="/json-formatter"
      summary="Prettify, minify, and validate JSON online in one click. Paste compact JSON into the live tool below and it reformats with clean indentation instantly — every operation runs locally in your browser."
    >
      <EmbeddedWorkspace mode="JSON_FORMAT" label="JSON formatter editor" />
      <QuickStart
        steps={[
          "Paste or type your compact JSON into the editor above.",
          "Auto Detect pretty-prints it instantly with 2-space indentation.",
          "Hit Copy to grab the result, Download for a .json file, or Share to send a link.",
        ]}
      />
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

      <Section title="When developers reach for a formatter">
        <UseCases
          cases={[
            {
              title: "Debugging API responses",
              body: "Log viewers and curl output collapse JSON into one wall of text. Paste the response here to see the exact structure you're coding against.",
            },
            {
              title: "Reviewing config before deploy",
              body: "Read through terraform-style JSON configs or service manifests with proper indentation before pushing them anywhere important.",
            },
            {
              title: "Writing fixtures & mocks",
              body: "Author readable test fixtures by hand, then let Auto Detect keep them consistently indented as they grow.",
            },
          ]}
        />
      </Section>

      <Section title="Formatter vs validator vs minifier — which do you need?">
        <p>
          All three live in this one workspace. If you&apos;re unsure where to start, run the
          validator first — once the syntax is confirmed valid, formatting and minifying are safe.
        </p>
        <CompareTable
          headers={["Tool", "Best for", "Changes your data?"]}
          rows={[
            ["Formatter", "Reading and editing JSON comfortably", "Only whitespace — keys and values stay identical"],
            [
              <>
                <Link href="/json-validator" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                  Validator
                </Link>
              </>,
              "Confirming syntax before code touches the payload",
              "Never — it only reports errors with line and column",
            ],
            [
              <>
                <Link href="/json-minifier" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                  Minifier
                </Link>
              </>,
              "Shrinking payloads for storage or transport",
              "Only whitespace — output parses to the same values",
            ],
          ]}
          caption="Comparison of the JSON formatter, validator and minifier tools"
        />
      </Section>

      <Section title="Common JSON formatting problems">
        <Troubleshooting
          items={[
            {
              error: "Unexpected token '}' , ..." ,
              cause: "A trailing comma after the last property, or an extra closing brace left over from deleted content.",
              fix: "Remove the comma or brace at the reported position, or paste the text into the JSON Validator to jump straight to it.",
            },
            {
              error: "Unexpected token ' in JSON",
              cause: "Single quotes around keys or values — valid JavaScript, but not valid JSON.",
              fix: "Replace all single quotes with double quotes; escape any inner double quotes with a backslash.",
            },
            {
              error: "Nothing happens when I paste",
              cause: "The input isn't JSON-like yet (no opening { or [ ), so auto-detection leaves it untouched instead of guessing.",
              fix: "Check the first character is { or [. For other formats use the tool menu to pick a converter explicitly.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips for faster formatting">
        <ProTips
          tips={[
            "Toggle Split view to keep raw input on the left and formatted output on the right while editing.",
            "Turn on word wrap in Editor settings when long string values stretch past the screen edge.",
            "Use search inside the editor to find a specific key in deeply nested documents.",
            "Made a mistake? Restore Original brings back exactly what you pasted, before any formatting.",
          ]}
        />
      </Section>

      <Section title="JSON formatting glossary">
        <Glossary
          terms={[
            {
              term: "Pretty-printing",
              definition:
                "Adding whitespace, indentation and line breaks to serialized data so it is easier for humans to read. Pretty-printed JSON parses to exactly the same values as the compact form — only presentation changes.",
            },
            {
              term: "Serialization",
              definition:
                "Converting an in-memory object into a transferable text format. JSON serialization turns language objects into strings; formatting controls how those strings are laid out for readers.",
            },
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
