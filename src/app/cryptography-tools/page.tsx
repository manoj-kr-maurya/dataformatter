import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { CRYPTOGRAPHY_TOOL_ORDER } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Cryptography Tools – MD5, SHA-1, SHA-2, SHA-3 Hash Generator Online",
  description:
    "Free online cryptography tools: compute MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256, SHA3-224, SHA3-256, SHA3-384 and SHA3-512 hashes of any text. 100% private — everything runs in your browser.",
  alternates: { canonical: "/cryptography-tools" },
};

export default function CryptographyToolsPage() {
  return <DevToolsShell tools={CRYPTOGRAPHY_TOOL_ORDER} activeHref="/cryptography-tools" />;
}