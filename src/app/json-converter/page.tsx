import type { Metadata } from "next";
import Link from "next/link";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { HubContent } from "@/components/seo/hub-content";
import { JSON_CONVERTER_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-converter");

const faqs = [
  {
    q: "How do I convert JSON to Java classes?",
    a: "Pick JSON → Java in the workspace, paste your document (or an example response), and generate POJO-style class definitions matching the structure — ready to drop into a project.",
  },
  {
    q: "Which target formats are supported?",
    a: "Java, XML, YAML, CSV, TSV, Excel-compatible tables, plain text and HTML. Each converter maps JSON structure to its target's conventions — arrays become repeating elements or table rows.",
  },
  {
    q: "Can I convert nested JSON to CSV?",
    a: "Objects at the top level become table rows; nested objects and arrays inside a row are kept as JSON text in the cell so nothing is lost. If you need every nested field on its own column, flatten the keys first so the document is a flat array of objects.",
  },
  {
    q: "My conversion failed — is my JSON invalid?",
    a: "Most failures are syntax problems upstream. Validate the document first with the JSON Validator, then return here to convert the clean version.",
  },
  {
    q: "Do conversions upload my data anywhere?",
    a: "No. Every converter parses and generates output inside your browser. Nothing you paste is transmitted, logged or stored.",
  },
] as const;

export default function JsonConverterPage() {
  return (
    <>
      <DevToolsShell
        tools={JSON_CONVERTER_TOOL_ORDER}
        activeHref="/json-converter"
        heading="JSON Converters"
      />
      <HubContent
        path="/json-converter"
        intro={
          <>
            <h2 className="text-xl font-semibold tracking-tight">One JSON document, eight destinations</h2>
            <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
              JSON is the lingua franca, but downstream systems still speak Java classes, XML feeds,
              YAML configs, spreadsheets and HTML tables. Paste your document once and switch targets
              from the rail: each converter maps arrays and objects to idiomatic output for its format.
              Conversions run entirely client-side — paste internal payloads freely.
            </p>
          </>
        }
        tableHeaders={["Destination", "What you get"]}
        tableCaption="JSON conversion targets and their typical uses"
        tableRows={[
          ["Java", "POJO-style classes mirroring your JSON structure"],
          ["XML", "Elements with attributes/children mapped from keys and arrays"],
          [
            <>
              <Link key="yaml" href="/json-to-yaml" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                YAML
              </Link>
            </>,
            "Indentation-based config, ideal for Kubernetes & CI files",
          ],
          [
            <>
              <Link key="csv" href="/json-to-csv" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                CSV / TSV / Excel
              </Link>
            </>,
            "Spreadsheet-ready rows from array-of-objects documents",
          ],
          ["Plain text", "Human-readable listing of values"],
          ["HTML", "Renderable markup for quick reports"],
          [
            <>
              <Link key="fmt" href="/json-formatter" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                Need tidy input first?
              </Link>
            </>,
            "Format or validate the JSON before converting",
          ],
        ]}
        faqs={faqs}
      />
    </>
  );
}
