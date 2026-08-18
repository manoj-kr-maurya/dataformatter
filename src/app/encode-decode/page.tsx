import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { ENCODE_DECODE_TOOL_ORDER } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Encoding & Decoding Tools – Base32, Base58, Base64, URL, HTML, UTF8 Online",
  description:
    "Free online encoding and decoding tools: Base32, Base58, Base64, URL, JSON URL, HTML, XML URL, UTF8 converter, Hex to UTF8, and JSON encode/decode. 100% private — everything runs in your browser.",
  alternates: { canonical: "/encode-decode" },
};

export default function EncodeDecodePage() {
  return (
    <DevToolsShell tools={ENCODE_DECODE_TOOL_ORDER} activeHref="/encode-decode" />
  );
}