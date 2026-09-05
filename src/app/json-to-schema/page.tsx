import type { Metadata } from "next";
import Link from "next/link";
import { JsonToSchemaWorkbench } from "@/components/devtools/json-to-schema-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import {
  Section,
  Bullets,
  Example,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata, FOOTER_LINKS, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-to-schema");

const faqs = [
  {
    q: "How does JSON become a schema?",
    a: "Your JSON is reduced to a type model (objects, arrays, scalars and named string formats like email, uuid, date or date-time), then that model is rendered as JSON Schema, Zod, Pydantic, an OpenAPI schema, a NestJS DTO, or a Prisma model.",
  },
  {
    q: "Can it build a schema from several samples?",
    a: "Yes. Paste multiple JSON documents one after another — each valid document is treated as a sample. Inference unions types across samples so fields that only appear sometimes become optional (or nullable where formats allow).",
  },
  {
    q: "How are string formats detected?",
    a: "Values get validated against common shapes: email addresses, UUIDs, ISO dates (YYYY-MM-DD), ISO date-times (YYYY-MM-DDTHH:mm…) and URLs. Formats appear as format: or pattern constraints in the output.",
  },
  {
    q: "What does Zod support look like?",
    a: "Generated Zod schemas use z.object, z.string(), z.number(), z.boolean(), z.array(), z.enum() for arrays of strings, z.email()/z.uuid() for recognized formats, and .optional() for fields missing from some samples.",
  },
  {
    q: "Is my JSON uploaded?",
    a: "Never. Schema generation runs entirely in your browser. This is the safe way to derive schemas for internal APIs or payloads containing real user data.",
  },
  {
    q: "Which formats are exported?",
    a: "JSON Schema (draft with standard keywords), Zod schema, Pydantic models for Python, an OpenAPI 3 component schema, a NestJS DTO class with class-validator decorators, and a Prisma model.",
  },
] as const;

export default function JsonToSchemaPage() {
  return (
    <>
      <JsonToSchemaWorkbench activeHref="/json-to-schema" />
      <ToolSeoContent
        path="/json-to-schema"
        summary="Build a validation schema from JSON samples in seconds. Paste one or more documents and get JSON Schema, Zod, Pydantic, OpenAPI, a NestJS DTO or a Prisma model — derived locally, never uploaded."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Paste a JSON document (or several, to teach the inferrer about optional fields).",
            "Name the root model if you use Pydantic, NestJS or OpenAPI.",
            "Choose an output: JSON Schema, Zod, Pydantic, OpenAPI, NestJS DTO or Prisma.",
            "Copy or download the generated schema and drop it into your project.",
          ]}
        />

        <Section title="What JSON to schema generates">
          <Bullets
            items={[
              "JSON Schema — standard type, required, properties, items and format keywords.",
              "Zod — z.object() chains with .email()/.uuid()/.datetime() validators.",
              "Pydantic — typing-based BaseModel classes with field types and optional markers.",
              "OpenAPI — component schema with nullable handling for optional properties.",
              "NestJS DTO — class-validator decorators (@IsString, @IsEmail, @IsEnum…) on a TypeScript class.",
              "Prisma — a model with scalar-list and Json types ready for your Prisma schema.",
            ]}
          />
        </Section>

        <Section title="How to derive a schema online">
          <Bullets
            items={[
              "Paste a sample document — the inference step summarizes the types first.",
              "Provide several samples when fields are conditional, so they become optional.",
              "Scan the format hints chip to see how many named formats were recognized.",
              "Switch formats to compare the same model in each family of tools.",
            ]}
          />
          <Example
            input={`{ "id": 42, "email": "a@b.io" }`}
            output={`{\n  "type": "object",\n  "required": ["id", "email"],\n  "properties": {\n    "id": { "type": "integer" },\n    "email": { "type": "string", "format": "email" }\n  }\n}`}
            inputLabel="JSON sample"
            outputLabel="JSON Schema output"
          />
        </Section>

        <Section title="Who converts JSON to schema — and when">
          <UseCases
            cases={[
              {
                title: "Adding runtime validation to TypeScript",
                body: "Paste a response sample, generate the Zod schema, and use it at the API boundary to fail fast on malformed data.",
              },
              {
                title: "Python backend contracts",
                body: "Derive Pydantic models from a colleague's JSON so request bodies are validated with typing support in your editor.",
              },
              {
                title: "Repository hygiene",
                body: "Generate an OpenAPI or JSON Schema from fixture data so every consumer can validate against a single, documented contract.",
              },
            ]}
          />
        </Section>

        <Section title="Common issues">
          <Troubleshooting
            items={[
              {
                error: "Field wrongly required",
                cause: "Every observed key is required by default — a single sample hides optionality.",
                fix: "Paste a few representative documents so missing keys are detected and marked optional.",
              },
              {
                error: "Arrays with mixed element types",
                cause: "A heterogeneous array (numbers and strings together) has no single element type.",
                fix: "Keep arrays homogeneous, or wrap heterogeneous records as objects so each field keeps its type.",
              },
              {
                error: "Format not detected",
                cause: "Date-times without the T (e.g. space-separated) or padded/odd-shaped UUIDs fall back to plain string.",
                fix: "Normalize to ISO-8601 / standard UUID shape first, then regenerate.",
              },
            ]}
          />
        </Section>

        <Section title="Pro tips">
          <ProTips
            tips={[
              "Multiple samples beat one: unions and optionality only appear across documents.",
              "Pairs with JSON-to-Code: schema for validation, types for compile-time safety.",
              "JSON Diff is the perfect companion when your API contract evolves and you need to re-derive.",
              "Because nothing is uploaded, you can generate schemas from real, sensitive payloads.",
            ]}
          />
        </Section>
      </ToolSeoContent>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {SITE_NAME} — free online developer data tools that run entirely in your browser. Your
            data stays private: nothing you paste is ever uploaded to a server.
          </p>
          <nav
            aria-label="All tools"
            className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}