import type { Metadata } from "next";
import Link from "next/link";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { HubContent } from "@/components/seo/hub-content";
import { RANDOM_GENERATOR_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/random-generators");

const faqs = [
  {
    q: "Are the generated values truly random?",
    a: "They are generated in your browser using standard random sources, which is ideal for test data and fixtures. For security-critical material such as keys or passwords, use a dedicated secrets generator instead.",
  },
  {
    q: "What can I generate here?",
    a: "UUIDs, IPv4/IPv6 addresses, times, primes, integers in a range, dates, names, line shuffles and pickers, MAC addresses, hex strings, fractions — plus bulk output as JSON, CSV or TSV for fixtures.",
  },
  {
    q: "How do I generate test data for an API?",
    a: "Pick the JSON generator, describe the shape you need, and paste the output straight into your mock server or test suite. CSV and TSV variants feed spreadsheets and database seeds.",
  },
  {
    q: "Which UUID version should I use?",
    a: "Version 4 (random) is the safe default for identifiers. Other versions trade randomness for sortability or name-based derivation depending on your use case.",
  },
] as const;

export default function RandomGeneratorsPage() {
  return (
    <>
      <DevToolsShell
        tools={RANDOM_GENERATOR_TOOL_ORDER}
        activeHref="/random-generators"
        heading="Random Generators"
      />
      <HubContent
        path="/random-generators"
        intro={
          <>
            <h2 className="text-xl font-semibold tracking-tight">Realistic fake data, generated locally</h2>
            <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
              Test suites live on good fixtures: UUIDs for primary keys, plausible IPs for log
              parsers, prime numbers for algorithm exercises, shuffled lists for pickers. Generate
              them here without scripts or dependencies — everything is produced on-device, so there&apos;s
              no rate limit and nothing about your project leaves the browser.
            </p>
          </>
        }
        tableHeaders={["Need", "Generator"]}
        tableCaption="Random generators and what to use them for"
        tableRows={[
          ["Unique identifiers", "UUID generator (version 4)"],
          ["Network fixtures & log samples", "IPv4 / IPv6 address generators"],
          ["Bulk structured fixtures", <>
            JSON / CSV / TSV generators — format output with the{" "}
            <Link key="jf" href="/json-formatter" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
              JSON Formatter
            </Link>
          </>],
          ["Algorithm practice", "Prime, integer-range and fraction generators"],
          ["Sampling & giveaways", "Line shuffle and name picker"],
          ["Fingerprinting hardware data", "MAC address and hex string generators"],
          [
            "Scripted fixture generation",
            <>
              Take it further with the{" "}
              <Link key="dc" href="/compiler" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                Dart Compiler
              </Link>
            </>,
          ],
        ]}
        faqs={faqs}
      />
    </>
  );
}
