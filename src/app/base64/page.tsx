import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { BASE64_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/base64");

export default function Base64ToolsPage() {
  return (
    <DevToolsShell tools={BASE64_TOOL_ORDER} activeHref="/base64" heading="Base64 Tools" />
  );
}
