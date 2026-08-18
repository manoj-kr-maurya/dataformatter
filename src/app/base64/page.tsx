import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { BASE64_TOOL_ORDER } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Base64 Tools – Encode & Decode Image, JSON, XML, CSV, Hex, Binary Online",
  description:
    "Free online Base64 tools: image, PNG, JPG, JSON, XML, YAML, CSV, TSV, binary, hex and octal to Base64 — and Base64 back to each format. 100% private — everything runs in your browser.",
  alternates: { canonical: "/base64" },
};

export default function Base64ToolsPage() {
  return <DevToolsShell tools={BASE64_TOOL_ORDER} activeHref="/base64" />;
}