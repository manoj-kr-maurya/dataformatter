import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { STRING_FUNCTION_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/string-functions");

export default function StringFunctionsPage() {
  return (
    <DevToolsShell
      tools={STRING_FUNCTION_TOOL_ORDER}
      activeHref="/string-functions"
      heading="String Functions"
    />
  );
}
