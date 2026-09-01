import type { Metadata } from "next";
import { ApiClientWorkbench } from "@/components/api-client/api-client-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import { Section, Bullets, UseCases } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/api-tester");

const faqs = [
  {
    q: "Is DataFormatter's API Tester free and does it require signup?",
    a: "Yes, it is completely free with no account or signup. You can build and send GET, POST, PUT and DELETE requests straight from your browser.",
  },
  {
    q: "Does the API Tester use a proxy or log my requests?",
    a: "No. Requests are sent directly to the target endpoint from your browser — there is no server-side proxy, so nothing is forwarded, logged or uploaded.",
  },
  {
    q: "Why does a request sometimes fail?",
    a: "Because calls go straight to the endpoint, cross-origin endpoints only respond when they allow it via CORS. This is by design — it means no intermediate service ever touches your request.",
  },
  {
    q: "What can I send with the API Tester?",
    a: "You can build GET, POST, PUT and DELETE requests with custom headers, authentication and JSON bodies, replay them, and inspect the raw response.",
  },
] as const;

export default function ApiTesterPage() {
  return (
    <>
      <ApiClientWorkbench activeHref="/api-tester" />
      <ToolSeoContent
        path="/api-tester"
        summary="DataFormatter API Tester is a free online tool to build and send GET, POST, PUT and DELETE requests with headers, auth and JSON bodies directly from your browser — no proxy, no signup and no logging."
        faqs={faqs}
      >
        <Section title="What the API Tester does">
          <Bullets
            items={[
              "Build and send GET, POST, PUT and DELETE requests with headers, authentication and JSON bodies.",
              "Replay and iterate on requests while inspecting the raw response status, headers and body.",
              "Send directly to the endpoint — requests are not routed through any server-side proxy.",
              "Work with local, staging or public servers and see results immediately in the browser.",
            ]}
          />
        </Section>

        <Section title="When to use the API Tester">
          <UseCases
            cases={[
              {
                title: "Checking a new endpoint",
                body: "Send a request to a just-added route and confirm the status code and response body.",
              },
              {
                title: "Debugging auth flows",
                body: "Try different bearer tokens or headers and see exactly how the server responds.",
              },
              {
                title: "Frontend API work",
                body: "Verify the requests your frontend will make, including headers and payload shape.",
              },
            ]}
          />
        </Section>

        <Section title="Built-in privacy by design">
          <p>
            Requests are sent straight from your browser. Cross-origin endpoints only respond when
            they allow it via CORS — there is no server-side proxy, so nothing is ever forwarded or
            logged and your data stays on your machine.
          </p>
        </Section>
      </ToolSeoContent>
    </>
  );
}