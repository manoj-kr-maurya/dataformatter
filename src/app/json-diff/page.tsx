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
import { JsonDiffWorkbench } from "@/components/devtools/json-diff-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-diff");

const faqs = [
  {
    q: "How does this JSON diff tool compare my documents?",
    a: "Both documents are parsed into trees, then walked together by key. Values are compared strictly (7, 7.0 and \"7\" all differ); arrays are compared position by position. You get one row per path where the value was added, removed or changed.",
  },
  {
    q: "Can it tell the difference between an added value and a changed one?",
    a: "Yes. When a key exists on both sides but the value differs you get a \"changed\" row showing before and after. Rows with only an after value are \"added\"; only a before value are \"removed\".",
  },
  {
    q: "Does it ignore whitespace and key order?",
    a: "Whitespace is ignored completely — diffs are taken on parsed JSON, not text. Key order is also ignored for objects (it is meaningless in JSON), but element order inside arrays is significant and positional.",
  },
  {
    q: "Is my JSON uploaded anywhere?",
    a: "No. The entire diff runs locally in your browser. Nothing you paste ever leaves this page.",
  },
  {
    q: "What if one of my documents isn't valid JSON?",
    a: "The diff for that side is skipped and the parse error is shown in the results box, along with the location (line/column) of the problem so you can fix it.",
  },
  {
    q: "Can I copy or save the diff?",
    a: "Yes. Copy Diff copies a unified, line-oriented view of every change (paths prefixed + and -); Download saves that same view as a text file.",
  },
] as const;

export default function JsonDiffPage() {
  return (
    <ToolLandingPage
      path="/json-diff"
      summary="Compare two JSON documents side by side and see exactly what changed. Paste your before and after JSON into the live tool — every added, removed and changed value is reported as a precise JSON path."
    >
      <JsonDiffWorkbench />
      <QuickStart
        steps={[
          "Paste the original JSON into Original (A) and the edited version into Changed (B).",
          "Read the summary chips for added, removed and changed counts.",
          "Scan the table: each row shows the path, the kind of change, and the before/after values.",
          "Switch to Unified for a copy-paste friendly, line-oriented view of the same diff.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="What JSON diff compares">
        <p>
          The tool parses both documents completely before comparing, so ordering inside objects and
          all whitespace are correctly ignored — only meaningful differences surface. Comparison
          rules:
        </p>
        <Bullets
          items={[
            "Objects compare key by key; key order never matters.",
            "Arrays compare element by element at the same index.",
            "Values compare strictly: number, string, boolean, null and nested value all have distinct types.",
            "A type change (\"version\": 2 vs \"version\": \"2\") is a changed value, reported with before and after.",
          ]}
        />
      </Section>

      <Section title="How to diff JSON online">
        <Bullets
          items={[
            "Paste the two versions into the A and B editors — results update instantly.",
            "Use Swap to flip which side is treated as original.",
            "Click Expanded rows count to jump past huge tables, or use Copy Diff to hand the result to a colleague.",
            "Keep everything in-browser for private payloads: nothing is transmitted.",
          ]}
        />
        <Example
          input={'{ "name": "Sketch", "version": 2, "tags": ["free", "pro"] }'}
          output={'- $.version  before 2\n+ $.version  after 3\n- $.tags[1] before "pro"\n+ $.license  after "MIT"'}
          inputLabel="Change to one side"
          outputLabel="What the diff reports"
        />
      </Section>

      <Section title="Who diffs JSON — and when">
        <UseCases
          cases={[
            {
              title: "Reviewing teammate PRs",
              body: "A config or fixture changed in a pull request — but the diff is buried in a giant file. Paste both versions here to see a compact list of what actually moved.",
            },
            {
              title: "Confirming API response drift",
              body: "Run an endpoint before and after a deploy, save both responses, and diff them. You'll see exactly which fields the new version added, removed or renamed.",
            },
            {
              title: "Verifying migrations",
              body: "Diff the exported state before and after a data migration to confirm only the intended keys changed.",
            },
          ]}
        />
      </Section>

      <Section title="Common diff surprises">
        <Troubleshooting
          items={[
            {
              error: "\"7\" != 7",
              cause: "One document stores numbers as numbers, the other as quoted strings (for example an export that quotes everything).",
              fix: "Normalize types on one side before comparing — parse the numeric strings back to numbers.",
            },
            {
              error: "Everything shifted, table is a sea of red",
              cause: "An element was inserted or removed in the middle of an array, shifting every later index.",
              fix: "Diff at the object level instead, or sort array records by a stable key so positions align.",
            },
            {
              error: "Parse error on one side",
              cause: "A truncated or malformed document — often a copy that ended mid-payload.",
              fix: "Re-copy the full document; the reported line and column points at the first invalid token.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Tiny formatting changes never appear — the diff is structural, not textual.",
            "Nested changes are flattened to dot paths like $.owner.address.city so they're easy to locate and reason about.",
            "Still using someone else's online diff tool? This one never sends your API responses across the network.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}