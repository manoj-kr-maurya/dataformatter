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

export const metadata: Metadata = buildMetadata("/json-to-csv");

const faqs = [
  {
    q: "How does this tool turn JSON into CSV?",
    a: "It collects the keys from every object in your array, builds one header column per key, then emits one row per object. Values that need it are quoted and internal quotes are doubled, so the result parses cleanly in Excel, Airtable and BigQuery.",
  },
  {
    q: "What JSON can it convert?",
    a: "The top-level value must be an array of objects — for example an API response array or an exported collection. Single objects and deep nested structures produce a clear error instead of garbage output.",
  },
  {
    q: "What happens to nested objects and arrays inside a row?",
    a: "A cell that isn't a plain string, number or boolean is embedded as compact JSON text. This preserves the full value while keeping the table shape simple.",
  },
  {
    q: "Are missing fields dropped or left blank?",
    a: "Left blank. Columns are the union of all keys across your objects, so a row missing a key simply has an empty cell — this is what most import tools expect.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — the JSON you paste never leaves this page.",
  },
  {
    q: "What about CSV and TSV files with unusual escaping?",
    a: "Proper CSV escaping (commas, quotes and newlines inside quoted cells) is handled automatically. If you need tab-separated output instead, switch to the same converter's TSV mode in the JSON Converters hub.",
  },
] as const;

export default function JsonToCsvPage() {
  return (
    <ToolLandingPage
      path="/json-to-csv"
      summary="Convert an array of JSON objects into clean CSV. Paste your data above and it converts instantly — one header column per key, quoted and escaped cells, empty cells for missing fields. Ready to copy into Excel, Airtable or BigQuery, all processed entirely in your browser."
    >
      <EmbeddedWorkspace mode="JSON_TO_CSV" label="JSON to CSV converter editor" />
      <QuickStart
        steps={[
          "Paste an array of JSON objects (for example an API response) into the editor — it converts to CSV automatically.",
          "Check the header row: one column per key found across your objects.",
          "Use Copy to grab the CSV, or Download to save it as a .csv file.",
          "Open it in Excel, Airtable or your database's import tool.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="What converts cleanly">
        <Bullets
          items={[
            "The top-level value must be an array of objects — single objects or nested structures are rejected with a clear message.",
            "One header column per unique key, gathered from every object in the array.",
            "Missing keys become empty cells, keeping every row the same width.",
            "Strings with commas, quotes or newlines are quoted and escaped per RFC 4180.",
            "Objects and arrays inside a cell are kept as compact JSON text so no data is lost.",
          ]}
        />
      </Section>

      <Section title="JSON to CSV example">
        <Example
          input='[{ "name": "Ada", "city": "London", "tags": "admin" }, { "name": "Grace", "city": "New York", "tags": "dev" }]'
          output='name,city,tags
Ada,London,admin
Grace,New York,dev'
          inputLabel="JSON input"
          outputLabel="CSV output"
        />
      </Section>

      <Section title="Handy for">
        <UseCases
          cases={[
            {
              title: "Migrating API data into a spreadsheet",
              body: "Export a project list, an order history or a user dump from an endpoint, paste it here, and hand the resulting CSV to a stakeholder who lives in Excel.",
            },
            {
              title: "Importing into Airtable, BigQuery or Postgres",
              body: "Database and BI tools love CSV. Flatten your JSON response to rectangles and import it with COPY, the BigQuery web UI, or Airtable's importer.",
            },
            {
              title: "Building fixtures for data pipelines",
              body: "Mock pipelines read CSV tables. Generate a stable, rectangular table from your real JSON so your loader has realistic input during development.",
            },
          ]}
        />
      </Section>

      <Section title="CSV surprises">
        <Troubleshooting
          items={[
            {
              error: "JSON to table requires the top-level value to be an array of objects",
              cause: "You pasted a single object (or a nested structure) instead of a flat array of records.",
              fix: "Wrap the object in brackets — or extract the array field from the response before converting.",
            },
            {
              error: "Some rows are missing values",
              cause: "Not every object has every key, so the union header produces blank cells.",
              fix: "If a strict importer rejects blanks, add the missing keys (set to null) so the table is rectangular.",
            },
            {
              error: "A value shows up quoted in a strange way",
              cause: "The cell needed escaping because it contains a comma, quote or line break.",
              fix: "That is correct RFC 4180 behavior — Excel and most importers unquote it transparently.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Keep your objects shallow for the cleanest tables — deeply nested values stay readable but appear as JSON text in the cell.",
            "Compare CSV and TSV in the same converter hub when a tool complains about one delimiter.",
            "Use the JSON Converters hub for Excel-ready HTML, XML and key/value text variants of the same data.",
            "Nothing you convert here is sent anywhere, so real customer data is safe to use.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}