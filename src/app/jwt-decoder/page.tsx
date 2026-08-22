import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import { Section, Bullets, Faq, FaqJsonLd, Example } from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/jwt-decoder");

const faqs = [
  {
    q: "What does a JWT decoder show?",
    a: "A JWT is three base64url segments: header, payload, and signature. The decoder shows the decoded header (says the algorithm such as HS256) and payload (the claims, like sub, name, and exp) as readable JSON.",
  },
  {
    q: "Does this decoder verify token signatures?",
    a: "No. Like diagnostic JWT tools, it decodes the header and payload for inspection but does not verify the signature. Decoding is not verification — never trust the claims of an unverified token.",
  },
  {
    q: "Is it safe to paste a JWT here?",
    a: "Yes from a privacy standpoint — decoding happens locally in your browser and nothing is uploaded. Still avoid pasting live production tokens containing sensitive claims.",
  },
] as const;

export default function JwtDecoderPage() {
  return (
    <ToolLandingPage
      path="/jwt-decoder"
      summary="Decode a JWT token's header and payload online, free and instantly. Paste a token — with or without a Bearer prefix — into the live tool below and read its claims as formatted JSON. No signature verification."
    >
      <EmbeddedWorkspace mode="JWT_DECODE" label="JWT decoder editor" />
      <FaqJsonLd items={faqs} />

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
          header and payload as pretty-printed JSON so you can inspect a token quickly. The
          signature segment is surfaced as-is; it is never decoded to text and{" "}
          <strong>no cryptographic verification is performed</strong>.
        </p>
        <Example
          input="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJKb2huIn0.signature"
          output={`{
  "alg": "HS256"
}
---
{
  "sub": "12345",
  "name": "John"
}`}
          inputLabel="Token"
          outputLabel="Decoded header & payload"
        />
      </Section>

      <Section title="How to decode a JWT online">
        <Bullets
          items={[
            "Paste the token — with or without a 'Bearer ' prefix — into the editor above.",
            "The header and payload appear as formatted JSON sections.",
            "Tokens embedded inside surrounding text are detected automatically.",
            "Copy or download the decoded claims for your bug report.",
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

      <Section title="Decoding vs verifying">
        <p>
          Anyone can decode a JWT — the payload is merely encoded, not encrypted. Verifying a
          token requires its secret or public key so the signature can be checked server-side.
          Use this tool to inspect tokens during development; always verify signatures in your
          application before trusting any claim.
        </p>
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
