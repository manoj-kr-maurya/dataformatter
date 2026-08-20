import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { RANDOM_GENERATOR_TOOL_ORDER } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Random Generators – IP, UUID, JSON, CSV, Number, String & More Online",
  description:
    "Free online random generators: IP addresses, times, UUIDs, JSON, XML, regex data, CSV, numbers, integers, primes, dates, bitmaps, name pickers, line shufflers, MAC addresses, hex, TSV, strings, fractions and more. 100% private — everything runs in your browser.",
  alternates: { canonical: "/random-generators" },
};

export default function RandomGeneratorsPage() {
  return <DevToolsShell tools={RANDOM_GENERATOR_TOOL_ORDER} activeHref="/random-generators" />;
}