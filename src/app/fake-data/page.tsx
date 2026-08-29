import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import {
  Section,
  Bullets,
  Faq,
  FaqJsonLd,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { FakeDataWorkbench } from "@/components/devtools/fake-data-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/fake-data");

const faqs = [
  {
    q: "What kinds of fake data can it generate?",
    a: "24 field types: people (names, email, username, phone, addresses, companies, job titles), identifiers (UUID v4, IPv4, IPv6, MAC, hex colors, URLs), text (words, sentence, paragraph) and values (ISO date, ISO time, number, boolean). Mix and match columns freely.",
  },
  {
    q: "Why does the same seed give the same data?",
    a: "Output is driven by a seeded deterministic random generator (mulberry32). The same seed plus the same fields and row count reproduces byte-identical rows — perfect for repeatable tests and fixtures.",
  },
  {
    q: "Is the generated data realistic?",
    a: "Names, addresses and companies come from broad local pools that favor realistic-looking combinations (no duplicated 'John Doe' everywhere), while identifiers and IPs follow their real formats so downstream parsing works.",
  },
  {
    q: "How do I get JSON or CSV out?",
    a: "Switch the segmented control to JSON or CSV and tab-separated, then Copy or Download. File extensions and MIME types adjust to match the format.",
  },
  {
    q: "Is this data safe to use in demos and commit?",
    a: "Yes — it's entirely fabricated and generated locally. No personal data is involved, and nothing is uploaded, so what you generate here is safe to commit as fixtures.",
  },
  {
    q: "Can I preview before exporting?",
    a: "Yes. The table preview shows the first 8 rows live as you edit fields, while Copy/Download export the full requested row count.",
  },
] as const;

export default function FakeDataPage() {
  return (
    <ToolLandingPage
      path="/fake-data"
      summary="Generate realistic fake data for demos, tests and prototypes — names, emails, UUIDs, IPs, dates and more, in table, JSON or CSV. Deterministic seeds make it reproducible."
    >
      <FakeDataWorkbench />
      <QuickStart
        steps={[
          "Start from the default columns, or remove them and Add field for your schema.",
          "Pick a type per column from 24 generators, and name it to match your API.",
          "Set the row count and a seed (same seed = same output).",
          "Preview the table, then switch to JSON or CSV and Copy or Download.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="The field library">
        <Bullets
          items={[
            "People: fullName, firstName, lastName, email, username, phone.",
            "Addresses & orgs: street, city, country, company, jobTitle.",
            "Identifiers: uuid, ipv4, ipv6, mac, hexColor, url.",
            "Text: words, sentence, paragraph for realistic copy blocks.",
            "Values: dateIso, timeIso, number, boolean for tests and dashboards.",
          ]}
        />
      </Section>

      <Section title="Who generates fake data — and when">
        <UseCases
          cases={[
            {
              title: "Seeding a development database",
              body: "Emails, UUIDs and ISO dates that actually satisfy your app's constraints. Because it's seeded, every developer gets the same fixture set.",
            },
            {
              title: "Prototyping UI states",
              body: "Generate 200 user rows with varied names and companies in seconds, paste them into a mock endpoint, and style your tables with realistic content.",
            },
            {
              title: "Writing contract tests",
              body: "Export the same seeded dataset as JSON and pin it in a test fixture — assertions become reproducible across CI runs.",
            },
          ]}
        />
      </Section>

      <Section title="When output surprises you">
        <Troubleshooting
          items={[
            {
              error: "Rows changed between sessions",
              cause: "The seed text changed, or fields were reordered — field names, order and seed all feed the generator.",
              fix: "Fix the seed and keep the column order identical, then export again.",
            },
            {
              error: "Two columns share a name",
              cause: "Equal field names overwrite each other in the CSV/JSON export.",
              fix: "Rename one column (like email_work / email_personal) or use distinct labels.",
            },
            {
              error: "I wanted realistic unique emails but see patterns",
              cause: "Email is derived from local names, so two 'same-named' people can collide on seed.",
              fix: "Add a uuid column as a unique key, or append a counter suffix yourself.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Commit the seed and column list with your fixtures so anyone can regenerate identical data.",
            "Pair with ENV Validator for placeholder values in .env.example files you need to fill.",
            "JSON export uses double quotes and proper types, so it's safe to pipe into seed scripts.",
            "Local generation means even security-conscious teams can use it for real-world-shaped test data.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}