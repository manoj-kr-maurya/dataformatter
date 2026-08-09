import type { Metadata } from "next";
import { ContentPage } from "@/components/seo/content-page";
import { Section, Bullets, Faq, Cta } from "@/components/seo/content-blocks";

export const metadata: Metadata = {
  title: "JSON Formatter & Pretty Printer — Minify, Validate Online",
  description:
    "Free online JSON formatter and validator. Prettify compact JSON, minify pretty JSON, and validate syntax instantly — 100% private, all in your browser.",
  alternates: { canonical: "/json-formatter" },
};

const faqs = [
  {
    q: "What is a JSON formatter?",
    a: "A JSON formatter takes compact or minified JSON and re-writes it with readable indentation and line breaks, making nested objects and arrays easy to scan.",
  },
  {
    q: "Is this JSON formatter free and safe to use?",
    a: "Yes. The tool is free, requires no account, and runs entirely in your browser. Your JSON is never sent to a server.",
  },
  {
    q: "Can it also minify JSON or validate it?",
    a: "Yes. Use the tools in the app for JSON Minify and JSON validation. Invalid JSON is reported with a clear message instead of failing silently.",
  },
];

export default function JsonFormatterPage() {
  return (
    <ContentPage
      pageTitle="JSON Formatter & Pretty Printer"
      summary="Prettify, minify, and validate JSON online in one click. Paste compact JSON and this free tool reformats it with clean indentation instantly — or switch to JSON Minify to compress it back. Every operation runs locally in your browser."
    >
      <Section title="Why format JSON?">
        <p>
          JSON is the most common data format for APIs, configuration files, and storage. When it
          arrives minified on a single line, it is hard to read: nested objects blur together and
          syntax mistakes are easy to miss. A <strong>JSON formatter</strong> reformats the data so
          every key, array, and value sits on its own readable line.
        </p>
        <p>
          This page is the documentation for the free JSON formatting, validation, and minification
          tool built into DataFormatter — paste JSON into the editor and everything is detected and
          formatted automatically.
        </p>
      </Section>

      <Section title="How to format JSON online">
        <Bullets
          items={[
            "Open the free JSON formatter tool from DataFormatter.",
            "Paste your compact JSON, or type it directly into the editor.",
            "The JSON is detected automatically and pretty-printed with 2-space indentation.",
            "Optionally switch to JSON Minify to compact it, or validate that your JSON is well-formed.",
          ]}
        />
      </Section>

      <Section title="Features">
        <Bullets
          items={[
            "Automatic JSON detection — no setup required",
            "Pretty-print with standard 2-space indentation",
            "JSON minifier to compress output back to a single line",
            "Same-page validation with clear error messages",
            "Line numbers, bracket matching, and folding in the editor",
            "100% client-side: your data never leaves the browser",
          ]}
        />
      </Section>

      <Faq items={faqs} />

      <Cta label="Open the free JSON Formatter tool" href="/" />
    </ContentPage>
  );
}