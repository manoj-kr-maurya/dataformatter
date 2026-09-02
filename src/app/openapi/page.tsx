import type { Metadata } from "next";
import { OpenApiWorkbench } from "@/components/openapi/openapi-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import { Section, Bullets, UseCases } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/openapi");

const faqs = [
  {
    q: "Is DataFormatter's OpenAPI workbench free and does it need a signup?",
    a: "Yes, it is completely free with no account or signup. Paste JSON or YAML, or upload a spec file, and every feature works instantly in the browser.",
  },
  {
    q: "Does the OpenAPI workbench upload my API specification to a server?",
    a: "No. Parsing, validation, schema exploration and code generation all run locally in your tab. The document you paste or upload never leaves your machine.",
  },
  {
    q: "Which OpenAPI versions are supported?",
    a: "The workbench accepts OpenAPI 3.0.x and 3.1.x documents in JSON or YAML, including real-world YAML with block scalars and anchors. Swagger 2.0 documents are detected and reported as unsupported rather than misinterpreted.",
  },
  {
    q: "What code does the OpenAPI workbench generate?",
    a: "For any endpoint it produces cURL commands plus JavaScript fetch, Axios, Python requests, Java, Go and C# snippets, and it converts request or response schemas into TypeScript interfaces, Java classes, C# records, Go structs, Python dataclasses, Kotlin and Swift.",
  },
] as const;

export default function OpenApiPage() {
  return (
    <>
      <OpenApiWorkbench activeHref="/openapi" />
      <ToolSeoContent
        path="/openapi"
        summary="DataFormatter OpenAPI Workbench is a free, browser-based tool that parses an OpenAPI 3.0/3.1 JSON or YAML document, lists every endpoint and component schema, validates the structure, and generates cURL, fetch, Axios and typed code — with no signup and no upload."
        faqs={faqs}
      >
        <Section title="How the OpenAPI workbench helps">
          <p>
            Working from a spec file is much faster when you can explore it without reading raw YAML. Load a document
            and the workbench reduces it to the pieces you actually need: every operation on its tagged endpoint list,
            every component schema in a searchable list, and a details view for the current endpoint.
          </p>
          <Bullets
            items={[
              "Endpoint explorer — browse operations by tag with search, then see parameters, request bodies, servers and response codes for each one.",
              "Schema explorer — list all components.schemas definitions with searchable property tables that resolve $ref links safely, even in circular schemas.",
              "Validation — structural checks report missing response descriptions, duplicate operationIds, unresolved refs and unknown schema types as errors and warnings.",
              "Request code generation — one click from cURL to fetch, Axios, Python, Java, Go or C#, honouring path, query and header parameters and JSON bodies.",
              "Type generation — turns request and response schemas into TypeScript, Java, C#, Go, Python, Kotlin or Swift declarations by reusing the JSON to Code engine.",
              "Mock responses — every response status gets a clearly-labelled placeholder body generated from its schema, never presented as real API output.",
            ]}
          />
        </Section>
        <Section title="Security details at a glance">
          <p>
            Each endpoint reports the authentication it declares — API keys, HTTP Bearer tokens, OAuth 2.0 or
            OpenID Connect — with the scopes it requests. Generated snippets deliberately omit your credentials so
            nothing secret is ever copied or exported. As with the other DataFormatter tools, all processing happens
            locally and documents are never uploaded.
          </p>
        </Section>
        <UseCases
          cases={[
            {
              title: "Reading a new API quickly",
              body: "Upload the spec the team keeps in the repo and jump straight to the operations and schemas you are about to integrate with.",
            },
            {
              title: "Checking a spec before sharing",
              body: "Run validation before a pull request — missing response descriptions, duplicate operationIds and dangling $refs are surfaced with their location.",
            },
            {
              title: "Copying runnable request code",
              body: "Pick an endpoint, adjust path and query values in the parameter rows, and copy a ready request in the language your client is written in.",
            },
          ]}
        />
      </ToolSeoContent>
    </>
  );
}