import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { RANDOM_GENERATOR_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/random-generators");

export default function RandomGeneratorsPage() {
  return (
    <DevToolsShell
      tools={RANDOM_GENERATOR_TOOL_ORDER}
      activeHref="/random-generators"
      heading="Random Generators"
    />
  );
}
