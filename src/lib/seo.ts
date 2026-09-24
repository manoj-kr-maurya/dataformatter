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

/**
 * GEO (Generative Engine Optimization) answers for a tool page — concise,
 * answer-first copy that makes it trivially easy for AI systems (and
 * featured-snippet engines) to state what a tool is, who it is for and what
 * makes DataFormatter's version different. Each statement is technically
 * accurate to the implementation; no unsupported claims.
 */
export interface GeoDatum {
  /** Definitional first sentence: "X is a free online … that …" */
  what: string;
  /** Who is this tool for. */
  who: string;
  /** What makes DataFormatter's tool different (privacy/local processing etc.). */
  different: string;
}

const PAGES: PageSeo[] = [
  {
    path: "/",
    title: "Privacy-First Developer Tools – Free & No Signup",
    description:
      "Format JSON, decode JWTs, convert Base64, generate UUIDs and debug HTTP in one fast workspace. Runs 100% in your browser — nothing you paste is ever uploaded.",
    h1: "Privacy-First Developer Tools",
  },
  {
    path: "/json-formatter",
    title: "JSON Formatter Online – Beautify, Pretty Print & Validate",
    description:
      "Prettify messy JSON with clean 2-space indentation, then validate or minify it in one place. Runs entirely in your browser — nothing is ever uploaded.",
    h1: "JSON Formatter & Pretty Printer",
  },
  {
    path: "/json-minifier",
    title: "JSON Minifier – Compress JSON to One Line",
    description:
      "Strip whitespace and newlines to compress JSON for production configs and API payloads. Instant and lossless, fully client-side — your data stays local.",
    h1: "JSON Minifier",
  },
  {
    path: "/json-validator",
    title: "JSON Validator – Find Syntax Errors Fast",
    description:
      "Check JSON against RFC 8259 and jump straight to the exact line and column of any syntax error. Validation happens in your browser — nothing is sent anywhere.",
    h1: "JSON Validator",
  },
  {
    path: "/base64-encoder",
    title: "Base64 Encoder – Encode Text Online Free",
    description:
      "Encode text, JSON or tokens to Base64 with exact UTF-8 handling for emoji and non-Latin scripts. Free, no signup — your input never leaves the browser.",
    h1: "Base64 Encoder",
  },
  {
    path: "/base64-decoder",
    title: "Base64 Decoder – Decode to Text or JSON",
    description:
      "Paste any Base64 string to get readable text back — embedded JSON is pretty-printed automatically. Decoding runs locally; your data never touches a server.",
    h1: "Base64 Decoder",
  },
  {
    path: "/jwt-decoder",
    title: "JWT Decoder – Inspect Header & Payload Safely",
    description:
      "Decode any JWT's header and payload into readable JSON — Bearer prefixes handled automatically. 100% local decoding; tokens are never sent to a server.",
    h1: "JWT Decoder",
  },
  {
    path: "/url-encoder",
    title: "URL Encoder – Percent-Encoding Online",
    description:
      "Escape spaces, symbols and Unicode exactly like encodeURIComponent before putting values in links or APIs. Instant and private — everything runs locally.",
    h1: "URL Encoder",
  },
  {
    path: "/url-decoder",
    title: "URL Decoder – Decode Percent-Encoded Text",
    description:
      "Turn %20-style escapes back into readable text, including multi-byte emoji and accented characters. Perfect for debugging tracked links — fully browser-based.",
    h1: "URL Decoder",
  },
  {
    path: "/hash-generator",
    title: "Hash Generator – MD5, SHA-256 & SHA-3",
    description:
      "Compute MD5, SHA-1, SHA-2 and SHA-3 checksum digests of any text instantly. Every digest is calculated in your browser — sensitive input is never uploaded.",
    h1: "Hash Generator",
  },
  {
    path: "/encode-decode",
    title: "Encoding & Decoding Tools – Base64, URL & HTML",
    description:
      "One workspace for Base32, Base58, Base64, URL, HTML and UTF-8 encoding plus JSON encode/decode. Switch tools instantly — all processing stays in your browser.",
    h1: "Encoding & Decoding Tools",
  },
  {
    path: "/base64",
    title: "Base64 Tools – Images, JSON, Hex & Binary",
    description:
      "Convert images, PNG/JPG files, JSON, XML, CSV, hex, binary and octal to Base64 — and back again. Every conversion runs client-side, so files are never uploaded.",
    h1: "Base64 Tools",
  },
  {
    path: "/json-converter",
    title: "JSON Converters – To XML, YAML, CSV & Java",
    description:
      "Turn JSON into Java classes, XML, YAML, CSV, TSV, Excel-ready tables, HTML or plain text. Paste once and convert — no uploads, everything runs in-browser.",
    h1: "JSON Converters",
  },
  {
    path: "/parsers",
    title: "Online Parsers – URL, JSON, XML & YAML",
    description:
      "Break URLs into components, parse JSON into a typed tree, inspect XML element trees or convert YAML to JSON. Fast, free and completely browser-based.",
    h1: "Parsers",
  },
  {
    path: "/random-generators",
    title: "Random Generators – UUID, IP, Numbers & Data",
    description:
      "Generate UUIDs, IP addresses, primes, dates, names, MAC addresses and realistic test data as JSON or CSV. Runs on-device — output never leaves your browser.",
    h1: "Random Generators",
  },
  {
    path: "/string-functions",
    title: "String Functions – Case, Reverse, Count & More",
    description:
      "Change case, reverse, repeat, sort and count words; convert numbers to words; flip text upside down and more — 20+ string utilities in one private tab.",
    h1: "String Functions",
  },
  {
    path: "/cryptography-tools",
    title: "Cryptography Tools – SHA & MD5 Hash Generators",
    description:
      "Compute every common digest from MD5 through SHA-512 and the SHA-3 family for checksums and integrity checks. Local-only processing, free, no account.",
    h1: "Cryptography Tools",
  },
  {
    path: "/md5-generator",
    title: "MD5 Generator – Create MD5 Hash Online",
    description:
      "Generate an MD5 checksum of any text instantly as a 32-character lowercase hex string. The digest is computed in your browser — nothing you paste is ever uploaded.",
    h1: "MD5 Generator",
  },
  {
    path: "/sha256-generator",
    title: "SHA-256 Generator – Hash & Verify Online",
    description:
      "Compute a SHA-256 hash of any text in your browser — a 64-character lowercase hex digest, instant as you type. Free, no signup, and your input never leaves the page.",
    h1: "SHA-256 Generator",
  },
  {
    path: "/compiler",
    title: "Online Dart, JS & TypeScript Compiler – Run in Browser",
    description:
      "Write, compile and run Dart, JavaScript or TypeScript instantly in your browser — Dart via WebAssembly, JS/TS in a sandboxed worker. No signup; code never leaves your machine.",
    h1: "Online Dart, JavaScript & TypeScript Compiler",
  },
  {
    path: "/api-client",
    title: "Free Online API Client – Test REST Requests",
    description:
      "Build GET, POST, PUT and DELETE requests with headers, auth and JSON bodies, sent straight from your browser. Import cURL commands — no proxy, no signup.",
    h1: "Online API Client",
  },
  {
    path: "/about",
    title: "About DataFormatter – Free, Private, Browser-Based Dev Tools",
    description:
      "DataFormatter is a free suite of browser-based developer tools — JSON, Base64, JWT, hashes, compilers and an API client. Everything runs locally in your tab by design: no uploads, no accounts, no data collection.",
    h1: "About DataFormatter",
  },
  {
    path: "/contact",
    title: "Contact DataFormatter – Feedback, Bugs & Feature Requests",
    description:
      "Found a bug, have a feature idea or just want to say hi? Open an issue on the DataFormatter repository — every report lands in front of the maintainer who builds the tools.",
    h1: "Contact DataFormatter",
  },
  {
    path: "/privacy",
    title: "Privacy Policy – DataFormatter Keeps Your Data in Your Browser",
    description:
      "DataFormatter runs entirely in your browser: no server-side processing, no analytics, no cookies, no accounts and nothing you paste is ever transmitted. Read the simple privacy policy.",
    h1: "Privacy Policy",
  },
  {
    path: "/json-diff",
    title: "JSON Diff – Compare Two JSON Files Online",
    description:
      "Compare two JSON documents side by side and get a precise list of added, removed and changed values as dot paths. Runs entirely in your browser — nothing you paste is uploaded.",
    h1: "JSON Diff",
  },
  {
    path: "/json-to-code",
    title: "JSON to Code – Generate Types for TS, Java, Go & More",
    description:
      "Turn any JSON sample into TypeScript interfaces, Java classes, C#, Go structs, Python dataclasses, Kotlin, Swift or Dart. Free, no signup, and fully local so payloads stay private.",
    h1: "JSON to Code",
  },
  {
    path: "/json-to-schema",
    title: "JSON to Schema – JSON Schema, Zod, Pydantic & OpenAPI",
    description:
      "Derive validation schemas from JSON samples: JSON Schema, Zod, Pydantic, OpenAPI or a NestJS DTO. Multiple samples teach it which fields are optional — all local, no uploads.",
    h1: "JSON to Schema",
  },
  {
    path: "/curl-to-code",
    title: "cURL to Code – Convert Commands to JS, Python & Java",
    description:
      "Paste any cURL command and get JavaScript fetch, Axios, Python requests, Java, Go, C# or PHP in one click. Faithful parsing of headers, auth, query and body — done locally.",
    h1: "cURL to Code",
  },
  {
    path: "/api-tester",
    title: "API Tester – Send & Debug HTTP Requests in Your Browser",
    description:
      "Build and send GET, POST, PUT and DELETE requests with headers, auth and JSON bodies straight from your browser. No proxy, no signup — requests go directly to the endpoint.",
    h1: "Online API Tester",
  },
  {
    path: "/openapi",
    title: "OpenAPI Viewer & Workbench – Explore, Validate & Generate Code",
    description:
      "Paste or upload an OpenAPI 3.0/3.1 JSON or YAML document and explore every endpoint and schema, validate structure, and generate cURL, fetch, Axios and TypeScript code. Runs entirely in your browser — nothing is uploaded.",
    h1: "OpenAPI Viewer & Workbench",
  },
  {
    path: "/http-header-inspector",
    title: "HTTP Header Inspector – Analyze Security & Caching Headers",
    description:
      "Paste a raw header block and get categorized findings: cache control, cookies, CORS, HSTS and security headers with honest ok/warn/error notes. Runs locally — nothing is uploaded.",
    h1: "HTTP Header Inspector",
  },
  {
    path: "/log-analyzer",
    title: "Log Analyzer – Count Errors & Spot Spikes in Logs",
    description:
      "Paste up to 50,000 log lines and get level counts, deduplicated error groups and an hourly timeline. Entirely browser-based, so server logs with real data never leave your machine.",
    h1: "Log Analyzer",
  },
  {
    path: "/stack-trace",
    title: "Stack Trace Formatter & Reader – Parse Java, JS, Python & Go",
    description:
      "Paste a Java, JavaScript/Node, Python or Go stack trace to get the exception, the first project frame and a clean call chain. Detection is automatic and parsing happens locally.",
    h1: "Stack Trace Reader",
  },
  {
    path: "/env-validator",
    title: "ENV Validator – Check & Compare .env Files Online",
    description:
      "Validate .env syntax, duplicates and formatting, then diff your local file against your .env.example. All analysis happens in your browser — secret values are never uploaded.",
    h1: "ENV Validator",
  },
  {
    path: "/cron",
    title: "Cron Expression Helper – Validate, Describe & Schedule",
    description:
      "Validate 5- and 6-field cron expressions, read them in plain English, and list the next or previous runs in any time zone. DST-aware and fully client-side — nothing is uploaded.",
    h1: "Cron Expression Helper",
  },
  {
    path: "/timestamp",
    title: "Unix Timestamp Converter – Epoch & ISO Online",
    description:
      "Convert Unix seconds or milliseconds, ISO-8601 and HTTP dates into every epoch unit plus readable local and UTC forms. Auto-detection, live relative age — all computed in your browser.",
    h1: "Timestamp Converter",
  },
  {
    path: "/regex",
    title: "Regex Tester – Build & Test Regular Expressions Online",
    description:
      "Test regular expressions with the browser's own engine: instant validity, every match with position and capture groups, and a per-line mode for log auditing. 100% client-side.",
    h1: "Regular Expression Tester",
  },
  {
    path: "/fake-data",
    title: "Fake Data Generator – Realistic Rows for Tests & Demos",
    description:
      "Generate realistic fake data — names, emails, UUIDs, IPs, dates and more — as tables, JSON or CSV. Seeded output is reproducible, and generation runs entirely in your browser.",
    h1: "Fake Data Generator",
  },
  {
    path: "/developer-calculator",
    title: "Developer Calculator – Bitwise, Hex, Integer Widths & CRC-32",
    description:
      "Evaluate expressions with hex, binary and bitwise operators, convert between radices with masking, model 8/16/32/64-bit integer overflow, estimate latency and API traffic, and measure byte sizes — all locally in your browser.",
    h1: "Developer Calculator",
  },
  {
    path: "/json-to-csv",
    title: "JSON to CSV Converter – Flatten JSON to CSV Rows",
    description:
      "Convert an array of JSON objects into clean CSV: one header column per key, quoted and escaped cells, empty cells for missing fields. Ready for Excel or BigQuery — conversion runs entirely in your browser.",
    h1: "JSON to CSV Converter",
  },
  {
    path: "/json-to-yaml",
    title: "JSON to YAML Converter – Generate YAML from JSON",
    description:
      "Turn JSON into indentation-based YAML for Docker Compose, Kubernetes manifests, CI configs and Ansible. Handles nested objects, arrays and quoting — free, private and computed locally in your tab.",
    h1: "JSON to YAML Converter",
  },
  {
    path: "/json-to-xml",
    title: "JSON to XML Converter – Generate XML from JSON",
    description:
      "Turn JSON into well-formed XML: object keys become element names, arrays become repeated tags, text and names are escaped automatically. Paste once and convert — free, private and 100% in-browser.",
    h1: "JSON to XML Converter",
  },
  {
    path: "/json-to-java",
    title: "JSON to Java – Generate POJO Classes Online",
    description:
      "Convert a JSON object into Java POJO classes with private fields, constructors and getters/setters. Nested objects and arrays become nested classes and List<T> — free, local and no upload.",
    h1: "JSON to Java",
  },
  {
    path: "/uuid-generator",
    title: "UUID Generator – Create Random UUID v4 Online",
    description:
      "Generate one or more random UUID v4 identifiers straight from your browser — RFC 4122 format, lowercase hex, ready for database keys, API mocks and test fixtures. Fully client-side: nothing you generate is uploaded.",
    h1: "UUID Generator",
  },
  {
    path: "/har",
    title: "HAR Viewer & Debugger – Open & Analyze HAR Files Online",
    description:
      "Open a HAR file and get failed and slow requests, timings, status groups, auth and security observations instantly — virtualized list, waterfall bars and privacy-safe sanitize & export. Runs entirely in your browser.",
    h1: "HAR Debugger",
  },
  {
    path: "/api-diff",
    title: "API Breaking Change Detector – Compare JSON API Contracts",
    description:
      "Compare two JSON APIs or schemas and get every difference classified as breaking, potentially-breaking, non-breaking or informational — new required fields, enum removals and shape flips flagged first. Local and free.",
    h1: "API Breaking Change Detector",
  },
  {
    path: "/error-workspace",
    title: "Error Workspace – Correlate Stack Traces & Logs",
    description:
      "Paste a stack trace, service logs and the failing request and response to get one correlated, prioritized debugging session — with runnable reproduction code, trace-ID linking and Markdown/JSON export. Everything stays in your browser.",
    h1: "Production Error Workspace",
  },
];

export const SEO_PAGES: ReadonlyMap<string, PageSeo> = new Map(
  PAGES.map((page) => [page.path, page]),
);

/** Every indexable canonical path — drives sitemap.xml. */
export const SEO_PAGE_PATHS: readonly string[] = PAGES.map((page) => page.path);

/**
 * Real last-modified dates per page (YYYY-MM-DD), derived from the last commit
 * that touched each page directory. These drive the sitemap's <lastmod> so
 * crawlers get honest freshness signals instead of "today on every request".
 * Meaningful content changes bump a page's date; the dates never auto-move.
 */
export const PAGE_LAST_MODIFIED: Readonly<Record<string, string>> = {
  "/": "2026-09-24",
  "/json-formatter": "2026-09-24",
  "/json-minifier": "2026-09-24",
  "/json-validator": "2026-09-24",
  "/base64-encoder": "2026-08-23",
  "/base64-decoder": "2026-08-23",
  "/jwt-decoder": "2026-08-23",
  "/url-encoder": "2026-08-23",
  "/url-decoder": "2026-08-23",
  "/hash-generator": "2026-08-23",
  "/encode-decode": "2026-08-23",
  "/base64": "2026-08-23",
  "/json-converter": "2026-08-30",
  "/parsers": "2026-08-23",
  "/random-generators": "2026-08-30",
  "/string-functions": "2026-08-23",
  "/cryptography-tools": "2026-08-23",
  "/compiler": "2026-09-15",
  "/api-client": "2026-09-06",
  "/about": "2026-08-25",
  "/contact": "2026-08-25",
  "/privacy": "2026-09-24",
  "/json-diff": "2026-09-05",
  "/json-to-code": "2026-09-05",
  "/json-to-schema": "2026-09-05",
  "/curl-to-code": "2026-09-05",
  "/api-tester": "2026-09-06",
  "/openapi": "2026-09-06",
  "/http-header-inspector": "2026-08-30",
  "/log-analyzer": "2026-09-05",
  "/stack-trace": "2026-09-15",
  "/env-validator": "2026-09-05",
  "/cron": "2026-08-30",
  "/timestamp": "2026-09-24",
  "/regex": "2026-09-05",
  "/fake-data": "2026-08-30",
  "/developer-calculator": "2026-09-24",
  "/json-to-csv": "2026-08-30",
  "/json-to-yaml": "2026-08-30",
  "/json-to-xml": "2026-09-24",
  "/json-to-java": "2026-09-24",
  "/uuid-generator": "2026-08-30",
  "/har": "2026-09-24",
  "/api-diff": "2026-09-24",
  "/error-workspace": "2026-09-24",
  "/md5-generator": "2026-09-24",
  "/sha256-generator": "2026-09-24",
};

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
  { href: "/blog", label: "Blog" },
  { href: "/json-formatter", label: "JSON Formatter" },
  { href: "/json-minifier", label: "JSON Minifier" },
  { href: "/json-validator", label: "JSON Validator" },
  { href: "/base64-encoder", label: "Base64 Encoder" },
  { href: "/base64-decoder", label: "Base64 Decoder" },
  { href: "/jwt-decoder", label: "JWT Decoder" },
  { href: "/url-encoder", label: "URL Encoder" },
  { href: "/url-decoder", label: "URL Decoder" },
  { href: "/hash-generator", label: "Hash Generator" },
  { href: "/md5-generator", label: "MD5 Generator" },
  { href: "/sha256-generator", label: "SHA-256 Generator" },
  { href: "/encode-decode", label: "Encoding Tools" },
  { href: "/base64", label: "Base64 Tools" },
  { href: "/json-converter", label: "JSON Converters" },
  { href: "/parsers", label: "Parsers" },
  { href: "/random-generators", label: "Random Tools" },
  { href: "/string-functions", label: "String Functions" },
  { href: "/cryptography-tools", label: "Cryptography" },
  { href: "/compiler", label: "Dart Compiler" },
  { href: "/api-client", label: "API Client" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/json-diff", label: "JSON Diff" },
  { href: "/json-to-code", label: "JSON to Code" },
  { href: "/json-to-schema", label: "JSON to Schema" },
  { href: "/curl-to-code", label: "cURL to Code" },
  { href: "/api-tester", label: "API Tester" },
  { href: "/openapi", label: "OpenAPI Workbench" },
  { href: "/http-header-inspector", label: "Header Inspector" },
  { href: "/log-analyzer", label: "Log Analyzer" },
  { href: "/stack-trace", label: "Stack Trace" },
  { href: "/env-validator", label: "ENV Validator" },
  { href: "/cron", label: "Cron Helper" },
  { href: "/timestamp", label: "Timestamp" },
  { href: "/regex", label: "Regex Tester" },
  { href: "/fake-data", label: "Fake Data" },
  { href: "/developer-calculator", label: "Dev Calculator" },
  { href: "/json-to-csv", label: "JSON to CSV" },
  { href: "/json-to-yaml", label: "JSON to YAML" },
  { href: "/json-to-xml", label: "JSON to XML" },
  { href: "/json-to-java", label: "JSON to Java" },
  { href: "/uuid-generator", label: "UUID Generator" },
  { href: "/har", label: "HAR Debugger" },
  { href: "/api-diff", label: "API Breaking Change Detector" },
  { href: "/error-workspace", label: "Error Workspace" },
];

/** Tool-specific internal link graph — descriptive anchors, real routes only.
 *  Curated along developer workflows (encode↔decode pairs, format→validate→
 *  ship chains) rather than alphabetically, so authority flows through the
 *  paths users actually travel. */
export const RELATED_LINKS: Readonly<Record<string, ReadonlyArray<{ href: string; label: string }>>> = {
  "/json-formatter": [
    { href: "/json-validator", label: "JSON Validator — check syntax" },
    { href: "/json-minifier", label: "JSON Minifier — compress for production" },
    { href: "/json-diff", label: "JSON Diff — compare two documents" },
    { href: "/json-to-csv", label: "JSON to CSV — flatten to tables" },
    { href: "/json-to-yaml", label: "JSON to YAML — switch config styles" },
    { href: "/api-client", label: "API Client — send JSON in requests" },
    { href: "/parsers", label: "JSON Parser — typed tree view" },
  ],
  "/json-minifier": [
    { href: "/json-formatter", label: "JSON Formatter — make it readable again" },
    { href: "/json-validator", label: "JSON Validator — verify before shipping" },
    { href: "/json-diff", label: "JSON Diff — compare compact payloads" },
    { href: "/json-converter", label: "JSON Converters — to XML, YAML, CSV" },
  ],
  "/json-validator": [
    { href: "/json-formatter", label: "JSON Formatter — fix indentation" },
    { href: "/json-minifier", label: "JSON Minifier — shrink valid JSON" },
    { href: "/json-diff", label: "JSON Diff — pinpoint what changed" },
    { href: "/api-client", label: "API Client — test the endpoint yourself" },
    { href: "/parsers", label: "Parsers — inspect URL, XML & YAML" },
  ],
  "/base64-encoder": [
    { href: "/base64-decoder", label: "Base64 Decoder — decode it back" },
    { href: "/base64", label: "Image to Base64 — data URIs & files" },
    { href: "/jwt-decoder", label: "JWT Decoder — inspect token payloads" },
    { href: "/url-encoder", label: "URL Encoder — percent-encoding instead" },
  ],
  "/base64-decoder": [
    { href: "/base64-encoder", label: "Base64 Encoder — encode text" },
    { href: "/json-formatter", label: "JSON Formatter — prettify decoded JSON" },
    { href: "/jwt-decoder", label: "JWT Decoder — decode auth tokens" },
    { href: "/base64", label: "Base64 → images, hex & binary" },
  ],
  "/jwt-decoder": [
    { href: "/base64-decoder", label: "Base64 Decoder — decode raw segments" },
    { href: "/hash-generator", label: "Hash Generator — checksum verification" },
    { href: "/json-formatter", label: "JSON Formatter — prettify claims" },
    { href: "/api-client", label: "API Client — replay authorized requests" },
  ],
  "/url-encoder": [
    { href: "/url-decoder", label: "URL Decoder — decode percent escapes" },
    { href: "/parsers", label: "URL Parser — break URLs into parts" },
    { href: "/base64-encoder", label: "Base64 Encoder — whole-string encoding" },
    { href: "/encode-decode", label: "All Encoding & Decoding Tools" },
  ],
  "/url-decoder": [
    { href: "/url-encoder", label: "URL Encoder — escape values again" },
    { href: "/parsers", label: "URL Parser — inspect query components" },
    { href: "/jwt-decoder", label: "JWT Decoder — debug auth redirects" },
    { href: "/encode-decode", label: "HTML & UTF-8 encoders" },
  ],
  "/hash-generator": [
    { href: "/cryptography-tools", label: "All Cryptography Tools" },
    { href: "/md5-generator", label: "MD5 Generator — dedicated page" },
    { href: "/sha256-generator", label: "SHA-256 Generator — dedicated page" },
    { href: "/string-functions", label: "Password Generator — strong secrets" },
    { href: "/random-generators", label: "UUID Generator — unique identifiers" },
    { href: "/api-client", label: "API Client — sign & send webhook payloads" },
  ],
  "/encode-decode": [
    { href: "/base64-encoder", label: "Base64 Encoder" },
    { href: "/base64-decoder", label: "Base64 Decoder" },
    { href: "/url-encoder", label: "URL Encoder" },
    { href: "/url-decoder", label: "URL Decoder" },
    { href: "/parsers", label: "Parsers — inspect what you encoded" },
  ],
  "/base64": [
    { href: "/base64-encoder", label: "Base64 Encoder — plain text" },
    { href: "/base64-decoder", label: "Base64 Decoder — plain text" },
    { href: "/json-converter", label: "JSON Converters" },
  ],
  "/json-converter": [
    { href: "/json-formatter", label: "JSON Formatter — tidy input first" },
    { href: "/json-validator", label: "JSON Validator — check syntax" },
    { href: "/parsers", label: "Parsers — JSON tree view" },
    { href: "/json-to-xml", label: "JSON to XML — dedicated converter page" },
    { href: "/json-to-java", label: "JSON to Java — dedicated converter page" },
    { href: "/json-to-csv", label: "JSON to CSV — dedicated converter page" },
    { href: "/json-to-yaml", label: "JSON to YAML — dedicated converter page" },
  ],
  "/parsers": [
    { href: "/json-formatter", label: "JSON Formatter" },
    { href: "/json-validator", label: "JSON Validator" },
    { href: "/url-decoder", label: "URL Decoder — read escaped params" },
    { href: "/compiler", label: "Dart Compiler — run transformation code" },
  ],
  "/random-generators": [
    { href: "/hash-generator", label: "Hash Generator — digest random data" },
    { href: "/string-functions", label: "String Functions — transform output" },
    { href: "/compiler", label: "Dart Compiler — script your fixtures" },
    { href: "/uuid-generator", label: "UUID Generator — dedicated page" },
  ],
  "/string-functions": [
    { href: "/hash-generator", label: "Hash Generator" },
    { href: "/random-generators", label: "Random Generators" },
    { href: "/cryptography-tools", label: "Cryptography Tools" },
  ],
  "/cryptography-tools": [
    { href: "/hash-generator", label: "Hash Generator — quick SHA-256" },
    { href: "/md5-generator", label: "MD5 Generator — legacy checksums" },
    { href: "/sha256-generator", label: "SHA-256 Generator — secure default" },
    { href: "/jwt-decoder", label: "JWT Decoder — inspect signed tokens" },
    { href: "/string-functions", label: "Password Generator" },
  ],
  "/md5-generator": [
    { href: "/cryptography-tools", label: "All Cryptography Tools" },
    { href: "/sha256-generator", label: "SHA-256 Generator — stronger integrity" },
    { href: "/hash-generator", label: "Hash Generator — every digest family" },
    { href: "/jwt-decoder", label: "JWT Decoder — inspect signed tokens" },
  ],
  "/sha256-generator": [
    { href: "/hash-generator", label: "Hash Generator — quick digests" },
    { href: "/md5-generator", label: "MD5 Generator — legacy checksums" },
    { href: "/cryptography-tools", label: "All Cryptography Tools" },
    { href: "/fake-data", label: "Fake Data — hash test fixtures" },
  ],
  "/compiler": [
    { href: "/api-client", label: "API Client — hit live endpoints" },
    { href: "/json-formatter", label: "JSON Formatter — tidy program output" },
    { href: "/random-generators", label: "Random Generators — test fixtures" },
  ],
  "/api-client": [
    { href: "/json-formatter", label: "JSON Formatter — prettify responses" },
    { href: "/json-validator", label: "JSON Validator — check payloads" },
    { href: "/api-tester", label: "API Tester — the same engine for quick checks" },
    { href: "/http-header-inspector", label: "HTTP Header Inspector — analyze response headers" },
    { href: "/jwt-decoder", label: "JWT Decoder — debug bearer tokens" },
    { href: "/compiler", label: "Dart Compiler — generate request scripts" },
    { href: "/openapi", label: "OpenAPI Workbench — explore a documented API" },
  ],
  "/about": [
    { href: "/api-client", label: "API Client — test REST APIs in-browser" },
    { href: "/compiler", label: "Online Compiler — run Dart, JS & TypeScript" },
    { href: "/contact", label: "Contact — feedback & bug reports" },
    { href: "/json-formatter", label: "JSON Formatter — the flagship tool" },
  ],
  "/contact": [
    { href: "/about", label: "About DataFormatter — how the tools work" },
    { href: "/json-formatter", label: "JSON Formatter" },
    { href: "/base64-decoder", label: "Base64 Decoder" },
    { href: "/jwt-decoder", label: "JWT Decoder" },
  ],
  "/privacy": [
    { href: "/about", label: "About DataFormatter — how the tools work" },
    { href: "/contact", label: "Contact — feedback & bug reports" },
    { href: "/jwt-decoder", label: "JWT Decoder — decode tokens safely" },
    { href: "/json-formatter", label: "JSON Formatter — the flagship tool" },
  ],
  "/json-diff": [
    { href: "/json-formatter", label: "JSON Formatter — pretty-print before diffing" },
    { href: "/json-validator", label: "JSON Validator — confirm both sides parse" },
    { href: "/json-to-schema", label: "JSON to Schema — re-derive from changed API" },
    { href: "/json-to-code", label: "JSON to Code — regenerate types after changes" },
  ],
  "/json-to-code": [
    { href: "/json-to-schema", label: "JSON to Schema — validation instead of types" },
    { href: "/json-to-java", label: "JSON to Java — POJO classes" },
    { href: "/json-formatter", label: "JSON Formatter — tidy the input sample" },
    { href: "/json-diff", label: "JSON Diff — see how the contract changed" },
    { href: "/compiler", label: "Compiler — run generated scripts" },
  ],
  "/json-to-schema": [
    { href: "/json-to-code", label: "JSON to Code — type declarations instead" },
    { href: "/json-validator", label: "JSON Validator — check the samples first" },
    { href: "/json-diff", label: "JSON Diff — track what changed" },
    { href: "/parsers", label: "Parsers — inspect the JSON as a tree" },
    { href: "/openapi", label: "OpenAPI Workbench — use the schema in a document" },
  ],
  "/curl-to-code": [
    { href: "/api-tester", label: "API Tester — send the request live" },
    { href: "/api-client", label: "API Client — build requests by hand" },
    { href: "/http-header-inspector", label: "Header Inspector — analyze the headers" },
    { href: "/json-validator", label: "JSON Validator — check the body you generated" },
    { href: "/openapi", label: "OpenAPI Workbench — generate code from a document" },
  ],
  "/api-tester": [
    { href: "/curl-to-code", label: "cURL to Code — import a command" },
    { href: "/json-formatter", label: "JSON Formatter — prettify the response" },
    { href: "/json-validator", label: "JSON Validator — verify the payload" },
    { href: "/http-header-inspector", label: "Header Inspector — inspect response headers" },
    { href: "/api-client", label: "API Client — the full request builder page" },
    { href: "/openapi", label: "OpenAPI Workbench — explore the API definition" },
  ],
  "/openapi": [
    { href: "/api-tester", label: "API Tester — send a request live" },
    { href: "/api-client", label: "API Client — build requests by hand" },
    { href: "/api-diff", label: "API Breaking Change Detector — compare schemas" },
    { href: "/curl-to-code", label: "cURL to Code — port a command to code" },
    { href: "/json-to-schema", label: "JSON to Schema — derive schemas from samples" },
    { href: "/json-to-code", label: "JSON to Code — generate types from payloads" },
  ],
  "/http-header-inspector": [
    { href: "/curl-to-code", label: "cURL to Code — reproduce the exact request" },
    { href: "/api-tester", label: "API Tester — hit the endpoint yourself" },
    { href: "/har", label: "HAR Debugger — analyze captured traffic" },
    { href: "/log-analyzer", label: "Log Analyzer — correlate with server logs" },
    { href: "/env-validator", label: "ENV Validator — keep secrets out of headers" },
  ],
  "/log-analyzer": [
    { href: "/stack-trace", label: "Stack Trace Reader — clean up error stacks" },
    { href: "/regex", label: "Regex Tester — build log line patterns" },
    { href: "/timestamp", label: "Timestamp Converter — read log timestamps" },
    { href: "/http-header-inspector", label: "Header Inspector — debug request quirks" },
    { href: "/error-workspace", label: "Error Workspace — correlate logs with a trace" },
  ],
  "/stack-trace": [
    { href: "/log-analyzer", label: "Log Analyzer — find which errors repeat" },
    { href: "/regex", label: "Regex Tester — match trace frames" },
    { href: "/json-validator", label: "JSON Validator — validate the payload that failed" },
    { href: "/error-workspace", label: "Error Workspace — one session for trace, logs & request" },
    { href: "/compiler", label: "Compiler — reproduce the failure in code" },
  ],
  "/har": [
    { href: "/http-header-inspector", label: "Header Inspector — inspect specific header blocks" },
    { href: "/log-analyzer", label: "Log Analyzer — correlate request failures with server logs" },
    { href: "/curl-to-code", label: "cURL to Code — port a captured request to code" },
    { href: "/api-client", label: "API Client — replay a captured request" },
    { href: "/error-workspace", label: "Error Workspace — dig into one failed exchange" },
  ],
  "/api-diff": [
    { href: "/json-diff", label: "JSON Diff — precise field-level before/after" },
    { href: "/openapi", label: "OpenAPI Workbench — explore a documented API" },
    { href: "/json-to-schema", label: "JSON to Schema — derive the contract to compare" },
    { href: "/api-client", label: "API Client — verify the changed endpoint" },
  ],
  "/error-workspace": [
    { href: "/stack-trace", label: "Stack Trace Reader — parse the exception cleanly" },
    { href: "/log-analyzer", label: "Log Analyzer — level counts and error groups" },
    { href: "/http-header-inspector", label: "Header Inspector — debug the request/response headers" },
    { href: "/curl-to-code", label: "cURL to Code — port the reproduction to code" },
  ],
  "/env-validator": [
    { href: "/fake-data", label: "Fake Data — placeholder values for config" },
    { href: "/http-header-inspector", label: "Header Inspector — keep secrets out of headers" },
    { href: "/json-to-code", label: "JSON to Code — types for config payloads" },
    { href: "/api-tester", label: "API Tester — test with the configured env" },
  ],
  "/cron": [
    { href: "/timestamp", label: "Timestamp Converter — verify run instants" },
    { href: "/log-analyzer", label: "Log Analyzer — see what a job actually did" },
    { href: "/fake-data", label: "Fake Data — sample data for job testing" },
  ],
  "/timestamp": [
    { href: "/cron", label: "Cron Helper — schedule against these instants" },
    { href: "/log-analyzer", label: "Log Analyzer — read message timestamps" },
    { href: "/api-tester", label: "API Tester — call the endpoint behind the timestamp" },
    { href: "/developer-calculator", label: "Developer Calculator — compute with the values" },
    { href: "/regex", label: "Regex Tester — pull timestamps out of logs" },
    { href: "/json-formatter", label: "JSON Formatter — pretty-print dated payloads" },
  ],
  "/regex": [
    { href: "/log-analyzer", label: "Log Analyzer — apply patterns to real logs" },
    { href: "/timestamp", label: "Timestamp Converter — parse extracted values" },
    { href: "/stack-trace", label: "Stack Trace Reader — match frame formats" },
    { href: "/parsers", label: "Parsers — structured alternatives to regex" },
  ],
  "/fake-data": [
    { href: "/json-converter", label: "JSON Converters — shape generated rows" },
    { href: "/env-validator", label: "ENV Validator — fill config with placeholders" },
    { href: "/random-generators", label: "Random Generators — UUIDs, IPs & numbers" },
    { href: "/json-to-code", label: "JSON to Code — type the generated fixtures" },
  ],
  "/developer-calculator": [
    { href: "/regex", label: "Regex Tester — parse the values you compute" },
    { href: "/json-converter", label: "JSON Converters — size payloads you generate" },
    { href: "/json-formatter", label: "JSON Formatter — measure output sizes" },
    { href: "/fake-data", label: "Fake Data — estimate fixture sizes" },
  ],
  "/json-to-csv": [
    { href: "/json-to-yaml", label: "JSON to YAML — keep the structure" },
    { href: "/json-to-xml", label: "JSON to XML — markup output" },
    { href: "/json-converter", label: "JSON Converters — TSV, YAML, XML & Excel" },
    { href: "/json-formatter", label: "JSON Formatter — tidy the source first" },
    { href: "/fake-data", label: "Fake Data — generate CSV rows" },
  ],
  "/json-to-yaml": [
    { href: "/json-to-csv", label: "JSON to CSV — tabular output instead" },
    { href: "/json-to-xml", label: "JSON to XML — markup output" },
    { href: "/json-converter", label: "JSON Converters — every output target" },
    { href: "/env-validator", label: "ENV Validator — shop config-style files" },
    { href: "/json-formatter", label: "JSON Formatter — clean input first" },
  ],
  "/json-to-xml": [
    { href: "/json-to-java", label: "JSON to Java — classes instead of markup" },
    { href: "/json-converter", label: "JSON Converters — every output target" },
    { href: "/json-validator", label: "JSON Validator — check syntax first" },
    { href: "/json-formatter", label: "JSON Formatter — tidy input first" },
  ],
  "/json-to-java": [
    { href: "/json-to-xml", label: "JSON to XML — markup instead of classes" },
    { href: "/json-to-code", label: "JSON to Code — TypeScript, Go, C# & more" },
    { href: "/json-converter", label: "JSON Converters — CSV, YAML, XML & Excel" },
    { href: "/api-client", label: "API Client — test the payload you modeled" },
  ],
  "/uuid-generator": [
    { href: "/fake-data", label: "Fake Data — realistic rows with UUIDs" },
    { href: "/random-generators", label: "Random Generators — IPs, numbers & dates" },
    { href: "/hash-generator", label: "Hash Generator — checksums for IDs" },
    { href: "/json-converter", label: "JSON Converters — fixtures with UUID keys" },
  ],
};

/**
 * Per-tool GEO answers rendered as an answer-first "About this tool" block on
 * every tool page. Exactly one entry per canonical tool page. All claims are
 * true of the implementation — local/client-side processing, no upload, free,
 * no signup — and each page's copy is written individually, never templated.
 */
export const GEO_ANSWERS: Readonly<Record<string, GeoDatum>> = {
  "/json-formatter": {
    what: "DataFormatter JSON Formatter is a free online JSON formatter, beautifier and pretty printer. It reformats minified JSON with clean 2-space indentation directly in the browser and lets you validate or minify it in the same workspace.",
    who: "Developers and testers who need to make compact or minified API responses, configs and fixtures readable before they edit, debug or review them.",
    different: "Unlike hosted formatters, it runs 100% in your browser — the JSON you paste is never uploaded — and it also validates and minifies in one place, with no signup.",
  },
  "/json-minifier": {
    what: "DataFormatter JSON Minifier is a free online tool that compresses JSON to a single line by removing whitespace, so payloads take up less space in storage, logs and network requests.",
    who: "Backend and frontend developers shrinking API responses or configuration that must fit small payload limits or reduce bandwidth.",
    different: "It minifies entirely in the browser (nothing is uploaded) and, because it is lossless, output parses back to exactly the same values as the input.",
  },
  "/json-validator": {
    what: "DataFormatter JSON Validator is a free online validator that checks JSON against RFC 8259 and points to the exact line and column of any syntax error.",
    who: "Developers debugging malformed API responses, config files or webhook payloads that fail to parse.",
    different: "It reports precise line and column positions and runs fully client-side, so sensitive JSON never leaves your browser.",
  },
  "/base64-encoder": {
    what: "DataFormatter Base64 Encoder is a free online tool that encodes text, JSON or tokens to Base64 with correct UTF-8 handling for emoji and non-Latin scripts.",
    who: "Developers and system administrators who need a Base64 form of a string for data URIs, headers or quick transfers.",
    different: "It handles multi-byte UTF-8 correctly and runs locally in the browser — your input is never uploaded and no signup is required.",
  },
  "/base64-decoder": {
    what: "DataFormatter Base64 Decoder is a free online tool that turns a Base64 string back into readable text, automatically pretty-printing any embedded JSON it finds.",
    who: "Developers debugging encoded payloads, auth strings or base64-wrapped data who want the decoded result instantly and safely.",
    different: "It auto-detects embedded JSON and pretty-prints it, and decoding happens entirely in your browser with nothing sent to a server.",
  },
  "/jwt-decoder": {
    what: "DataFormatter JWT Decoder is a free online tool that decodes a JWT's header and payload into readable JSON, handling Bearer prefixes automatically.",
    who: "Developers and testers inspecting access tokens, verifying claims or debugging auth flows without exposing token contents to a third-party service.",
    different: "Decoding is 100% local — tokens are never sent to a server — and it auto-strips Bearer prefixes so you can paste a token as-is.",
  },
  "/url-encoder": {
    what: "DataFormatter URL Encoder is a free online tool that percent-encodes spaces, symbols and Unicode exactly like encodeURIComponent before you put values into links or APIs.",
    who: "Frontend developers and QA engineers building query strings, form values or hrefs that must be safely URL-encoded.",
    different: "It mirrors the browser's encodeURIComponent behavior and runs entirely locally, so nothing you encode is uploaded.",
  },
  "/url-decoder": {
    what: "DataFormatter URL Decoder is a free online tool that turns %20-style percent escapes back into readable text, including multi-byte emoji and accented characters.",
    who: "Developers auditing tracked links, debugging redirects or reading query strings that arrive percent-encoded in logs.",
    different: "It correctly decodes multi-byte sequences and runs fully in the browser — no upload, free and no signup.",
  },
  "/hash-generator": {
    what: "DataFormatter Hash Generator is a free online tool that computes MD5, SHA-1, SHA-2 and SHA-3 checksum digests of any text.",
    who: "Developers verifying file integrity, generating digests for webhooks or comparing checksums without reaching for a command line.",
    different: "Every digest is calculated locally in your browser, so sensitive input is never uploaded — and the full SHA-3 family is supported.",
  },
  "/encode-decode": {
    what: "DataFormatter Encoding & Decoding Workspace is a free collection of encoders and decoders covering Base32, Base58, Base64, URL, HTML, UTF-8 and JSON in one tab.",
    who: "Anyone who switches between encoding schemes regularly and wants a single privacy-safe workspace instead of many bookmarklets.",
    different: "It consolidates many formats in one client-side tab where every operation runs locally — no uploads, no accounts.",
  },
  "/base64": {
    what: "DataFormatter Base64 Tools is a free suite that converts images, JSON, XML, CSV, hex, binary and octal to Base64 — and back.",
    who: "Developers generating data URIs, encoding file content for APIs or decoding embedded assets without uploading files.",
    different: "File conversion runs entirely client-side, so images and payloads are never uploaded to a server.",
  },
  "/json-converter": {
    what: "DataFormatter JSON Converters is a free collection that turns JSON into Java classes, XML, YAML, CSV, TSV, Excel-ready tables, HTML and plain text.",
    who: "Developers who need JSON transformed into another format for another tool, language or report.",
    different: "Conversion happens in the browser with no upload, and dedicated pages cover JSON to CSV and JSON to YAML.",
  },
  "/json-diff": {
    what: "DataFormatter JSON Diff is a free online tool that compares two JSON documents side by side and reports added, removed and changed values as precise dot paths.",
    who: "Developers reviewing changes to an API response, config file or data contract between two versions.",
    different: "Comparison runs entirely in your browser, so the JSON you paste is never uploaded, and results are listed as exact dot paths rather than a vague visual diff.",
  },
  "/json-to-code": {
    what: "DataFormatter JSON to Code is a free online tool that turns a JSON sample into typed declarations for TypeScript, Java, C#, Go, Python, Kotlin, Swift or Dart.",
    who: "Developers who need type-safe models or interfaces for an API payload and want to derive them instantly from a sample.",
    different: "Generation is fully local with no upload and no signup, and it supports a wide range of popular languages from one sample.",
  },
  "/json-to-schema": {
    what: "DataFormatter JSON to Schema is a free online tool that derives validation schemas from JSON samples — JSON Schema, Zod, Pydantic, OpenAPI or a NestJS DTO.",
    who: "Developers adding validation to a codebase who want an accurate schema derived directly from example payloads.",
    different: "It lets you supply multiple samples so it can learn which fields are optional, and everything runs locally with no upload.",
  },
  "/curl-to-code": {
    what: "DataFormatter cURL to Code is a free online tool that converts a cURL command into JavaScript fetch, Axios, Python requests, Java, Go, C# or PHP.",
    who: "Developers who have a working curl command and want the equivalent code in their language of choice.",
    different: "It parses headers, auth, query and body faithfully and runs locally in the browser, so the request you paste is never uploaded.",
  },
  "/parsers": {
    what: "DataFormatter Parsers is a free suite that breaks URLs into components, parses JSON into a typed tree, inspects XML element trees and converts YAML to JSON.",
    who: "Developers inspecting structured data or URLs to understand their internals before coding against them.",
    different: "All parsing runs locally in the browser, so the data you inspect is never uploaded.",
  },
  "/random-generators": {
    what: "DataFormatter Random Generators is a free suite that produces UUIDs, IP addresses, primes, dates, names, MAC addresses and realistic test data as JSON or CSV.",
    who: "Developers and testers who need realistic, seeded test fixtures quickly and reproducibly.",
    different: "Generation runs on-device with seeded, reproducible output — nothing is uploaded and there is no signup.",
  },
  "/string-functions": {
    what: "DataFormatter String Functions is a free collection of more than 20 utility transforms: change case, reverse, repeat, sort, count words and more.",
    who: "Anyone cleaning or reshaping short text values without juggling multiple one-off sites.",
    different: "It bundles the transforms into one private client-side tab where text never leaves the browser.",
  },
  "/cryptography-tools": {
    what: "DataFormatter Cryptography Tools is a free suite for computing common digests from MD5 through SHA-512 and the SHA-3 family.",
    who: "Developers and security-conscious users generating checksums or verifying integrity locally.",
    different: "All digests compute in the browser — nothing is uploaded, and the SHA-3 family is included for free.",
  },
  "/md5-generator": {
    what: "DataFormatter MD5 Generator is a free online tool that computes the 128-bit MD5 digest of any text as a 32-character lowercase hex string.",
    who: "Developers verifying legacy checksums, comparing small payloads or computing deduplication keys without reaching for a command line.",
    different: "The digest is computed locally in your browser — sensitive input is never uploaded — with no signup and no rate limit.",
  },
  "/sha256-generator": {
    what: "DataFormatter SHA-256 Generator is a free online tool that computes the SHA-256 digest of any text as a 64-character lowercase hex string.",
    who: "Developers and security-conscious users verifying file or payload integrity and generating fingerprints for cache keys or webhook requests.",
    different: "Hashing runs entirely in your browser — nothing is uploaded — and the SHA-2 and SHA-3 families are available in the same workspace.",
  },
  "/compiler": {
    what: "DataFormatter Online Compiler is a free online Dart compiler and playground that also runs JavaScript and TypeScript. Dart compiles in your browser via WebAssembly (the DDC engine); JavaScript and TypeScript run in a sandboxed Web Worker — no install, no server, no upload.",
    who: "Developers who want to run Dart code online, prototype or test small snippets in Dart, JavaScript or TypeScript, or try a language feature without installing a local toolchain.",
    different: "The Dart engine, compiler and sandbox all run inside your tab via WebAssembly, so code never leaves your machine — no signup, no queue, and a persistent compilation session makes re-runs instant.",
  },
  "/api-client": {
    what: "DataFormatter API Client is a free online tool that builds GET, POST, PUT and DELETE requests with headers, auth and JSON bodies and sends them straight from your browser.",
    who: "Developers and testers who want to exercise a REST API quickly with full control over headers and auth.",
    different: "Requests go directly to the endpoint with no server-side proxy, so nothing is forwarded, logged or uploaded.",
  },
  "/api-tester": {
    what: "DataFormatter API Tester is a free online tool to build and send GET, POST, PUT and DELETE requests with headers, auth and JSON bodies directly from your browser.",
    who: "Developers debugging endpoints and inspecting responses without leaving the tab or using a separate desktop app.",
    different: "It sends requests straight to the endpoint with no proxy and no signup — cross-origin responses depend only on the endpoint's CORS policy, and nothing is logged.",
  },
  "/openapi": {
    what: "DataFormatter OpenAPI Viewer & Workbench is a free online tool that parses an OpenAPI 3.0/3.1 JSON or YAML document in your browser, lets you explore every endpoint and schema, validates the structure and generates cURL, fetch, Axios and TypeScript code.",
    who: "Developers and API designers who need to understand a documented API quickly, spot structural problems in a spec or get runnable request code without installing a client.",
    different: "It accepts real-world YAML (block scalars, anchors), resolves $ref safely against circular schemas, and processes everything locally with no upload — including generated code that never carries authorization secrets.",
  },
  "/http-header-inspector": {
    what: "DataFormatter HTTP Header Inspector is a free online tool that analyzes a pasted raw header block and reports cache control, cookies, CORS, HSTS and security headers with honest ok/warn/error notes.",
    who: "Developers and security reviewers checking response headers for caching behavior and missing security protections.",
    different: "Analysis runs locally — header blocks are never uploaded — so it is safe to inspect real production responses.",
  },
  "/log-analyzer": {
    what: "DataFormatter Log Analyzer is a free online tool that counts log levels, deduplicates error groups and builds an hourly timeline from up to 50,000 pasted log lines.",
    who: "Developers triaging server logs to find which errors repeat and when spikes happened without shipping logs anywhere.",
    different: "It is entirely browser-based, so server logs with real data never leave your machine, and it handles large inputs locally.",
  },
  "/stack-trace": {
    what: "DataFormatter Stack Trace Reader is a free online Java stack trace formatter and parser that also handles JavaScript/Node, Python and Go traces. Paste a raw trace and it surfaces the exception, the first project frame and a clean call chain.",
    who: "Developers debugging Java exceptions, printStackTrace() output or panics in other languages who want the failure's root cause and origin frame quickly.",
    different: "Language detection is automatic, parsing is local, and it normalizes noisy async/framework frames into a readable chain — so raw Java, Spring or framework-heavy traces become a clear summary without leaving the browser.",
  },
  "/env-validator": {
    what: "DataFormatter ENV Validator is a free online tool that checks .env syntax, duplicates and formatting, then diffs a local file against its .env.example.",
    who: "Developers and DevOps engineers who want to confirm configuration files are well-formed and complete before deploying.",
    different: "Analysis happens entirely in the browser, so secret values never leave your machine.",
  },
  "/cron": {
    what: "DataFormatter Cron Expression Helper is a free online tool that validates 5- and 6-field cron expressions, describes them in plain English and lists next or previous runs in any time zone.",
    who: "Developers and system administrators who need to verify a cron schedule or translate it into plain language.",
    different: "It is DST-aware and fully client-side — nothing is uploaded, and you can read schedules in plain English.",
  },
  "/timestamp": {
    what: "DataFormatter Timestamp Converter is a free online tool that auto-detects Unix seconds, milliseconds, microseconds and nanoseconds, ISO-8601, RFC 1123 and common dates, then converts them across every epoch unit and readable UTC, IST and per-zone forms — with 14 modes for inspection, timezone matrices, DST ambiguity, difference/comparison, batch conversion, live clocks, arithmetic, log extraction, JWT claims and HTTP headers.",
    who: "Developers debugging logs, databases, caches and APIs who need to translate epoch values, DST-ambiguous wall times or claim times quickly and exactly.",
    different: "It is BigInt-exact, DST-aware (ambiguous and nonexistent local times are detected), interprets zone-less wall times in your primary timezone, and computes everything in your browser.",
  },
  "/regex": {
    what: "DataFormatter Regex Tester is a free online tool that tests regular expressions with the browser's own engine, showing instant validity, every match with positions and capture groups, plus a per-line mode.",
    who: "Developers writing or debugging regex for validation, parsing and log auditing without running a script.",
    different: "It runs 100% client-side against your browser's native engine, so behavior matches real JavaScript exactly.",
  },
  "/fake-data": {
    what: "DataFormatter Fake Data Generator is a free online tool that generates realistic fake data — names, emails, UUIDs, IPs, dates and more — as tables, JSON or CSV.",
    who: "Developers and testers seeding databases, mocks and demos with safe, non-personal placeholder data.",
    different: "Generation is seeded and reproducible and runs entirely in your browser — no data is generated server-side or uploaded.",
  },
  "/developer-calculator": {
    what: "DataFormatter Developer Calculator is a free online calculator built for developers: evaluate expressions with hex, binary and bitwise operators, model integer widths from 8 to 64 bits with two's-complement behavior, convert between radices with masking, measure byte sizes, compute CRC-32 and estimate latency or API traffic.",
    who: "Developers who work in hex, bytes and bitwise math and want one calculator for bit-level expressions, integer overflow modeling, size checks and load estimation.",
    different: "It pairs a bitwise expression engine with an interactive integer-width and two's-complement visualization as well as data-size, latency and API-traffic estimators — everything computes locally in your browser.",
  },
  "/json-to-csv": {
    what: "DataFormatter JSON to CSV Converter is a free online tool that flattens an array of JSON objects into clean CSV with one header column per key, quoted cells and empty cells for missing fields.",
    who: "Developers and analysts exporting JSON API data for Excel, BigQuery or spreadsheet workflows.",
    different: "Conversion runs entirely in the browser — nothing is uploaded — and output is ready to paste into a spreadsheet.",
  },
  "/json-to-yaml": {
    what: "DataFormatter JSON to YAML Converter is a free online tool that turns JSON into indentation-based YAML for Docker Compose, Kubernetes manifests, CI configs and Ansible.",
    who: "Developers and platform engineers converting JSON config into YAML for tools that expect YAML or prefer it by convention.",
    different: "It handles nested objects, arrays and quoting correctly, and runs free and locally in your tab with no upload.",
  },
  "/json-to-xml": {
    what: "DataFormatter JSON to XML Converter is a free online tool that turns a JSON document into well-formed XML, mapping object keys to element names and arrays to repeated elements with text escaped automatically.",
    who: "Developers and integrators feeding JSON data into XML-based systems, legacy APIs, feeds or SOAP-style consumers.",
    different: "It escapes text and names correctly, reports invalid JSON clearly, and runs entirely in your browser so nothing is uploaded.",
  },
  "/json-to-java": {
    what: "DataFormatter JSON to Java is a free online tool that converts a JSON object into Java POJO classes — private fields, constructors, getters and setters — with nested objects and arrays mapped to nested classes and List<T>.",
    who: "Java developers who need model classes for an API response or JSON-structured config and want them derived instantly from a sample.",
    different: "It infers Long vs Double, names files and fields cleanly (avoiding Java keywords), and generates everything locally with no upload and no signup.",
  },
  "/uuid-generator": {
    what: "DataFormatter UUID Generator is a free online tool that creates one or more random RFC 4122 UUID v4 identifiers directly in your browser.",
    who: "Developers and testers who need unique ID values for database keys, API mocks and test fixtures.",
    different: "It generates standard lowercase v4 UUIDs fully client-side — nothing you generate is uploaded and there is no signup.",
  },
  "/har": {
    what: "DataFormatter HAR Debugger is a free online HAR file viewer and analyzer that opens browser HAR exports and surfaces failed requests, slow timings, duplicates, auth and security observations.",
    who: "Frontend and QA engineers tracing page load performance, failed API calls or network behavior captured in a HAR recording.",
    different: "It analyzes entirely in the browser with a privacy-safe sanitize-and-download flow, so real request data never leaves your machine.",
  },
  "/api-diff": {
    what: "DataFormatter API Breaking Change Detector is a free online tool that compares two JSON APIs or JSON Schemas and classifies every difference as breaking, potentially-breaking, non-breaking or informational.",
    who: "Backend and integration developers reviewing release branches, third-party API upgrades or contract changes before shipping.",
    different: "It is schema-aware — new required fields, enum removals and type tightenings count as breaking — and runs fully locally with no upload.",
  },
  "/error-workspace": {
    what: "DataFormatter Production Error Workspace is a free online incident debugging tool that correlates a pasted stack trace, service logs, failing request and response into one prioritized session with a runnable reproduction.",
    who: "Backend and platform engineers triaging production failures who want stack trace, logs and request evidence unified in one place.",
    different: "It correlates trace IDs across log lines and request headers, generates cURL and code reproduction commands, and runs entirely in the browser.",
  },
};

/** Every canonical tool page carries a GEO answer block (mirrors the registry). */
export const GEO_KEYS: readonly string[] = Object.keys(GEO_ANSWERS);

function ogImagePath(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}/opengraph-image`;
}

/**
 * Build complete static page metadata from the registry: unique title,
 * description, self-canonical, explicit index/follow directive, Open Graph and
 * Twitter cards (including the route's generated OG image for twitter:image).
 * Exported as a plain object so it stays valid static metadata (no runtime work).
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
    robots: { index: true, follow: true },
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
      images: [ogImagePath(page.path)],
    },
  };
}

/**
 * Breadcrumb trail per page, mirroring the site's hub-and-spoke structure.
 * Tool landings nested under a category hub show the hub as their parent;
 * top-level tools hang directly off Home. Used for both the visible
 * breadcrumb navigation and the BreadcrumbList structured data.
 */
export const BREADCRUMBS: Readonly<Record<string, ReadonlyArray<{ name: string; href: string }>>> = {
  "/": [{ name: "Home", href: "/" }],
  "/json-formatter": [
    { name: "Home", href: "/" },
    { name: "JSON Formatter", href: "/json-formatter" },
  ],
  "/json-minifier": [
    { name: "Home", href: "/" },
    { name: "JSON Minifier", href: "/json-minifier" },
  ],
  "/json-validator": [
    { name: "Home", href: "/" },
    { name: "JSON Validator", href: "/json-validator" },
  ],
  "/jwt-decoder": [
    { name: "Home", href: "/" },
    { name: "JWT Decoder", href: "/jwt-decoder" },
  ],
  "/encode-decode": [
    { name: "Home", href: "/" },
    { name: "Encoding & Decoding Tools", href: "/encode-decode" },
  ],
  "/base64-encoder": [
    { name: "Home", href: "/" },
    { name: "Encoding & Decoding Tools", href: "/encode-decode" },
    { name: "Base64 Encoder", href: "/base64-encoder" },
  ],
  "/base64-decoder": [
    { name: "Home", href: "/" },
    { name: "Encoding & Decoding Tools", href: "/encode-decode" },
    { name: "Base64 Decoder", href: "/base64-decoder" },
  ],
  "/url-encoder": [
    { name: "Home", href: "/" },
    { name: "Encoding & Decoding Tools", href: "/encode-decode" },
    { name: "URL Encoder", href: "/url-encoder" },
  ],
  "/url-decoder": [
    { name: "Home", href: "/" },
    { name: "Encoding & Decoding Tools", href: "/encode-decode" },
    { name: "URL Decoder", href: "/url-decoder" },
  ],
  "/cryptography-tools": [
    { name: "Home", href: "/" },
    { name: "Cryptography Tools", href: "/cryptography-tools" },
  ],
  "/hash-generator": [
    { name: "Home", href: "/" },
    { name: "Cryptography Tools", href: "/cryptography-tools" },
    { name: "Hash Generator", href: "/hash-generator" },
  ],
  "/md5-generator": [
    { name: "Home", href: "/" },
    { name: "Cryptography Tools", href: "/cryptography-tools" },
    { name: "MD5 Generator", href: "/md5-generator" },
  ],
  "/sha256-generator": [
    { name: "Home", href: "/" },
    { name: "Cryptography Tools", href: "/cryptography-tools" },
    { name: "SHA-256 Generator", href: "/sha256-generator" },
  ],
  "/base64": [
    { name: "Home", href: "/" },
    { name: "Base64 Tools", href: "/base64" },
  ],
  "/json-converter": [
    { name: "Home", href: "/" },
    { name: "JSON Converters", href: "/json-converter" },
  ],
  "/parsers": [
    { name: "Home", href: "/" },
    { name: "Parsers", href: "/parsers" },
  ],
  "/random-generators": [
    { name: "Home", href: "/" },
    { name: "Random Generators", href: "/random-generators" },
  ],
  "/string-functions": [
    { name: "Home", href: "/" },
    { name: "String Functions", href: "/string-functions" },
  ],
  "/compiler": [
    { name: "Home", href: "/" },
    { name: "Online Dart, JavaScript & TypeScript Compiler", href: "/compiler" },
  ],
  "/api-client": [
    { name: "Home", href: "/" },
    { name: "API Client", href: "/api-client" },
  ],
  "/about": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
  ],
  "/contact": [
    { name: "Home", href: "/" },
    { name: "Contact", href: "/contact" },
  ],
  "/privacy": [
    { name: "Home", href: "/" },
    { name: "Privacy Policy", href: "/privacy" },
  ],
  "/json-diff": [
    { name: "Home", href: "/" },
    { name: "JSON Diff", href: "/json-diff" },
  ],
  "/json-to-code": [
    { name: "Home", href: "/" },
    { name: "JSON to Code", href: "/json-to-code" },
  ],
  "/json-to-schema": [
    { name: "Home", href: "/" },
    { name: "JSON to Schema", href: "/json-to-schema" },
  ],
  "/curl-to-code": [
    { name: "Home", href: "/" },
    { name: "cURL to Code", href: "/curl-to-code" },
  ],
  "/api-tester": [
    { name: "Home", href: "/" },
    { name: "API Tester", href: "/api-tester" },
  ],
  "/openapi": [
    { name: "Home", href: "/" },
    { name: "OpenAPI Viewer & Workbench", href: "/openapi" },
  ],
  "/http-header-inspector": [
    { name: "Home", href: "/" },
    { name: "HTTP Header Inspector", href: "/http-header-inspector" },
  ],
  "/log-analyzer": [
    { name: "Home", href: "/" },
    { name: "Log Analyzer", href: "/log-analyzer" },
  ],
  "/stack-trace": [
    { name: "Home", href: "/" },
    { name: "Stack Trace Reader", href: "/stack-trace" },
  ],
  "/env-validator": [
    { name: "Home", href: "/" },
    { name: "ENV Validator", href: "/env-validator" },
  ],
  "/cron": [
    { name: "Home", href: "/" },
    { name: "Cron Expression Helper", href: "/cron" },
  ],
  "/timestamp": [
    { name: "Home", href: "/" },
    { name: "Timestamp Converter", href: "/timestamp" },
  ],
  "/regex": [
    { name: "Home", href: "/" },
    { name: "Regular Expression Tester", href: "/regex" },
  ],
  "/fake-data": [
    { name: "Home", href: "/" },
    { name: "Fake Data Generator", href: "/fake-data" },
  ],
  "/developer-calculator": [
    { name: "Home", href: "/" },
    { name: "Developer Calculator", href: "/developer-calculator" },
  ],
  "/json-to-csv": [
    { name: "Home", href: "/" },
    { name: "JSON Converters", href: "/json-converter" },
    { name: "JSON to CSV", href: "/json-to-csv" },
  ],
  "/json-to-yaml": [
    { name: "Home", href: "/" },
    { name: "JSON Converters", href: "/json-converter" },
    { name: "JSON to YAML", href: "/json-to-yaml" },
  ],
  "/json-to-xml": [
    { name: "Home", href: "/" },
    { name: "JSON Converters", href: "/json-converter" },
    { name: "JSON to XML", href: "/json-to-xml" },
  ],
  "/json-to-java": [
    { name: "Home", href: "/" },
    { name: "JSON Converters", href: "/json-converter" },
    { name: "JSON to Java", href: "/json-to-java" },
  ],
  "/uuid-generator": [
    { name: "Home", href: "/" },
    { name: "Random Generators", href: "/random-generators" },
    { name: "UUID Generator", href: "/uuid-generator" },
  ],
  "/har": [
    { name: "Home", href: "/" },
    { name: "HAR Debugger", href: "/har" },
  ],
  "/api-diff": [
    { name: "Home", href: "/" },
    { name: "API Breaking Change Detector", href: "/api-diff" },
  ],
  "/error-workspace": [
    { name: "Home", href: "/" },
    { name: "Production Error Workspace", href: "/error-workspace" },
  ],
};

/** BreadcrumbList structured data derived from {@link BREADCRUMBS}. */
export function breadcrumbJsonLd(path: string) {
  const trail = BREADCRUMBS[path] ?? [{ name: "Home", href: "/" }];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

/** Per-tool SoftwareApplication structured data (free web app, developer tool). */
export function softwareApplicationJsonLd(page: PageSeo) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: page.h1,
    url: `${SITE_URL}${page.path}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript. All processing happens locally.",
    description: page.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
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
