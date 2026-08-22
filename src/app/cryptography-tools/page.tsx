import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { CRYPTOGRAPHY_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/cryptography-tools");

export default function CryptographyToolsPage() {
  return (
    <DevToolsShell
      tools={CRYPTOGRAPHY_TOOL_ORDER}
      activeHref="/cryptography-tools"
      heading="Cryptography Tools"
    />
  );
}
