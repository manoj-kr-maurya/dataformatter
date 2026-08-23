import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import {
  Section,
  Bullets,
  Faq,
  FaqJsonLd,
  Example,
  QuickStart,
  UseCases,
  Troubleshooting,
  Glossary,
  ProTips,
} from "@/components/seo/content-blocks";
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
  {
    q: "Why does my token say 'Invalid' or fail to decode?",
    a: "Most failures are truncated tokens (a dot or final segment lost during copying), URL-encoded characters inside the token, or text that isn't a JWT at all. Re-copy the complete three-part token and retry.",
  },
  {
    q: "What do the exp and iat claims mean?",
    a: "They are Unix timestamps: iat is when the token was issued, exp is when it expires. Convert them with any epoch converter to see the times in your timezone.",
  },
  {
    q: "Can I decode a token without the signature part?",
    a: "Often yes — some tools accept header.payload only. This decoder follows the standard three-segment format; if you only have two segments, try appending a placeholder third segment separated by a dot.",
  },
] as const;

export default function JwtDecoderPage() {
  return (
    <ToolLandingPage
      path="/jwt-decoder"
      summary="Decode a JWT token's header and payload online, free and instantly. Paste a token — with or without a Bearer prefix — into the live tool below and read its claims as formatted JSON. No signature verification."
    >
      <EmbeddedWorkspace mode="JWT_DECODE" label="JWT decoder editor" />
      <QuickStart
        steps={[
          "Paste the token above — a leading 'Bearer ' is stripped automatically.",
          "Header and payload appear as formatted JSON sections.",
          "Copy individual claims straight from the output for your bug report.",
        ]}
      />
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

      <Section title="Debugging auth flows with decoded tokens">
        <UseCases
          cases={[
            {
              title: "Checking what an API issued you",
              body: "Paste an access token to see its scopes, roles and expiry before blaming your request headers for that mysterious 403.",
            },
            {
              title: "OAuth / OpenID Connect setup",
              body: "Inspect ID tokens during client configuration to confirm issuer, audience and claim mapping match what your code expects.",
            },
            {
              title: "Security reviews",
              body: "Understand exactly which attributes applications can read from a token — and confirm nothing sensitive is riding along in the payload.",
            },
          ]}
        />
      </Section>

      <Section title="Common JWT decoding errors">
        <Troubleshooting
          items={[
            {
              error: "Unexpected token or malformed JSON after decoding",
              cause: "The token was truncated during copy-paste — most often the final signature segment or the last character of the payload.",
              fix: "Re-copy the entire three-part token from its source and make sure no line breaks were inserted.",
            },
            {
              error: "Decoded payload shows %22 or %7B sequences",
              cause: "The token passed through URL-encoding somewhere in transit (logs and query strings often do this).",
              fix: "Decode once with the URL Decoder first, then paste the clean token here.",
            },
            {
              error: "Signature says 'invalid' in my backend but decodes fine here",
              cause: "That's expected: decoding always succeeds because the payload is plain base64url, not encrypted. Signature verification requires the secret or public key server-side.",
              fix: "Check key choice (HS vs RS family), issuer and audience values in your verification library instead.",
            },
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

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Need the raw segments separately? The Base64 Decoder handles base64url directly for one-off segment inspection.",
            "Verify checksums of signed artifacts with the Hash Generator while you're debugging auth integrations.",
            "Split view keeps the original token and decoded claims on screen together — ideal when writing up findings.",
            "Download the decoded claims to attach structured evidence to security tickets.",
          ]}
        />
      </Section>

      <Section title="JWT glossary">
        <Glossary
          terms={[
            {
              term: "Claim",
              definition:
                "A named piece of information inside a JWT payload, such as sub (subject), iss (issuer) or exp (expiry). Claims are statements about the user or token — but they are only trustworthy after the signature has been verified.",
            },
            {
              term: "base64url",
              definition:
                "The URL-safe Base64 variant JWTs use: - replaces + and _ replaces /. It lets tokens travel inside HTTP headers and query strings without extra escaping.",
            },
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
