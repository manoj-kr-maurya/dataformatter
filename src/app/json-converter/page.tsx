import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { JSON_CONVERTER_TOOL_ORDER } from "@/lib/tools";

export const metadata: Metadata = {
  title: "JSON Converters – JSON to Java, XML, YAML, CSV, TSV, Excel, HTML Online",
  description:
    "Free online JSON converters: JSON to Java, XML, YAML, CSV, TSV, plain text, Excel and HTML. 100% private — everything runs in your browser.",
  alternates: { canonical: "/json-converter" },
};

export default function JsonConverterPage() {
  return <DevToolsShell tools={JSON_CONVERTER_TOOL_ORDER} activeHref="/json-converter" />;
}