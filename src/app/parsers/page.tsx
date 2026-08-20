import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { PARSER_TOOL_ORDER } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Parsers – URL, JSON, XML & YAML Parser Online",
  description:
    "Free online parsers: break URLs into components, parse JSON into a typed tree, inspect XML element trees and convert YAML to JSON. 100% private — everything runs in your browser.",
  alternates: { canonical: "/parsers" },
};

export default function ParsersPage() {
  return <DevToolsShell tools={PARSER_TOOL_ORDER} activeHref="/parsers" />;
}