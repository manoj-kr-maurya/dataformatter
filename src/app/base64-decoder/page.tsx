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

export const metadata: Metadata = buildMetadata("/base64-decoder");

const faqs = [
  {
    q: "Why won't my Base64 string decode?",
    a: "Decoding requires valid Base64 characters (A–Z, a–z, 0–9, +, /) with correct padding. Invalid characters, missing padding, or data that is not valid UTF-8 text will produce an error rather than garbage output.",
  },
  {
    q: "Can it decode Base64 that contains JSON?",
    a: "Yes. If the decoded bytes are valid JSON, the tool pretty-prints it automatically so you can read the structure instantly.",
  },
  {
    q: "Does Base64 decoding work on private or sensitive data?",
    a: "Yes — everything is decoded locally in your browser. Nothing you paste is uploaded, so it is safe for sensitive payloads.",
  },
  {
    q: "What about base64url (with - and _ instead of + and /)?",
    a: "JWTs and URL-safe variants swap the last two alphabet characters. This decoder accepts both spellings, so tokens and URL-safe strings decode without manual character replacement.",
  },
  {
    q: "Why does my decoded output end with strange characters?",
    a: "The bytes probably weren't UTF-8 text to begin with — for example an encoded image or a file. Text decoders can only show text; use the Base64 Tools hub for binary formats like images.",
  },
] as const;

export default function Base64DecoderPage() {
  return (
    <ToolLandingPage
      path="/base64-decoder"
      summary="Decode Base64 back to plain text or JSON online, free and instantly. Paste a Base64 string into the live tool below and it converts back to readable text in your browser — never uploading your data."
    >
      <EmbeddedWorkspace mode="BASE64_DECODE" label="Base64 decoder editor" />
      <QuickStart
        steps={[
          "Paste the Base64 string above — line breaks are handled automatically.",
          "The decoded text appears instantly; embedded JSON is pretty-printed.",
          "Copy the result or download it as a file.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="How Base64 decoding works">
        <p>
          Decoding reverses the Base64 process: the tool validates the 64-character alphabet,
          restores padding when it is missing, converts the characters back to raw bytes, and then
          decodes those bytes as UTF-8 text.
        </p>
        <p>
          If the resulting text is valid JSON, DataFormatter detects it and pretty-prints it
          automatically — handy when you receive Base64-wrapped API payloads or configuration and
          want to read them immediately.
        </p>
        <Example
          input="SGVsbG8sIERhdGFGb3JtYXR0ZXIh"
          output="Hello, DataFormatter!"
          inputLabel="Base64 input"
          outputLabel="Decoded text"
        />
      </Section>

      <Section title="How to decode Base64 online">
        <Bullets
          items={[
            "Paste the Base64 string you received from an API, header, or config into the editor above.",
            "The decoded text appears instantly, pretty-printed if it is JSON.",
            "Whitespace and line breaks inside the Base64 are handled automatically.",
            "Copy the result or download it as a file.",
          ]}
        />
      </Section>

      <Section title="When you'll need a Base64 decoder">
        <UseCases
          cases={[
            {
              title: "Inspecting wrapped API payloads",
              body: "Gateways love wrapping request bodies in Base64. Decode here to read what actually went over the wire — with JSON auto-formatted.",
            },
            {
              title: "Debugging auth headers & JWT parts",
              body: "Basic auth credentials and JWT segments are just base64url text. Paste a segment to read it, or take a whole token to the JWT Decoder.",
            },
            {
              title: "Recovering values from configs",
              body: "Environment variables often hide Base64 blobs — secrets, connection strings, feature payloads. Read them safely without shell gymnastics.",
            },
          ]}
        />
      </Section>

      <Section title="Decoding errors explained">
        <Troubleshooting
          items={[
            {
              error: "Invalid Base64 character",
              cause: "The input contains characters outside the alphabet — often a copied label, quotes around the value, or URL-encoded %3D where = should be.",
              fix: "Strip surrounding quotes and labels; if you see %XX sequences, run the string through the URL Decoder first.",
            },
            {
              error: "Decodes but shows replacement characters (�)",
              cause: "The underlying bytes aren't UTF-8 — the data was likely binary (an image) or encoded from another character set.",
              fix: "Treat it as binary via the Base64 Tools hub rather than forcing it through a text decoder.",
            },
            {
              error: "Nothing happens when I paste",
              cause: "Auto Detect didn't recognise the shape of the input as Base64-like (for example, plain English words also match the alphabet).",
              fix: "Pick Base64 Decode explicitly from the tool menu so the decoder runs regardless of detection heuristics.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Decoding a JWT payload? The dedicated JWT Decoder splits header and payload for you and tolerates the Bearer prefix.",
            "If decoded output is JSON, Split view shows raw bytes-in/text-out on one screen while you compare sources.",
            "Use Restore Original after experimenting to get back the exact encoded string you started with.",
            "Long single-line strings? Toggle word wrap so you can eyeball the entire value without scrolling sideways.",
          ]}
        />
      </Section>

      <Section title="Decoder glossary">
        <Glossary
          terms={[
            {
              term: "base64url",
              definition:
                "A URL-safe variant of Base64 that replaces + with - and / with _, used by JWTs and web-safe identifiers. It omits padding more often than not, which tolerant decoders restore automatically before decoding.",
            },
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}
