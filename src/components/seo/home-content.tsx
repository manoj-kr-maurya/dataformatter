import Link from "next/link";
import { Bullets, Section } from "@/components/seo/content-blocks";

const popularTools: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/json-formatter", label: "JSON Formatter" },
  { href: "/json-validator", label: "JSON Validator" },
  { href: "/json-minifier", label: "JSON Minifier" },
  { href: "/json-diff", label: "JSON Diff" },
  { href: "/json-to-csv", label: "JSON to CSV" },
  { href: "/json-to-yaml", label: "JSON to YAML" },
  { href: "/base64-encoder", label: "Base64 Encoder" },
  { href: "/base64-decoder", label: "Base64 Decoder" },
  { href: "/jwt-decoder", label: "JWT Decoder" },
  { href: "/url-encoder", label: "URL Encoder" },
  { href: "/url-decoder", label: "URL Decoder" },
  { href: "/hash-generator", label: "Hash Generator" },
  { href: "/uuid-generator", label: "UUID Generator" },
  { href: "/regex", label: "Regex Tester" },
  { href: "/timestamp", label: "Timestamp Converter" },
  { href: "/cron", label: "Cron Helper" },
];

const hubLinks: ReadonlyArray<{ href: string; label: string; blurb: string }> = [
  { href: "/encode-decode", label: "Encoding & Decoding Tools", blurb: "Base32, Base58, Base64, URL, HTML and UTF-8 in one workspace." },
  { href: "/base64", label: "Base64 Tools", blurb: "Images, JSON, hex and binary to Base64 and back again." },
  { href: "/json-converter", label: "JSON Converters", blurb: "JSON into YAML, CSV, TSV, XML, Excel, Java, HTML and more." },
  { href: "/parsers", label: "Parsers", blurb: "URL components, JSON trees, XML element trees and YAML." },
  { href: "/random-generators", label: "Random Generators", blurb: "UUIDs, IPs, numbers, dates and realistic test data." },
  { href: "/string-functions", label: "String Functions", blurb: "Case, reverse, count, sort and 20+ more text utilities." },
  { href: "/cryptography-tools", label: "Cryptography Tools", blurb: "MD5 through SHA-512 and the SHA-3 family." },
  { href: "/compiler", label: "Online Compiler", blurb: "Write and run Dart, JavaScript and TypeScript in-browser." },
  { href: "/api-client", label: "API Client", blurb: "Build and send REST requests straight from your browser." },
];

/** Crawlable homepage content rendered below the app shell — single targeted
 *  H1, an intro, the core-tool grid and the privacy positioning. Kept short so
 *  the interactive workspace stays the primary experience. */
export function HomeContent() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Privacy-First Developer Tools
      </h1>
      <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        Format JSON, decode JWTs, convert Base64 and URL, hash text, compile code and test APIs —
        all in one fast workspace that runs entirely in your browser. DataFormatter keeps your
        data private by design: nothing you paste is ever uploaded to a server. No accounts, no
        signup, no usage limits.
      </p>

      <Section title="Popular developer tools">
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {popularTools.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="block rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
              >
                {tool.label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Why DataFormatter?">
        <Bullets
          items={[
            "Runs in your browser — every tool is pure client-side JavaScript; there is no upload step for processing to happen.",
            "Free and unlimited — no accounts, no signup and no usage caps on any page.",
            "Fast — results compute in milliseconds because there is no round trip to a server.",
            "Private by design — data stays in your tab; share links are local URL fragments, never server storage.",
          ]}
        />
      </Section>

      <Section title="Explore the toolbox">
        <ul className="mt-2 space-y-3">
          {hubLinks.map((hub) => (
            <li key={hub.href}>
              <Link
                href={hub.href}
                className="group block rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-violet-400 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-violet-500"
              >
                <span className="text-sm font-semibold text-zinc-800 group-hover:text-violet-700 dark:text-zinc-200 dark:group-hover:text-violet-300">
                  {hub.label}
                </span>
                <span className="mt-0.5 block text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {hub.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}