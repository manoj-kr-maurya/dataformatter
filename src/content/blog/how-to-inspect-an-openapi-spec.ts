import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "how-to-inspect-an-openapi-spec",
  title: "How to Inspect an OpenAPI Specification",
  description:
    "An OpenAPI document describes every endpoint a server offers — paths, operations, schemas, security. Learn how to read a 3.x specification and turn it into live requests and code with a workbench.",
  h1: "How to Inspect an OpenAPI Specification",
  category: "API Engineering",
  excerpt:
    "A 3.x OpenAPI file is a dense JSON or YAML contract. Learn where to look — info, servers, paths, components — and how a workbench turns the document into live requests and generated code.",
  geo: {
    what: "An OpenAPI specification (formerly Swagger) is a machine-readable description of an API: the server URLs (servers), every endpoint (paths), the request and response shapes (components.schemas) and the security schemes. Reading it tells you what a documented API can do before you write any code.",
    who: "Developers onboarding to a new API, evaluating one, or maintaining a contract, who need to find the key facts in a large YAML or JSON document without reading every line.",
    different: "The OpenAPI Viewer & Workbench parses a 3.x document into an interactive model — endpoint list, per-operation request and response schemas, code generation for multiple targets — so inspection replaces raw-file reading.",
  },
  publishedAt: "2026-09-24",
  relatedToolPaths: ["/openapi", "/api-diff", "/json-to-schema"],
  relatedSlugs: ["openapi-3-0-vs-3-1", "how-to-convert-curl-to-code"],
  blocks: [
    {
      type: "p",
      text: "Before you integrate with an API, you read its contract. The single source of that truth is an OpenAPI document — a JSON or YAML file that declares every path, operation, schema and security scheme the server accepts. The file format is easy to read, but a real-world spec can be thousands of lines. Knowing where to look turns inspection from page-by-page reading into a five-minute walkthrough.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "OpenAPI 3.x",
          definition: "The modern specification format: info, servers, paths, components and security are top-level objects describing the whole API surface.",
        },
        {
          term: "Path item",
          definition: "An entry under paths keyed by URL template such as /users/{id}, listing the operations (get, post...) defined for that path.",
        },
        {
          term: "Reference ($ref)",
          definition: "A pointer like #/components/schemas/Pet that names a schema once and reuses it everywhere, keeping the document DRY.",
        },
        {
          term: "Operation",
          definition: "One request/response pairing: parameters, requestBody, responses and metadata for a single verb on a path.",
        },
      ],
    },
    {
      type: "h2",
      text: "The five places that answer everything",
    },
    {
      type: "ul",
      items: [
        "info — title, version and description: what the API is and which contract you're looking at.",
        "servers — the base URLs (production, staging) that every path joins onto.",
        "paths — the endpoints themselves and the verbs each supports.",
        "components.schemas — the named shapes of the data: request bodies and response payloads.",
        "security — how you authenticate, whether per-schema or globally (API keys, bearer JWTs, OAuth).",
      ],
    },
    {
      type: "h2",
      text: "Follow one request end to end",
    },
    {
      type: "example",
      inputLabel: "Path item (simplified)",
      input: `paths:
  /orders/{id}:
    get:
      summary: Fetch an order
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        '200':
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Order' }`,
      outputLabel: "What it says",
      output: `GET https://api.example.com/orders/123
→ 200, body shaped like the Order schema`,
    },
    {
      type: "p",
      text: "Start with the operation you care about, follow its $refs into components.schemas, and you have the exact shape of the payload plus where it lives — which is everything needed to build or test the call.",
    },
    {
      type: "h2",
      text: "Inspect with a workbench instead of a raw file",
    },
    {
      type: "p",
      text: "A specification viewer parses the document into the same structure — servers, endpoints, schemas — as an interactive model: select an endpoint, see its parameters and request/response schemas, send a live request against the chosen server, and generate code. Sanity problems like missing servers or malformed refs surface as validation issues, and a breakage review can compare two documents for breaking changes.",
    },
    {
      type: "note",
      title: "A $ref is a promise",
      text: "When an operation references a schema, consumers assume the payload matches it. A doc that says the response is an Order but returns something else is a contract violation — the kind of drift an API diff between versions is built to catch.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Do I need to read the entire document?",
          a: "No. Read info and servers once, then jump to the path you need and follow its refs. A workbench surfaces the same structure as clickable UI.",
        },
        {
          q: "What's the difference between OpenAPI and Swagger?",
          a: "Swagger is the original tooling name; OpenAPI is the specification itself (2.0 was still widely called Swagger 2.0). Modern contracts use OpenAPI 3.x.",
        },
        {
          q: "How do I find the request body schema for a POST?",
          a: "Its requestBody.content.application/json.schema, which usually $refs a components.schemas entry — dereference that to see the fields.",
        },
        {
          q: "Can I test an endpoint straight from the document?",
          a: "Yes — an OpenAPI workbench builds the request from the spec and lets you send it against the declared server, which is a fast way to confirm a documented call actually works.",
        },
      ],
    },
  ],
};

export default article;