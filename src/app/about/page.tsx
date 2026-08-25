import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { Section, Bullets, Faq, FaqJsonLd, UseCases } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/about");

const faqs = [
  {
    q: "Is DataFormatter really free?",
    a: "Yes — every tool on the site is free with no signup, no usage limits and no paywalled features. There is nothing to buy because there is no server doing the work: your own browser is the engine.",
  },
  {
    q: "How can a formatter work without uploading my data?",
    a: "All parsing, formatting, encoding, hashing and execution happens in JavaScript or WebAssembly inside your browser tab. The page you load contains the entire program, so your input never travels over the network.",
  },
  {
    q: "Who maintains DataFormatter?",
    a: "DataFormatter is built and maintained by an independent developer. The fastest way to reach the maintainer is the Contact page, which links straight to the issue tracker where bugs and feature requests are handled.",
  },
  {
    q: "Can I use it for confidential production data?",
    a: "That is exactly what it is designed for. Because nothing you paste or type is uploaded — not to a server, not to analytics — payloads with customer data, tokens and secrets stay on your machine.",
  },
] as const;

export default function AboutPage() {
  return (
    <ToolLandingPage
      path="/about"
      summary="DataFormatter is a free suite of developer tools that runs entirely in your browser. No uploads, no accounts, no telemetry on your data — open a tab, paste your payload, get your result."
    >
      <Section title="Why DataFormatter exists">
        <p>
          Most online formatter sites make you hand your data to a stranger&apos;s server first and
          think about privacy later. DataFormatter flips that around: every tool is built so the
          work happens on your machine, which makes the tools faster (no round-trips) and private
          by architecture rather than by policy.
        </p>
        <p>
          That philosophy shapes everything here — the JSON workspace formats as you type, the
          compiler executes code in a sandboxed WebAssembly engine, and the API client sends
          requests straight from your browser. Nothing you paste is ever transmitted anywhere.
        </p>
      </Section>

      <Section title="What's inside">
        <Bullets
          items={[
            "JSON Formatter, Minifier and Validator — one auto-detecting editor with syntax-aware errors.",
            "Encoding & decoding — Base64 (text, images, hex), URL percent-encoding and HTML entities.",
            "Security utilities — JWT decoder, MD5/SHA-1/SHA-2/SHA-3 hash generators.",
            "Converters & parsers — JSON to XML/YAML/CSV/Java, URL parser, XML and YAML trees.",
            "Online compiler — write and run Dart, JavaScript and TypeScript instantly.",
            "API client — build REST requests, import cURL commands, inspect responses.",
          ]}
        />
      </Section>

      <Section title="Principles">
        <UseCases
          cases={[
            {
              title: "Local-first, always",
              body: "If a feature would need a server to process your data, it doesn't ship until it can run client-side. Privacy is an architecture choice, not a checkbox.",
            },
            {
              title: "Free without asterisks",
              body: "No accounts, no quotas, no 'pro' tier gating the useful half. Developer utilities should be like good CLI tools: pick up and use.",
            },
            {
              title: "Fast by subtraction",
              body: "No cookie walls, no interstitials, no frameworks loading megabytes before first paint. The tool is the page.",
            },
          ]}
        />
      </Section>

      <FaqJsonLd items={faqs} />
      <Section title="Frequently asked questions">
        <Faq items={faqs} />
      </Section>
    </ToolLandingPage>
  );
}
