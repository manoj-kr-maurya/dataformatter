import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "openapi-3-0-vs-3-1",
  title: "OpenAPI 3.0 vs 3.1: What Changed and Why It Matters",
  description:
    "OpenAPI 3.0 vs 3.1 key differences: JSON Schema 2020-12, type arrays replacing nullable, numeric exclusive bounds, webhooks, SPDX licenses — and how one in-browser workbench accepts both.",
  h1: "OpenAPI 3.0 vs 3.1: What Changed and Why It Matters",
  category: "API Engineering",
  excerpt:
    "OpenAPI 3.1 adopted JSON Schema 2020-12, which replaced nullable with type arrays, made exclusive bounds numeric and added webhooks. Both 3.0 and 3.1 documents are parsed by the same workbench.",
  geo: {
    what: "OpenAPI 3.1 is the 2021 revision of the API description standard that upgrades the schema layer to JSON Schema 2020-12, while 3.0 is the widely deployed previous major version.",
    who: "API designers and developers deciding which OpenAPI version to standardize on, or reading specs from both generations.",
    different: "DataFormatter's OpenAPI workbench parses JSON and YAML from both dialects into one normalized model, detects the version automatically, and explicitly rejects Swagger 2.0 instead of misreading it.",
  },
  publishedAt: "2026-08-18",
  relatedToolPaths: ["/openapi", "/api-diff", "/json-to-schema", "/api-tester"],
  relatedSlugs: ["what-makes-an-api-change-breaking", "how-json-diff-works"],
  blocks: [
    {
      type: "p",
      text: "OpenAPI 3.1 is a backwards-incompatible major version that mostly changes what you can express inside a schema, and a 3.1 document declares itself with the version field: \"openapi\": \"3.1.0\". A spec document is either 3.0 or 3.1 (or something else entirely), and knowing which one you are reading determines which schema keywords are available.",
    },
    {
      type: "h2",
      text: "The version field drives parsing",
    },
    {
      type: "p",
      text: "An OpenAPI document identifies itself with a single top-level field. The workbench reads it with a tiny version detector: if the field matches 3.0 it normalizes the document as a 3.0 spec, if it matches 3.1 it normalizes as 3.1, and anything else — including Swagger 2.0's swagger field — is rejected with a clear message rather than decoded by guesswork.",
    },
    {
      type: "code",
      label: "Self-identification",
      code: `openapi: 3.0.3    # infrastructure-compatible, curated JSON Schema
openapi: 3.1.0    # full JSON Schema 2020-12`,
    },
    {
      type: "h2",
      text: "JSON Schema 2020-12",
    },
    {
      type: "p",
      text: "The headline change is the schema language. OpenAPI 3.0 built its subset on JSON Schema draft-04 and forks several keywords, meaning some schema tools behaved differently against a 3.0 spec. OpenAPI 3.1 adopts JSON Schema 2020-12 wholesale, so schemas written to the 3.1 subset use the same rules as independent JSON Schema validators.",
    },
    {
      type: "h2",
      text: "The five differences that matter day-to-day",
    },
    {
      type: "table",
      caption: "What actually changes between OpenAPI 3.0 and 3.1",
      headers: ["Area", "OpenAPI 3.0", "OpenAPI 3.1"],
      rows: [
        ["Schema standard", "Custom subset of JSON Schema draft-04", "JSON Schema 2020-12"],
        ["nullable", "nullable: true keyword", "Deprecated — use a type array such as type: [\"string\", \"null\"]"],
        ["exclusive bounds", "exclusiveMinimum/exclusiveMaximum as booleans paired with min/max", "Numeric values: exclusiveMinimum: 0 means strictly greater than 0"],
        ["Webhooks", "Not expressible", "Top-level webhooks keyword for event-driven APIs"],
        ["License", "License object with a free-form name", "Identifier should be a standard (e.g. SPDX) identifier"],
      ],
    },
    {
      type: "h2",
      text: "Why the nullable flip matters",
    },
    {
      type: "p",
      text: "In 3.0, making a field nullable and making it optional were two separate ideas: nullable: true on a string schema, with required listed away from the field. In 3.1, null becomes just another allowed type — type: [\"string\", \"null\"] — and stripping null from that array is a schema change a validator can reason about like any type change.",
    },
    {
      type: "h2",
      text: "JSON or YAML — both are welcome",
    },
    {
      type: "p",
      text: "Specs ship as either format. The workbench decides by looking at the first character (a document that starts with { or [ is parsed as JSON; otherwise it goes through a robust YAML parser), and the YAML path handles block scalars, anchors and aliases — which real-world specs use heavily for shared schema fragments. The output is the same normalized model either way: endpoints, schemas, security schemes and servers.",
    },
    {
      type: "h2",
      text: "What the workbench refuses",
    },
    {
      type: "ul",
      items: [
        "Swagger 2.0 — explicitly not supported, rejected with its own message rather than misread.",
        "A document without an openapi field at all — 'This is not an OpenAPI 3.x document.'",
        "Future versions (for example openapi: 4.0.0) — rejected with a message that names the supported range.",
        "Plain JSON or YAML that happens to parse — rejected as not looking like an OpenAPI document.",
      ],
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Paste or upload a 3.0 or 3.1 spec — JSON or YAML — into the OpenAPI workbench to explore every endpoint, validate the version, and generate request code from the parsed model.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is Swagger 2.0 accepted?",
          a: "No. The workbench only accepts OpenAPI 3.0.x and 3.1.x and rejects Swagger 2.0 explicitly so a 2.0 document is never misinterpreted as a 3.x model.",
        },
        {
          q: "Should I write nullable in 3.1?",
          a: "No — the nullable keyword is deprecated in 3.1. Write type: [\"string\", \"null\"] to say a field may be null, which is the JSON Schema 2020-12 way.",
        },
        {
          q: "Can the same workbench parse a 3.0 spec and a 3.1 spec?",
          a: "Yes. The version is detected from the document itself and both dialects are normalized into the same model, so features like endpoint and schema exploration work identically for either.",
        },
      ],
    },
  ],
};

export default article;