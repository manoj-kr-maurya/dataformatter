import type { Metadata } from "next";

export const SITE_URL = "https://www.dataformatter.in";
export const SITE_NAME = "DataFormatter";

/**
 * Central SEO registry — the single source of truth for every indexable page's
 * title, description and canonical path. Pages derive their static `metadata`
 * export from `buildMetadata`, the sitemap derives its URL list from
 * `SEO_PAGE_PATHS`, and unit tests assert uniqueness/consistency against this
 * registry so the three can never drift apart.
 *
 * Share URLs (#/share/… fragments carrying user data) are intentionally absent:
 * they are application state, not SEO pages, and must never be listed here.
 */
export interface PageSeo {
  /** Canonical path starting with "/". "/" for the homepage. */
  path: string;
  /** Unique <title>. The layout template appends " | DataFormatter". */
  title: string;
  /** Unique meta description. */
  description: string;
  /** The single <h1> rendered on the page. */
  h1: string;
}

const PAGES: PageSeo[] = [
  {
    path: "/",
    title: "DataFormatter — Online Developer Data Tools",
    description:
      "Format, validate, decode, convert and inspect developer data directly in your browser. JSON, Base64, JWT, URL, hash tools and more — private by design, nothing is uploaded.",
    h1: "DataFormatter",
  },
  {
    path: "/json-formatter",
    title: "JSON Formatter & Pretty Printer — Minify, Validate Online",
    description:
      "Free online JSON formatter and validator. Prettify compact JSON, minify pretty JSON, and validate syntax instantly — 100% private, all in your browser.",
    h1: "JSON Formatter & Pretty Printer",
  },
  {
    path: "/json-minifier",
    title: "JSON Minifier — Minify & Compress JSON Online",
    description:
      "Minify JSON online instantly. Strip whitespace and line breaks to compress JSON to a single line, right in your browser. No upload, no sign-up.",
    h1: "JSON Minifier",
  },
  {
    path: "/json-validator",
    title: "JSON Validator — Check JSON Syntax Online",
    description:
      "Validate JSON online and find syntax errors fast. Pinpoints the exact line and column of invalid JSON — fully client-side, your data never leaves the browser.",
    h1: "JSON Validator",
  },
  {
    path: "/base64-encoder",
    title: "Base64 Encoder — Encode Text to Base64 Online",
    description:
      "Free online Base64 encoder. Encode text, JSON, or any string to Base64 in one click, with exact UTF-8 handling. 100% private — runs entirely in your browser.",
    h1: "Base64 Encoder",
  },
  {
    path: "/base64-decoder",
    title: "Base64 Decoder — Decode Base64 to Text & JSON Online",
    description:
      "Free online Base64 decoder. Decode Base64 back to text or JSON instantly, with automatic detection of base64-encoded JSON. 100% private and runs entirely in your browser.",
    h1: "Base64 Decoder",
  },
  {
    path: "/jwt-decoder",
    title: "JWT Decoder — Decode JWT Header & Payload Online",
    description:
      "Free online JWT decoder. Decode the header and payload of any JWT token instantly — with or without a Bearer prefix. No signature verification. 100% private, in your browser.",
    h1: "JWT Decoder",
  },
  {
    path: "/url-encoder",
    title: "URL Encoder — Encode Text & Query Strings Online",
    description:
      "Encode text for safe use in URLs online. Percent-encode spaces, symbols and Unicode exactly like encodeURIComponent — instantly, privately, in your browser.",
    h1: "URL Encoder",
  },
  {
    path: "/url-decoder",
    title: "URL Decoder — Decode Percent-Encoded Text Online",
    description:
      "Decode percent-encoded URLs and query strings online. Turn %20-style escapes back into readable text instantly — entirely browser-based, nothing uploaded.",
    h1: "URL Decoder",
  },
  {
    path: "/hash-generator",
    title: "Hash Generator — MD5, SHA-256 & SHA-3 Online",
    description:
      "Generate MD5, SHA-1, SHA-2 and SHA-3 hashes of any text online. Checksums computed locally in your browser — no upload, no account, completely private.",
    h1: "Hash Generator",
  },
  {
    path: "/encode-decode",
    title: "Encoding & Decoding Tools – Base32, Base58, Base64, URL, HTML, UTF8 Online",
    description:
      "Free online encoding and decoding tools: Base32, Base58, Base64, URL, JSON URL, HTML, XML URL, UTF8 converter, Hex to UTF8, and JSON encode/decode. 100% private — everything runs in your browser.",
    h1: "Encoding & Decoding Tools",
  },
  {
    path: "/base64",
    title: "Base64 Tools – Encode & Decode Image, JSON, XML, CSV, Hex, Binary Online",
    description:
      "Free online Base64 tools: image, PNG, JPG, JSON, XML, YAML, CSV, TSV, binary, hex and octal to Base64 — and Base64 back to each format. 100% private — everything runs in your browser.",
    h1: "Base64 Tools",
  },
  {
    path: "/json-converter",
    title: "JSON Converters – JSON to Java, XML, YAML, CSV, TSV, Excel, HTML Online",
    description:
      "Free online JSON converters: JSON to Java, XML, YAML, CSV, TSV, plain text, Excel and HTML. 100% private — everything runs in your browser.",
    h1: "JSON Converters",
  },
  {
    path: "/parsers",
    title: "Parsers – URL, JSON, XML & YAML Parser Online",
    description:
      "Free online parsers: break URLs into components, parse JSON into a typed tree, inspect XML element trees and convert YAML to JSON. 100% private — everything runs in your browser.",
    h1: "Parsers",
  },
  {
    path: "/random-generators",
    title: "Random Generators – IP, UUID, JSON, CSV, Number, String & More Online",
    description:
      "Free online random generators: IP addresses, times, UUIDs, JSON, XML, regex data, CSV, numbers, integers, primes, dates, bitmaps, name pickers, line shufflers, MAC addresses, hex, TSV, strings, fractions and more. 100% private — everything runs in your browser.",
    h1: "Random Generators",
  },
  {
    path: "/string-functions",
    title: "String Functions – Upside Down Text, Case Converter, Hash, Hex & More Online",
    description:
      "Free online string utilities: upside down text, random words, NTLM & password generators, string builder, number to words, word counter, reverser, hex/binary converters, case converter, delimited extractor, line/word sorting and removal tools, repeaters and more. 100% private — everything runs in your browser.",
    h1: "String Functions",
  },
  {
    path: "/cryptography-tools",
    title: "Cryptography Tools – MD5, SHA-1, SHA-2, SHA-3 Hash Generator Online",
    description:
      "Free online cryptography tools: compute MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256, SHA3-224, SHA3-256, SHA3-384 and SHA3-512 hashes of any text. 100% private — everything runs in your browser.",
    h1: "Cryptography Tools",
  },
  {
    path: "/compiler",
    title: "Online Dart Compiler — Run Dart in Your Browser",
    description:
      "Free online Dart compiler and playground. Write, compile and run Dart code instantly — entirely in your browser via WebAssembly. No server, no sign-up, nothing uploaded. Includes stdin input and shareable links.",
    h1: "Online Dart Compiler",
  },
];

export const SEO_PAGES: ReadonlyMap<string, PageSeo> = new Map(
  PAGES.map((page) => [page.path, page]),
);

/** Every indexable canonical path — drives sitemap.xml. */
export const SEO_PAGE_PATHS: readonly string[] = PAGES.map((page) => page.path);

/** Compact primary nav shown in the header of content/tool landing pages. */
export const HEADER_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/json-formatter", label: "JSON Formatter" },
  { href: "/json-minifier", label: "JSON Minifier" },
  { href: "/base64-encoder", label: "Base64 Encoder" },
  { href: "/base64-decoder", label: "Base64 Decoder" },
  { href: "/jwt-decoder", label: "JWT Decoder" },
  { href: "/encode-decode", label: "Encoding Tools" },
  { href: "/cryptography-tools", label: "Hashes" },
];

/** Full footer navigation — every important crawlable page, kept concise. */
export const FOOTER_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "DevTools Home" },
  { href: "/json-formatter", label: "JSON Formatter" },
  { href: "/json-minifier", label: "JSON Minifier" },
  { href: "/json-validator", label: "JSON Validator" },
  { href: "/base64-encoder", label: "Base64 Encoder" },
  { href: "/base64-decoder", label: "Base64 Decoder" },
  { href: "/jwt-decoder", label: "JWT Decoder" },
  { href: "/url-encoder", label: "URL Encoder" },
  { href: "/url-decoder", label: "URL Decoder" },
  { href: "/hash-generator", label: "Hash Generator" },
  { href: "/encode-decode", label: "Encoding Tools" },
  { href: "/base64", label: "Base64 Tools" },
  { href: "/json-converter", label: "JSON Converters" },
  { href: "/parsers", label: "Parsers" },
  { href: "/random-generators", label: "Random Tools" },
  { href: "/string-functions", label: "String Functions" },
  { href: "/cryptography-tools", label: "Cryptography" },
  { href: "/compiler", label: "Dart Compiler" },
];

/** Tool-specific internal link graph — descriptive anchors, real routes only. */
export const RELATED_LINKS: Readonly<Record<string, ReadonlyArray<{ href: string; label: string }>>> = {
  "/json-formatter": [
    { href: "/json-minifier", label: "JSON Minifier" },
    { href: "/json-validator", label: "JSON Validator" },
    { href: "/parsers", label: "JSON Parser" },
    { href: "/base64", label: "JSON → Base64" },
  ],
  "/json-minifier": [
    { href: "/json-formatter", label: "JSON Formatter" },
    { href: "/json-validator", label: "JSON Validator" },
    { href: "/json-converter", label: "JSON Converters" },
  ],
  "/json-validator": [
    { href: "/json-formatter", label: "JSON Formatter" },
    { href: "/json-minifier", label: "JSON Minifier" },
    { href: "/parsers", label: "Parsers" },
  ],
  "/base64-encoder": [
    { href: "/base64-decoder", label: "Base64 Decoder" },
    { href: "/base64", label: "Image to Base64" },
    { href: "/jwt-decoder", label: "JWT Decoder" },
  ],
  "/base64-decoder": [
    { href: "/base64-encoder", label: "Base64 Encoder" },
    { href: "/base64", label: "Base64 → JSON" },
    { href: "/jwt-decoder", label: "JWT Decoder" },
  ],
  "/jwt-decoder": [
    { href: "/base64-decoder", label: "Base64 Decoder" },
    { href: "/json-formatter", label: "JSON Formatter" },
    { href: "/url-decoder", label: "URL Decoder" },
  ],
  "/url-encoder": [
    { href: "/url-decoder", label: "URL Decoder" },
    { href: "/parsers", label: "URL Parser" },
    { href: "/encode-decode", label: "All Encoding Tools" },
  ],
  "/url-decoder": [
    { href: "/url-encoder", label: "URL Encoder" },
    { href: "/parsers", label: "URL Parser" },
    { href: "/jwt-decoder", label: "JWT Decoder" },
  ],
  "/hash-generator": [
    { href: "/cryptography-tools", label: "All Cryptography Tools" },
    { href: "/string-functions", label: "Password Generator" },
    { href: "/random-generators", label: "UUID Generator" },
  ],
};

/**
 * Build complete static page metadata from the registry: unique title,
 * description, self-canonical, Open Graph and Twitter cards. Exported as a
 * plain object so it stays valid static metadata (no runtime work).
 */
export function buildMetadata(path: string): Metadata {
  const page = SEO_PAGES.get(path);
  if (!page) {
    throw new Error(`buildMetadata: unknown page "${path}"`);
  }
  const ogTitle = `${page.title} | ${SITE_NAME}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      title: ogTitle,
      description: page.description,
      url: page.path,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: page.description,
    },
  };
}

export interface FaqEntry {
  q: string;
  a: string;
}

/** FAQPage structured data mirroring the visible FAQ list exactly. */
export function faqJsonLd(items: ReadonlyArray<FaqEntry>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * Serialize structured data for safe embedding in a <script type="application/ld+json">
 * tag: "<", ">", and "&" are escaped so no user-derived string can break out
 * into executable markup.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Site-level WebSite entity for brand searches. */
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "dataformatter.in",
    url: SITE_URL,
  };
}
