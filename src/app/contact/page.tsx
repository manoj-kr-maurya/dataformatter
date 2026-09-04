import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { Section, Bullets, Faq, FaqJsonLd } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/contact");

const ISSUES_URL = "https://github.com/manoj-kr-maurya/dataformatter/issues";
const faqs = [
  {
    q: "How do I report a bug?",
    a: "Open a GitHub issue on the DataFormatter repository. Include the tool you used, your browser and OS, what you expected, and what happened instead. If the input data can be shared safely, attach the smallest snippet that reproduces it.",
  },
  {
    q: "Can I request a new tool or feature?",
    a: "Yes — feature requests are welcome as GitHub issues too. Describe the workflow you're trying to accomplish rather than just the feature; it makes it far easier to design the right tool for it.",
  },
] as const;

export default function ContactPage() {
  return (
    <ToolLandingPage
      path="/contact"
      summary="Found a bug or have a feature idea? Open an issue on GitHub — every report lands in front of the maintainer who builds the tools."
    >
      <Section title="Report an issue or request a feature">
        <p>
          Prefer public tracking? The issue tracker keeps every report searchable and lets you
          subscribe to progress on your own request:
        </p>
        <p>
          <a
            href={ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-violet-600 underline decoration-violet-300 underline-offset-4 hover:text-violet-700 dark:text-violet-400 dark:decoration-violet-500/60 dark:hover:text-violet-300"
          >
            Open the DataFormatter issue tracker →
          </a>
        </p>
        <p>
          Issues are kept searchable and let you subscribe to progress on your own request.
        </p>
      </Section>

      <Section title="What to include">
        <Bullets
          items={[
            "The exact tool (e.g. JSON Validator, Base64 Decoder) and the URL path.",
            "Browser and version, plus operating system.",
            "What you did, what you expected, and what actually happened.",
            "A minimal reproducible input if the bug is data-dependent — with secrets redacted.",
            "For feature requests: the workflow you want to speed up, not just the control you imagine.",
          ]}
        />
      </Section>

      <Section title="What happens next">
        <p>
          Issues are reviewed on a best-effort basis. Bugs that break a core workflow get priority;
          well-specified feature requests follow. When a fix ships you&apos;ll see it referenced in
          the issue, so watching your report is the easiest way to know when to hard-refresh.
        </p>
      </Section>

      <FaqJsonLd items={faqs} />
      <Section title="Frequently asked questions">
        <Faq items={faqs} />
      </Section>
    </ToolLandingPage>
  );
}
