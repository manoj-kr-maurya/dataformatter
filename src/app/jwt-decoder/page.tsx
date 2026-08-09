import type { Metadata } from "next";
import { ContentPage } from "@/components/seo/content-page";
import { Section, Bullets, Faq, Cta } from "@/components/seo/content-blocks";

export const metadata: Metadata = {
  title: "JWT Decoder — Decode JWT Header & Payload Online",
  description:
    "Free online JWT decoder. Decode the header and payload of any JWT token instantly — with or without a Bearer prefix. No signature verification. 100% private, in your browser.",
  alternates: { canonical: "/jwt-decoder" },
};

const faqs = [
  {
    q: "What does a JWT decoder show?",
    a: "A JWT is three base64url segments: header, payload, and signature. The decoder shows the decoded header (says the algorithm such as HS256) and payload (the claims, like sub, name, and exp) as readable JSON.",
  },
  {
    q: "Does this decoder verify token signatures?",
    a: "No. Like diagnostic JWT tools, it decodes the header and payload for inspection but does not verify the signature. Never trust the claims of an unverified token.",
  },
  {
    q: "Is it safe to paste a JWT here?",
    a: "Yes from a privacy standpoint — decoding happens locally in your browser and nothing is uploaded. Still avoid pasting live production tokens containing sensitive claims.",
  },
];

export default function JwtDecoderPage() {
  return (
    <ContentPage
      pageTitle="JWT Decoder"
      summary="Decode a JWT token's header and payload online, free and instantly. Paste a token — with or without a Bearer prefix — and read its claims as formatted JSON. No signature verification. All processing is local."
    >
      <Section title="How JWT decoding works">
        <p>
          A JSON Web Token (JWT) is composed of three base64url parts joined by dots:
          <code> header.payload.signature</code>. The <strong>header</strong> describes the signing
          algorithm (for example <code>HS256</code>), and the <strong>payload</strong> holds the
          claims — the identity and attributes of the token (such as <code>sub</code>,{" "}
          <code>name</code>, <code>iat</code>, and <code>exp</code>).
        </p>
        <p>
          This decoder reads those base64url segments, decodes them as UTF-8 JSON, and renders the
          header and payload as pretty-printed JSON so you can inspect a token quickly. The signature
          segment is surfaced as-is; it is never decoded to text and no verification is performed.
        </p>
      </Section>

      <Section title="How to decode a JWT online">
        <Bullets
          items={[
            "Open the free JWT Decoder tool from DataFormatter.",
            "Paste the token — with or without a 'Bearer ' prefix.",
            "The header and payload appear as formatted JSON sections.",
            "Tokens embedded inside surrounding text are detected automatically.",
          ]}
        />
      </Section>

      <Section title="Ways to use this decoder">
        <Bullets
          items={[
            "Debugging access tokens returned by authentication APIs",
            "Inspecting the claims of ID tokens during OAuth setup",
            "Understanding what information an application can read from a token",
            "Learning the structure of JWTs and JSON Web Algorithms",
          ]}
        />
      </Section>

      <Faq items={faqs} />

      <Cta label="Open the free JWT Decoder tool" href="/" />
    </ContentPage>
  );
}