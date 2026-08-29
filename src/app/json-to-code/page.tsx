import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import {
  Section,
  Bullets,
  Faq,
  FaqJsonLd,
  Example,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { JsonToCodeWorkbench } from "@/components/devtools/json-to-code-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-to-code");

const faqs = [
  {
    q: "How does JSON become code?",
    a: "The tool infers a type model from your JSON: objects become records/classes, arrays become collections, and values become their nearest scalar type (integer, number, string, boolean, null). It then renders that model in your chosen language — no server involved, so private payloads never leave the browser.",
  },
  {
    q: "What languages are supported?",
    a: "TypeScript interfaces, TypeScript type aliases, Java classes and records, C# classes, Go structs, Python dataclasses, Kotlin data classes, and Swift structs. Pick the generator from the segmented control above the output.",
  },
  {
    q: "How are types detected?",
    a: "Scalars map directly, with integer vs number distinguished. Useful string shapes are also recognized: email addresses, UUIDs, dates (YYYY-MM-DD), date-times (ISO-8601) and URLs get format-aware types or validation in the generated schema.",
  },
  {
    q: "What happens when the root JSON isn't an object?",
    a: "If your JSON is a bare array, string, or number, code generation points that out and asks for an object at the root — most real-world payloads are objects, and giving them a name (the Target type name field) is what makes the generated code useful.",
  },
  {
    q: "How do I name my model?",
    a: "The Target type name field sets the name of the root interface/class/struct (default User). It's applied to both the root type and any nested definition it derives from that name.",
  },
  {
    q: "Is the generated code production-ready?",
    a: "It's idiomatic and copy-paste ready, but treat it as a starting skeleton: nullable fields may need Optional/nullable annotations in your stack, and format hints (uuid, email) are validated only where your runtime supports them.",
  },
] as const;

export default function JsonToCodePage() {
  return (
    <ToolLandingPage
      path="/json-to-code"
      summary="Generate TypeScript, Java, C#, Go, Python, Kotlin or Swift type definitions from a JSON sample. Paste any document and instantly get idiomatic, copy-paste-ready models — computed entirely in your browser."
    >
      <JsonToCodeWorkbench />
      <QuickStart
        steps={[
          "Paste a representative JSON document into the input.",
          "Set the Target type name for the root model (defaults to User).",
          "Choose a generator: TypeScript, Java, C#, Go, Python, Kotlin or Swift.",
          "Copy the generated code or download it as a source file.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="What JSON to code generates">
        <p>
          JSON becomes a typed model through a shared inference step, then that model is rendered
          per language. This gives you consistent class design everywhere:
        </p>
        <Bullets
          items={[
            "Objects become interfaces, classes, structs or dataclasses with named properties.",
            "Arrays become typed collections (ReadonlyArray/List/[]/> etc.) of their element type.",
            "Numbers are split into integer vs floating-point where the target language supports it.",
            "Named string formats (email, uuid, date, date-time, url) are preserved as hints.",
            "Nullable fields flow through to optional types (?, Optional, optional) where the language has them.",
          ]}
        />
      </Section>

      <Section title="How to convert JSON to code online">
        <Bullets
          items={[
            "Paste a single document or a member of your API's response array.",
            "Tweak the target type name if you want a specific class name.",
            "Switch generators to compare how each language models the same payload.",
            "Everything runs client-side — paste test data, secrets or production responses safely.",
          ]}
        />
        <Example
          input={`{ "id": 42, "roles": ["admin"], "active": true }`}
          output={`export interface User {\n  id: number;\n  roles: string[];\n  active: boolean;\n}`}
          inputLabel="JSON sample"
          outputLabel="TypeScript interface"
        />
      </Section>

      <Section title="Who converts JSON to code — and when">
        <UseCases
          cases={[
            {
              title: "Bootstrap API clients",
              body: "Greenfield integration? Paste one example response and get the data classes you'd otherwise hand-write — then extend them with your domain rules.",
            },
            {
              title: "Next.js & TypeScript users",
              body: "Get a typed interface for an endpoint in seconds, or a Zod schema from the sibling JSON-to-Schema tool for runtime validation.",
            },
            {
              title: "Keeping backends and frontends in sync",
              body: "When an API contract changes, diff the old and new sample to see the delta, then regenerate the model to match.",
            },
          ]}
        />
      </Section>

      <Section title="Common issues">
        <Troubleshooting
          items={[
            {
              error: "\"Inference failed\" or \"Generation failed\"",
              cause: "Invalid JSON, or a shape the model cannot represent (for example deeply cyclic or mixed-type arrays).",
              fix: "Validate the JSON first, and keep arrays homogeneous — a number[] with one string entry confuses every type system.",
            },
            {
              error: "\"expects an object at the root\"",
              cause: "The top-level JSON is an array, string, number or boolean rather than an object.",
              fix: "Paste one element of the array instead, or wrap the sample in an object.",
            },
            {
              error: "All fields non-optional",
              cause: "A single sample can't prove optionality — inference marks every observed key as required.",
              fix: "Adjust optional flags by hand, or provide the sibling Schema tool with several samples so it can learn which keys disappear.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Use a realistic sample, not a trimmed stub — property names and nesting are what shape the generated types.",
            "Vertically aligned JSON is fine; inference only reads structure, not formatting.",
            "Prefer the schema tool when you need validation rules; prefer this one when you need type declarations.",
            "Private API payloads stay in your machine — no upload, no trial-copying into sketchy converters.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}