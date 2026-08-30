import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
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
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-to-yaml");

const faqs = [
  {
    q: "What does this JSON to YAML converter produce?",
    a: "Indentation-based YAML that mirrors the JSON tree exactly: objects become nested keys, arrays become dash-prefixed lines, and scalars keep their type. Numbers and booleans stay unquoted, while strings that could be misread are quoted.",
  },
  {
    q: "Can it round-trip back to JSON?",
    a: "Yes, structurally. Convert the YAML back through the YAML to JSON parser in the Parsers hub and you get the same data — comments and anchors are not part of JSON, so they cannot survive the round trip.",
  },
  {
    q: "Why did a plain string get quotes?",
    a: "Values that look like numbers, booleans (true/false/yes/no), or contain YAML marker characters are quoted so the emitting tool doesn't silently change their type when a YAML parser reads them back.",
  },
  {
    q: "Does it support anchors, aliases or multi-document files?",
    a: "No. This converter emits a single plain YAML document from your JSON. Anchors, aliases and multiple documents are YAML-only features with no JSON equivalent, so they can't come from a JSON source.",
  },
  {
    q: "Is my JSON uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — nothing you paste leaves this page.",
  },
  {
    q: "Which YAML version does the output target?",
    a: "The output uses widely compatible indentation-based YAML (mapping and sequence blocks) that works across YAML 1.1 and 1.2 parsers in Docker Compose, Kubernetes, GitHub Actions and Ansible.",
  },
] as const;

export default function JsonToYamlPage() {
  return (
    <ToolLandingPage
      path="/json-to-yaml"
      summary="Turn valid JSON into indentation-based YAML for Docker Compose, Kubernetes manifests, CI files and Ansible roles. Paste your JSON above and it converts with correct quoting for numbers, booleans, empty strings and marker-heavy scalars — all processed locally in your browser."
    >
      <EmbeddedWorkspace mode="JSON_TO_YAML" label="JSON to YAML converter editor" />
      <QuickStart
        steps={[
          "Paste the JSON object or array you want to convert into the editor — the YAML renders automatically.",
          "Check the indentation: each nesting level adds two spaces, and array items use a dash prefix.",
          "Use Copy to put the YAML in your clipboard, or Download to save it as a .yaml file.",
          "Paste it into your compose file, manifest or workflow and run it through your parser to confirm.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="How the conversion works">
        <Bullets
          items={[
            "JSON objects become YAML mappings — key: value with two-space indentation per level.",
            "JSON arrays become YAML sequences — each element on its own dash-prefixed line.",
            "Numbers and booleans are emitted unquoted so they stay numbers and booleans.",
            "Strings that look numeric, boolean-ish, or contain YAML markers are quoted to prevent coercion.",
            "Null becomes null, and empty strings, objects and arrays are emitted explicitly.",
          ]}
        />
      </Section>

      <Section title="JSON to YAML example">
        <Example
          input='{ "image": "nginx:1.27", "replicas": 3, "env": { "MODE": "prod", "flag": "on" } }'
          output='image: nginx:1.27
replicas: 3
env:
  MODE: prod
  flag: "on"'
          inputLabel="JSON input"
          outputLabel="YAML output"
        />
      </Section>

      <Section title="Where JSON to YAML fits">
        <UseCases
          cases={[
            {
              title: "Container orchestration files",
              body: "Your service config starts life as JSON from a generator or registry. Convert it to YAML for Kubernetes manifests, Helm values or docker-compose services.",
            },
            {
              title: "Configuration-as-code in CI",
              body: "GitHub Actions, GitLab CI and Ansible prefer YAML. Convert a JSON job definition into the exact structure those runners expect.",
            },
            {
              title: "Publishing schemas to humans",
              body: "Handing a JSON-shaped contract to a team that reads YAML daily? Convert it once for the docs so reviewers see the structure they're used to.",
            },
          ]}
        />
      </Section>

      <Section title="YAML pitfalls, explained">
        <Troubleshooting
          items={[
            {
              error: "value \"on\" came out as \"on\" with quotes",
              cause: "YAML 1.1 parsers treat yes/no/on/off as booleans, so the converter quotes them to protect the string.",
              fix: "No action needed — the quotes are the correct, lossless encoding of that string.",
            },
            {
              error: "A value like \"007\" got quoted",
              cause: "The string looks numeric, and unquoted it could be parsed as the number 7.",
              fix: "Be aware when comparing values: the quoted form preserves the original text exactly.",
            },
            {
              error: "Invalid JSON: unexpected token",
              cause: "You pasted YAML itself (or JSON with comments/trailing commas) — this converter reads strict JSON only.",
              fix: "Convert the YAML to JSON first with the YAML parser in the Parsers hub, then convert back here.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "JSON is the safer source of truth — convert JSON to YAML, not the other way around, and you never lose types or gain coerce bugs.",
            "Simplified quoting means the output reads naturally in a PR review and stays compact.",
            "Flatten nested values first if your target (like some CI linters) dislikes deep maps.",
            "Everything runs locally, so secrets and internal configs never leave your machine while you convert them.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}