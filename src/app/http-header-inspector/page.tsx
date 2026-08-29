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
import { HttpHeaderInspectorWorkbench } from "@/components/devtools/http-header-inspector-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/http-header-inspector");

const faqs = [
  {
    q: "What does the header inspector understand?",
    a: "It parses any raw header block (one header per line, like a request or response printed by curl -i or the DevTools Headers tab) and analyzes the security, caching, cookie and CORS relevant headers it recognizes. Everything else is listed as unrecognized rather than guessed at.",
  },
  {
    q: "How are findings categorized?",
    a: "Each finding has a tone — ok, warn, info or error — plus a category (Security, Caching, Cookie, CORS, Transport, Protocol). Errors are definite problems like a CORS wildcard paired with credentials; warnings are observations that usually warrant a look.",
  },
  {
    q: "Does it claim a header is missing?",
    a: "No. The inspector treats headers as optional unless a spec demands them, and you haven't necessarily pasted the complete set. It reports observations about the headers you supply, not demands about ones you didn't.",
  },
  {
    q: "Is my header block uploaded?",
    a: "No. Parsing and analysis run entirely in your browser, so copies of real Set-Cookie or Authorization values that include a header block never leave the page.",
  },
  {
    q: "How do I actually get a header block to paste?",
    a: "Use curl -i https://example.com, or open DevTools → Network, click a request, and copy the headers under the Request Headers/Response Headers section. Both produce the line-per-header format this tool reads.",
  },
  {
    q: "What's the difference between info and ok findings?",
    a: "ok confirms a header has a recommended value (e.g. nosniff set correctly). info just describes behavior — like an HSTS max-age or a SameSite cookie setting — without passing judgment.",
  },
] as const;

export default function HttpHeaderInspectorPage() {
  return (
    <ToolLandingPage
      path="/http-header-inspector"
      summary="Analyze HTTP headers in seconds. Paste a raw header block and get a categorized report — security, caching, cookies and CORS findings with before-state honesty, computed entirely in your browser."
    >
      <HttpHeaderInspectorWorkbench />
      <QuickStart
        steps={[
          "Copy headers from DevTools (Network → Headers) or curl -i output.",
          "Paste them into the box, one header per line.",
          "Review the findings: errors first, then warnings, then info.",
          "Use the filter to isolate a topic like cache, cookie or CORS.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="What header inspection checks">
        <Bullets
          items={[
            "Cache-Control semantics — privately-cacheable vs public and revalidation flags.",
            "Cookie markers — HttpOnly, Secure, SameSite strictness and Domain/Path scope.",
            "CORS coherence — a wildcard Access-Control-Allow-Origin never pairs with credentials.",
            "Transport settings — HSTS max-age, upgrade-insecure-requests, redirection hints.",
            "Security headers — X-Frame-Options, X-Content-Type-Options, CSP presence and permissions policy.",
            "Credential hygiene — plumbing headers like Authorization, token names and shared secrets usage flags.",
          ]}
        />
      </Section>

      <Section title="How to analyze headers online">
        <Bullets
          items={[
            "Paste a complete block to avoid false gaps — partial header sets yield partial advice.",
            "Sort by severity: nickname errors clearly; worth flagging, not required for small internal tools.",
            "Filter by category to audit one concern (optimize caching, harden cookies).",
            "Copy Report or Download to share the inspection with a teammate or attach to an issue.",
          ]}
        />
        <Example
          input={`access-control-allow-origin: *\naccess-control-allow-credentials: true`}
          output={`[error] CORS · access-control-allow-credentials\nBrowsers reject requests when credentials ship with a wildcard origin.`}
          inputLabel="Problematic header pair"
          outputLabel="What inspection reports"
        />
      </Section>

      <Section title="Who inspects headers — and when">
        <UseCases
          cases={[
            {
              title: "Before shipping a new endpoint",
              body: "Paste the response headers of an API before go-live and catch the CORS-with-credentials or missing-SameSite mistake early.",
            },
            {
              title: "Auditing an inherited service",
              body: "You inherited a server with no docs. A quick paste of its response headers tells you how cookies, caching and transport are actually configured.",
            },
            {
              title: "Debugging unexpected browser behavior",
              body: "Cached responses, silently dropped cross-site cookies, blocked frames — the header block usually reveals which.",
            },
          ]}
        />
      </Section>

      <Section title="When the report looks odd">
        <Troubleshooting
          items={[
            {
              error: "Nothing parsed",
              cause: "The paste doesn't contain Name: Value lines — common when you copy the entire DevTools Headers section including its HTML table.",
              fix: "Switch to the raw/copy view in DevTools, or paste the plain response text from curl -i.",
            },
            {
              error: "Header shown as unrecognized",
              cause: "A custom or less common header this tool doesn't have a rule for.",
              fix: "Count it as informational; the exact value is preserved so you can read it yourself. Report gaps via GitHub issues.",
            },
            {
              error: "A website scores fine here but elsewhere warns about missing headers",
              cause: "Different tools demand different baselines — this inspector only judges what you paste.",
              fix: "If you pasted a complete block and care about hardening, add the headers the warn findings mention.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Paste response headers for EC-site audits and request headers when debugging CORS preflights.",
            "Download a report before and after a change to see the delta over time.",
            "Combine with the cURL to Code tool to build a request that reproduces the exact header set you're inspecting.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}