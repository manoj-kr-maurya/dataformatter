import type { Metadata } from "next";
import { ApiDiffWorkbench } from "@/components/api-diff/api-diff-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import { Section, Bullets, UseCases } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/api-diff");

const faqs = [
  {
    q: "Is the API breaking change detector free and does it need a signup?",
    a: "Yes, it is completely free with no account or signup. Paste two API versions and the comparison runs instantly in the browser.",
  },
  {
    q: "Does the tool upload my JSON schemas or API payloads?",
    a: "No. The two documents never leave your machine — comparison and classification run locally in your tab, exactly like the rest of DataFormatter.",
  },
  {
    q: "What kinds of documents can I compare?",
    a: "Plain JSON responses and JSON-Schema-style documents. When schema keywords like required, type and enum are present, the detector accounts for them (a new required field, a removed enum value or a tightened type are flagged as breaking).",
  },
  {
    q: "Are the classifications guaranteed to be correct?",
    a: "No — every flagged change is a heuristic observation, not a verdict. Breaking, potentially-breaking, non-breaking and informational groups give you a review order; a change classified as non-breaking can still break a consumer that depended on it.",
  },
] as const;

export default function ApiDiffPage() {
  return (
    <>
      <ApiDiffWorkbench activeHref="/api-diff" />
      <ToolSeoContent
        path="/api-diff"
        summary="DataFormatter API Breaking Change Detector is a free, browser-based tool that compares two JSON APIs or JSON Schemas, classifies every difference as breaking, potentially-breaking, non-breaking or informational, and builds a compatibility report — with no signup and no upload."
        faqs={faqs}
      >
        <Section title="What the API diff detector does">
          <p>
            Shipping a new API version is risky when you cannot see what actually changed. Paste the previous and current
            version side by side and this workbench reduces the delta to a prioritized report: breaking changes first, then
            potentially-breaking, non-breaking and informational ones — each with its exact JSON path and the before / after
            values that produced it.
          </p>
          <Bullets
            items={[
              "Schema-aware analysis — when the documents use JSON Schema keywords, the detector understands them: a newly required field, a removed enum value, a type narrowed away from null or a field removed from properties are breaking, while relaxed types and enum additions are not.",
              "Plain JSON fallback — comparing raw payloads still works: removed fields and type/shape changes surface as breaking, added fields as non-breaking.",
              "Shape-flip detection — containers that flip between object and array are called out explicitly instead of being lost in field-level noise.",
              "Prioritized report — changes are sorted breaking → informational, with a count summary, a side-by-side editor, and a filterable list you can search by severity.",
              "Local and private — both documents are analyzed entirely in your browser. Nothing is uploaded or stored.",
            ]}
          />
        </Section>
        <Section title="Reading the classifications">
          <p>
            Each change is an observation, presented with its evidence (the path and the before → after values). Breaking
            and potentially-breaking entries are candidates to block a release; non-breaking entries rarely need attention;
            informational entries describe nested structure or scalar value changes you may want to eyeball. When schema
            keywords are missing, required-vs-optional assumptions cannot be made — the description says so explicitly.
          </p>
        </Section>
        <UseCases
          cases={[
            {
              title: "Reviewing a release branch",
              body: "Take the schemas from main and the release branch, and scan the breaking list before approving the merge.",
            },
            {
              title: "Checking a third-party API upgrade",
              body: "Compare the documented response shapes from the old and new versions of an SDK you depend on, so you know what to fix before switching.",
            },
            {
              title: "Auditing a contract change",
              body: "Confirm that a change you intended as backward-compatible (an added field, a relaxed type) shows up as non-breaking rather than breaking.",
            },
          ]}
        />
      </ToolSeoContent>
    </>
  );
}