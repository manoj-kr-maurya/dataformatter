import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { STRING_FUNCTION_TOOL_ORDER } from "@/lib/tools";

export const metadata: Metadata = {
  title:
    "String Functions – Upside Down Text, Case Converter, Hash, Hex & More Online",
  description:
    "Free online string utilities: upside down text, random words, NTLM & password generators, string builder, number to words, word counter, reverser, hex/binary converters, case converter, delimited extractor, line/word sorting and removal tools, repeaters and more. 100% private — everything runs in your browser.",
  alternates: { canonical: "/string-functions" },
};

export default function StringFunctionsPage() {
  return <DevToolsShell tools={STRING_FUNCTION_TOOL_ORDER} activeHref="/string-functions" />;
}