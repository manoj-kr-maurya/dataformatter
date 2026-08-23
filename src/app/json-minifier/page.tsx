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
  {
    q: "Should I minify JSON before or after signing it?",
    a: "Before. Signatures cover exact bytes, so if you sign pretty-printed JSON and later reformat it, verification fails. Minify first, then compute signatures over the compact form.",
  },
  {
    q: "Can I un-minify JSON again later?",
    a: "Yes — that's exactly what the JSON Formatter does. Minification is lossless for data content; only the human-friendly layout is removed.",
  },
] as const;

export default function JsonMinifierPage() {
  return (
    <ToolLandingPage
      path="/json-minifier"
      summary="Minify JSON online instantly. Paste pretty-printed or indented JSON into the live tool below and get it compressed to a single compact line — right in your browser, nothing uploaded."
    >
      <EmbeddedWorkspace mode="JSON_MINIFY" label="JSON minifier editor" />
      <QuickStart
        steps={[
          "Paste your formatted or indented JSON above.",
          "Auto Detect minifies it to one line immediately.",
          "Copy the compact output or download it as a .json file.",
        ]}
      />
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

      <Section title="Where minified JSON earns its keep">
        <UseCases
          cases={[
            {
              title: "Shrinking configs before deploy",
              body: "Feature flags, service manifests and environment templates ship smaller and parse faster when stored minified — then expand for review any time.",
            },
            {
              title: "One-record-per-line logging",
              body: "Structured log pipelines require each JSON event to sit on exactly one line. Minifying normalises records before ingestion.",
            },
            {
              title: "Trimming API response payloads",
              body: "Whitespace inside server responses is pure overhead on mobile networks. Minify templates and fixtures before they become part of an endpoint.",
            },
          ]}
        />
      </Section>

      <Section title="Minifying problems, explained">
        <Troubleshooting
          items={[
            {
              error: "Unexpected end of JSON input",
              cause: "The paste got truncated — often the last closing brace or bracket was cut off during copying from a terminal or chat window.",
              fix: "Re-copy the whole document and confirm it ends with } or ]. The validator shows the exact position where parsing stopped.",
            },
            {
              error: "Output looks identical to input",
              cause: "Your source was already compact. Minification only removes layout whitespace, so there is nothing left to strip.",
              fix: "That's the expected result — the JSON is already at its smallest valid size.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Validate before you minify: run JSON Validate first so syntax errors are caught while the document is still readable.",
            "Keep Split view open to compare your indented source against the compact result side by side.",
            "Share links encode the workspace state — handy for handing a minified payload to a teammate without attaching files.",
            "Word wrap off makes single-line output easier to measure and diff.",
          ]}
        />
      </Section>

      <Section title="JSON minification glossary">
        <Glossary
          terms={[
            {
              term: "Minification",
              definition:
                "Reducing text size by deleting characters that machines ignore — whitespace, indentation and newlines. Unlike compression (gzip, brotli), the output remains plain readable ASCII and needs no decompression step.",
            },
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
