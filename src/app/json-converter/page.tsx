import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { JSON_CONVERTER_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-converter");

export default function JsonConverterPage() {
  return (
    <DevToolsShell
      tools={JSON_CONVERTER_TOOL_ORDER}
      activeHref="/json-converter"
      heading="JSON Converters"
    />
  );
}
