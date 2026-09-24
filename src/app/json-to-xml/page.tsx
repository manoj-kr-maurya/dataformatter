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
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-to-xml");

const faqs = [
  {
    q: "How does this tool turn JSON into XML?",
    a: "Each object key becomes an element name, nested objects become child elements, and arrays become repeated sibling elements. Text values are written inside the element, with &, < and > escaped so the output is always well-formed XML.",
  },
  {
    q: "What JSON shapes does it accept?",
    a: "Any valid JSON works. A top-level object maps under a root element; a top-level array of objects emits one root element per item. Scalar, array and nested-object values all convert without losing data.",
  },
  {
    q: "What happens to keys that are not valid XML names?",
    a: "Element names are sanitized: characters that XML forbids in a tag name are replaced with _, and a name that would start with a digit is prefixed with _. So a key like \"first name\" becomes first_name in the output.",
  },
  {
    q: "How are special characters in values handled?",
    a: "Values are text-escaped per XML rules: & becomes &amp;, < becomes &lt; and > becomes &gt;. A value like \"Ada & Grace\" appears as Ada &amp; Grace in the XML.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — the JSON you paste never leaves this page.",
  },
  {
    q: "Can I also get YAML, CSV or Java from the same JSON?",
    a: "Yes — the JSON Converters hub hosts every output target in one workspace, and dedicated pages cover JSON to Java, JSON to CSV and JSON to YAML.",
  },
] as const;

export default function JsonToXmlPage() {
  return (
    <ToolLandingPage
      path="/json-to-xml"
      summary="Convert JSON to well-formed XML instantly. Paste your document above — object keys become element names, arrays become repeated tags, and values are escaped so the output parses everywhere. Runs entirely in your browser."
    >
      <EmbeddedWorkspace mode="JSON_TO_XML" label="JSON to XML converter editor" />
      <QuickStart
        steps={[
          "Paste a JSON object (for example an API response) into the editor — it converts to XML automatically.",
          "Scan the element names: each key maps to a tag, and arrays repeat their tag per item.",
          "Use Copy to grab the XML, or Download to save it as a .xml file.",
          "Feed it into your XML pipeline, feed file or integration target.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="How JSON becomes XML">
        <Bullets
          items={[
            "A top-level object renders inside a <root> element, one child element per key.",
            "Nested objects produce nested elements at the matching depth.",
            "Arrays repeat their element name once per item — no wrapper element is added.",
            "Scalar values (strings, numbers, booleans, null) are written as element text.",
            "Text and element names are escaped and sanitized, so output is always well-formed.",
          ]}
        />
      </Section>

      <Section title="JSON to XML example">
        <Example
          input='{ "name": "Ada & Grace", "roles": ["admin", "dev"], "profile": { "level": 2 } }'
          output={`<root>
  <name>Ada &amp; Grace</name>
  <roles>admin</roles>
  <roles>dev</roles>
  <profile>
    <level>2</level>
  </profile>
</root>`}
          inputLabel="JSON input"
          outputLabel="XML output"
        />
      </Section>

      <Section title="Handy for">
        <UseCases
          cases={[
            {
              title: "Feeding JSON data into XML-based systems",
              body: "SOAP endpoints, RSS/Atom feeds and legacy integrations often only accept XML. Convert your response JSON and post the markup without hand-writing a transform.",
            },
            {
              title: "Migrating payloads into XSLT pipelines",
              body: "XSLT transforms are built on XML input trees. Turning a JSON export into well-formed XML lets you reuse the same stylesheet pipeline on your JSON data.",
            },
            {
              title: "Building fixtures for XML parsers",
              body: "Mock XML feeds from real JSON so parsers and schema validators get realistic input during development — generated locally, so sample data stays private.",
            },
          ]}
        />
      </Section>

      <Section title="XML surprises">
        <Troubleshooting
          items={[
            {
              error: "Invalid JSON: Expected double-quoted property name in JSON at position 13 (line 1 column 14)",
              cause: "The pasted text isn't well-formed JSON — often a trailing comma or an unquoted key, which JSON permits nowhere.",
              fix: "Validate the document first with the JSON Validator to jump to the exact line and column, then convert the clean version.",
            },
            {
              error: "<name>Ada &amp; Grace</name> parses as a different value",
              cause: "Your original value contained & or <, which XML escaped in the output — that's correct, not a bug.",
              fix: "Keep the escaped form. Any XML parser unescapes &amp; back to & automatically when it reads the document.",
            },
            {
              error: "A key like \"first name\" became first_name",
              cause: "XML element names cannot contain spaces, so the converter sanitizes forbidden characters to _.",
              fix: "Rename JSON keys before conversion if you need a specific element name — or accept the sanitized form, which your XML tooling will read identically.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Validate the JSON first for the fastest loop — most conversion failures are syntax errors upstream.",
            "Prefer short, legal XML names in your keys to avoid needless sanitization.",
            "For tabular output instead, switch to JSON to CSV — arrays become spreadsheet rows.",
            "Nothing you convert here is sent anywhere, so real customer data is safe to use.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}