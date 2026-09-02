import type { Metadata } from "next";
import { HarDebuggerWorkbench } from "@/components/har/har-debugger-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import { Section, Bullets, UseCases } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/har");

const faqs = [
  {
    q: "Is the HAR analyzer free and does it need a signup?",
    a: "Yes, it is completely free with no account or signup. Paste a HAR export or drop a .har file and the analysis runs instantly in the browser.",
  },
  {
    q: "Does the HAR debugger upload my network traffic to a server?",
    a: "No. The HAR document never leaves your machine — parsing, analytics and waterfall rendering all run locally in your tab. A HAR file can contain URLs, tokens and cookies, so you can also sanitize a copy before sharing it anywhere else.",
  },
  {
    q: "Which tools produce a HAR I can load?",
    a: "Any HAR 1.2 export works, including Chrome's Lighthouse and Network record (Export HAR), Firefox, Safari and cURL's --har / -o option. If your capture is in JSON but not recognized as a HAR document, the tool says so explicitly.",
  },
  {
    q: "What does the analysis tell me that the DevTools view did not?",
    a: "Findings are grouped across the whole capture: repeated failing endpoints, groups of 401/403 or 404 responses, the request that dominates a slow page, duplicate calls, oversized payloads, missing security headers and CORS problems. Every finding is a labeled observation with its evidence row, never a guarantee.",
  },
] as const;

export default function HarPage() {
  return (
    <>
      <HarDebuggerWorkbench activeHref="/har" />
      <ToolSeoContent
        path="/har"
        summary="DataFormatter HAR Analyzer is a free, browser-based network debugger that parses a HAR 1.2 capture, surfaces failed and slow requests, repeated errors, CORS and caching issues, and shows per-request timing waterfalls and headers — with no signup, no upload and no cloud."
        faqs={faqs}
      >
        <Section title="What the HAR debugger does">
          <p>
            The DevTools network tab is great while a page is open, but once you export a HAR you are left reading a
            thousand-line JSON file. This workbench turns that export back into something useful: a clean request list
            with status, time and size, a waterfall that highlights the phase each request spent its time in, and an
            findings panel that summarizes problems across the whole capture.
          </p>
          <Bullets
            items={[
              "Request list — every entry grouped by status class (2xx–5xx) with filters for failed and slow requests, free-text URL search and sorting by time, size or status.",
              "Waterfall — each request is drawn against the longest one, and the timing panel shows which phase (DNS, connect, SSL, wait, receive) dominated, using only the timing data actually present in the export.",
              "Findings — repeated endpoint failures, auth (401/403) clusters, 404 groups, duplicate calls, oversized responses, cache and CORS checks and missing security headers, each labeled as an observation with its evidence row.",
              "Detail inspection — request and response headers, query parameters, cookies and bodies with format, validate, copy and download, plus local JWT inspection for Bearer tokens with values masked by default.",
              "Sanitize HAR — exports a copy with authorization and cookie values masked and cookie payloads cleared, so a capture can be shared without leaking credentials.",
              "Everything local — the HAR is parsed in your browser. Nothing is uploaded, stored or sent to any server.",
            ]}
          />
        </Section>
        <Section title="Reading the findings">
          <p>
            Findings are grouped by severity — critical, error, warning, info and healthy — and every finding is an
            observation about the capture, not a verdict. Where a heuristic needs a threshold (slow requests default to
            over 1000 ms), the value is adjustable and stated alongside the finding. This keeps the analysis honest:
            each conclusion is traceable back to the exact request rows that produced it.
          </p>
        </Section>
        <UseCases
          cases={[
            {
              title: "Debugging a slow page",
              body: "Open the Requests view, sort by slowest, and read the timing panel to see whether the delay is the server wait or your DNS and connect phases.",
            },
            {
              title: "Troubleshooting an API from a user report",
              body: "Drop the exported HAR from a customer session and let the findings panel surface the 401s, 404 groups and duplicate calls without reading raw JSON.",
            },
            {
              title: "Sharing a capture safely",
              body: "Run Sanitize HAR before attaching a capture to a ticket or sending it to a collaborator, so tokens and cookies do not leave with the file.",
            },
          ]}
        />
      </ToolSeoContent>
    </>
  );
}