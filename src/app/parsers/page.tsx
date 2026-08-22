import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { PARSER_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/parsers");

export default function ParsersPage() {
  return (
    <DevToolsShell tools={PARSER_TOOL_ORDER} activeHref="/parsers" heading="Parsers" />
  );
}
