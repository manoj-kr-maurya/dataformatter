import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { ENCODE_DECODE_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/encode-decode");

export default function EncodeDecodePage() {
  return (
    <DevToolsShell
      tools={ENCODE_DECODE_TOOL_ORDER}
      activeHref="/encode-decode"
      heading="Encoding & Decoding Tools"
    />
  );
}
