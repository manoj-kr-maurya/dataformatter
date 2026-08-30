import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import {
  Section,
  Bullets,
  Faq,
  FaqJsonLd,
  QuickStart,
  UseCases,
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/uuid-generator");

const faqs = [
  {
    q: "Are these real UUIDs?",
    a: "Yes — each one is an RFC 4122 version-4 UUID: the version nibble is set to 4 and the variant nibble to one of 8, 9, a or b, in the standard 8-4-4-4-12 hex grouping.",
  },
  {
    q: "Can I generate more than five at once?",
    a: "Yes. The number in the editor is the count — type 100 or 1,000 and the output shows that many UUIDs, one per line.",
  },
  {
    q: "Are the UUIDs cryptographically secure?",
    a: "No. They build on the browser's Math.random, which is fast but not designed for security. They are perfect for database keys, mocks and test data; for session tokens, reset links or anything security-sensitive use a CSPRNG such as crypto.randomUUID() or a library like uuid v4 in Node.js.",
  },
  {
    q: "What makes UUIDs useful in databases?",
    a: "UUIDs are globally unique with no central coordination, so multiple app instances or databases can mint keys without colliding. That's why they're common as primary keys and as idempotency keys for outbound requests.",
  },
  {
    q: "Is anything uploaded when I generate UUIDs?",
    a: "No. Generation runs entirely in your browser — the identifiers are created locally and nothing leaves this page.",
  },
  {
    q: "What else is in the random generator toolbox?",
    a: "The Random Generators hub also covers IP addresses, times, JSON, XML, CSV, hex, dates, binary and bytes — and the related tools below point at hashing and fixture builders.",
  },
] as const;

export default function UuidGeneratorPage() {
  return (
    <ToolLandingPage
      path="/uuid-generator"
      summary="Generate random UUID v4 identifiers on demand. Set a count and the tool below writes RFC 4122 version-4 UUIDs, one per line — ready for database keys, API mocks and test fixtures. Generation happens entirely in your browser, so nothing you create is uploaded."
    >
      <EmbeddedWorkspace mode="RANDOM_UUID" label="UUID v4 generator editor" />
      <QuickStart
        steps={[
          "Leave the default count or type how many UUIDs you need in the editor — UUIDs render instantly, one per line.",
          "Use Copy to grab all of them, or Download to save plain-text identifiers.",
          "Paste them into migrations, fixtures or mock API responses.",
          "For security-sensitive identifiers, reach for a cryptographic generator instead — see the FAQ below.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="What the generator produces">
        <Bullets
          items={[
            "RFC 4122 version-4 UUIDs — the version nibble is 4 and the variant nibble is in 8, 9, a, b.",
            "Lowercase hex in the standard 8-4-4-4-12 grouping with dashes.",
            "One UUID per line, in whatever quantity the count editor asks for.",
            "Generation is local: Math.random in your own tab, no network involved.",
          ]}
        />
      </Section>

      <Section title="When random UUIDs help">
        <UseCases
          cases={[
            {
              title: "Database primary keys",
              body: "Seed development databases with unique IDs so records merge cleanly across environments instead of colliding with auto-increment sequences.",
            },
            {
              title: "API mocks and idempotency",
              body: "Mock services hand out realistic UUIDs so request/response contracts and deduplication logic can be exercised against values that behave like production ones.",
            },
            {
              title: "Data migration and dedup scripts",
              body: "Generate keys for rows that lack them, tag batch imports with fresh identifiers, and match on UUIDs instead of fragile natural keys.",
            },
          ]}
        />
      </Section>

      <Section title="A word on randomness quality">
        <Bullets
          items={[
            "Math.random is fast and fine for mocks, fixtures and dev databases where uniqueness is what matters.",
            "It is not a cryptographic source — do not use these UUIDs for password resets, sessions, CSRF tokens or other secrets.",
            "For security contexts call crypto.randomUUID() (browser and modern Node) or your platform's v4 implementation.",
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Log the count and the generated list when pair-matching IDs — UUIDs make fixture referential integrity trivial to eyeball.",
            "Combine with the JSON converter to insert UUIDs into payload fixtures directly.",
            "Generate a full set up-front and paste it into a seed SQL file for reproducible local development.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}