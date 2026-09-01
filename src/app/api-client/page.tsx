import type { Metadata } from "next";
import { ApiClientWorkbench } from "@/components/api-client/api-client-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import { Section, Bullets, UseCases } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/api-client");

const faqs = [
  {
    q: "Is DataFormatter's API Client free and does it need an account?",
    a: "Yes, it is completely free with no account or signup required. You can build and send requests straight from your browser.",
  },
  {
    q: "Does the API Client send my requests through a proxy?",
    a: "No. Requests are sent directly to the target endpoint from your browser — there is no server-side proxy, so nothing is forwarded, logged or uploaded.",
  },
  {
    q: "Which HTTP methods and features does it support?",
    a: "It supports GET, POST, PUT and DELETE with custom headers, auth and JSON bodies, and can import a cURL command to reconstruct a request.",
  },
  {
    q: "Why might a request fail in the browser?",
    a: "Because requests go directly to the endpoint, cross-origin calls only succeed if that endpoint allows them via CORS. This is what keeps the request between you and the target — no intermediate service.",
  },
] as const;

export default function ApiClientPage() {
  return (
    <>
      <ApiClientWorkbench />
      <ToolSeoContent
        path="/api-client"
        summary="DataFormatter API Client is a free online tool that builds GET, POST, PUT and DELETE requests with headers, auth and JSON bodies and sends them straight from your browser — with no proxy, proxy logging or account."
        faqs={faqs}
      >
        <Section title="What the API Client does">
          <Bullets
            items={[
              "Build and send GET, POST, PUT and DELETE requests with a full set of headers, authentication and a JSON body.",
              "Import a cURL command to reconstruct the exact request you are debugging.",
              "See raw response status, headers and body, then funnel them into related tools for formatting or inspection.",
              "Send directly to the endpoint — no server-side proxy sits between you and the target.",
            ]}
          />
        </Section>

        <Section title="When to use an in-browser API client">
          <UseCases
            cases={[
              {
                title: "Debugging an endpoint",
                body: "Replay a request and inspect the raw response while you iterate on headers or the body.",
              },
              {
                title: "Trying authentication",
                body: "Test bearer tokens, basic auth or custom headers against a local or staging server.",
              },
              {
                title: "Reproducing a cURL call",
                body: "Paste a cURL command to import it, then tweak and resend it without leaving the tab.",
              },
            ]}
          />
        </Section>

        <Section title="Why direct-from-browser requests matter">
          <p>
            Because the client has no server-side proxy, your request goes straight to the target
            endpoint. That means there is no third-party service that could log, cache or forward
            your payload — which is important when you are testing against internal or
            token-protected APIs with sensitive data.
          </p>
        </Section>
      </ToolSeoContent>
    </>
  );
}
