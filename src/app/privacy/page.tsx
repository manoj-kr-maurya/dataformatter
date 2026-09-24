import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { Section, Bullets, Faq, FaqJsonLd } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/privacy");

const faqs = [
  {
    q: "Is DataFormatter really free of tracking?",
    a: "Yes. The site ships no analytics, no tracking pixels, no marketing scripts and no cookie banners — there is nothing to opt out of. Every tool's processing happens locally in your browser.",
  },
  {
    q: "Does DataFormatter store my pasted data?",
    a: "No. JSON, Base64, hashes, tokens and everything else you paste is processed in your browser on the spot and never transmitted, logged or stored on a DataFormatter server.",
  },
  {
    q: "Where does the API Client send requests?",
    a: "Requests you build in the API Client or API Tester are sent directly from your browser to the endpoint you specify. DataFormatter runs no proxy, so it never sees, forwards or logs those requests.",
  },
  {
    q: "What does the Contact page do with my message?",
    a: "It links you to the public issue tracker on GitHub. Composing a message there happens on GitHub's site and is subject to GitHub's own privacy policy — DataFormatter never receives it.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <ToolLandingPage
      path="/privacy"
      summary="DataFormatter is private by architecture, not by policy: every tool runs in your browser and nothing you paste is ever transmitted. This page states exactly what the site does and doesn't do with your data."
    >
      <Section title="In one sentence">
        <p>
          DataFormatter sends none of your data anywhere: processing is what your own browser does
          with the text you paste, and the network is never involved.
        </p>
      </Section>

      <Section title="What we collect">
        <Bullets
          items={[
            "Nothing you paste, type, encode, decode or hash — every tool computes locally.",
            "No personal data: there are no accounts, no sign-ups, no forms that reach us, and nothing to identify a visitor.",
            "No analytics, no telemetry and no logging of page behavior or content.",
          ]}
        />
      </Section>

      <Section title="Where your data goes">
        <Bullets
          items={[
            "Your input stays on your device for the full lifetime of the visit.",
            "The only intentional network calls are the ones you make yourself: requests built in the API Client and API Tester go directly to the endpoint you specify — DataFormatter has no proxy and never sees them.",
            "Clicking Contact takes you to the public issue tracker on GitHub, a separate site governed by GitHub's privacy policy.",
          ]}
        />
      </Section>

      <Section title="Stored in your browser">
        <p>
          To keep the experience fast, the site may store small preference values — like the last
          timezone you chose or whether the tool rail is collapsed — in your browser&apos;s{" "}
          <code>localStorage</code>. A transient hand-off value also lives in{" "}
          <code>sessionStorage</code> when you jump from a landing page into the full workspace.
          Both stay on your device, are never read by the site&apos;s servers, and disappear when
          you clear site data.
        </p>
      </Section>

      <Section title="Cookies and tracking">
        <Bullets
          items={[
            "No cookies of any kind — not even analytics or consent cookies.",
            "No third-party scripts that read your input or screen.",
            "No data selling, sharing or re-use, now or ever — because no data ever leaves your machine to be sold.",
          ]}
        />
      </Section>

      <Section title="Changes to this policy">
        <p>
          Any future change to how the site handles data will be reflected in this page and in the
          content-dated changelog above. Because the architecture is local-first, a future change
          would mean a new tool feature, not a new way of handling your pasted data.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Anything unclear? Get in touch via the Contact page — reports go straight to the
          maintainer who builds the tools, so you can ask about a specific feature&apos;s behavior
          and get a direct answer.
        </p>
      </Section>

      <FaqJsonLd items={faqs} />
      <Section title="Frequently asked questions">
        <Faq items={faqs} />
      </Section>
    </ToolLandingPage>
  );
}