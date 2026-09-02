import type { Metadata } from "next";
import { ErrorWorkspaceWorkbench } from "@/components/error-workspace/error-workspace-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import { Section, Bullets, UseCases } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/error-workspace");

const faqs = [
  {
    q: "What can I paste into the error workspace?",
    a: "A stack trace, service logs (timestamped lines, JSON logs or access logs), the failing request and response, and deploy context like version or environment. Every slice is optional and is correlated with the others when the evidence supports it.",
  },
  {
    q: "How are findings and severities determined?",
    a: "Heuristically, in the browser: a 5xx response becomes critical, a message repeated across log lines is flagged as a repeat, trace IDs are correlated between the logs and request headers. Every finding is labeled as an observation — there are no guaranteed verdicts.",
  },
  {
    q: "Does it produce a runnable reproduction request?",
    a: "Yes. When request evidence is present, the Reproduction tab builds the same cURL and code snippets (fetch, axios, Python, Java, Go) as DataFormatter's cURL converter, so you can replay the failing call locally.",
  },
  {
    q: "Is my incident data uploaded anywhere?",
    a: "No. Stack traces, logs, request and response bodies never leave your browser. Export (Markdown or JSON) writes a file to your own machine only.",
  },
] as const;

export default function ErrorWorkspacePage() {
  return (
    <>
      <ErrorWorkspaceWorkbench activeHref="/error-workspace" />
      <ToolSeoContent
        path="/error-workspace"
        summary="DataFormatter Production Error Workspace correlates a stack trace, service logs, the failing request and its response into one prioritized debugging report — with a reproduction command, trace-ID correlation and export to Markdown or JSON, all fully local and free."
        faqs={faqs}
      >
        <Section title="What the error workspace does">
          <p>
            Incident debugging means pulling together a stack trace from your APM, logs from the service, the request that
            failed and the response it got. The Production Error Workspace normalizes those slices into one session: a
            parsed exception with its call chain, structured log lines with level and trace IDs, a request/response pair,
            deploy metadata, and a prioritized list of observations ranked critical first.
          </p>
          <Bullets
            items={[
              "Correlated by design — a trace ID that appears in a log line and in the request headers is joined; an exception that also shows up in the logs is called out as consistent evidence.",
              "Stack-trace aware — the parser detects Java, Node/V8, Python, Go, .NET and more, extracts the exception type and message, and builds a top-down call chain.",
              "Log-aware — service prefix detection, level counts, repeated-error grouping and an hourly timeline come from the built-in log analyzer.",
              "Runnable reproduction — the request slice becomes a cURL command and per-language code snippets you can execute against your own environment.",
              "Private and exportable — everything runs locally; Markdown or JSON reports are generated on your machine.",
            ]}
          />
        </Section>
        <Section title="Triage, not verdicts">
          <p>
            Findings are labeled observations with their evidence and a location rather than absolute claims. A critical
            severity means &quot;this slice of evidence shows a server-side failure&quot;; the description explains why. Use the
            ordering to decide what to look at first, then pair it with your own system state before acting.
          </p>
        </Section>
        <UseCases
          cases={[
            {
              title: "Post-incident review",
              body: "Paste the captured trace, logs and request from an on-call window, export the Markdown report and attach it to the incident ticket.",
            },
            {
              title: "Reproducing in isolation",
              body: "Take the request evidence from a failed payload and generate a cURL or code snippet to replay it against staging.",
            },
            {
              title: "Pre-release smoke failures",
              body: "Expressions that fail only in a specific deploy? Add version and environment metadata to correlate the finding set against changelogs.",
            },
          ]}
        />
      </ToolSeoContent>
    </>
  );
}