import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "how-to-debug-a-json-api-response",
  title: "How to Debug a JSON API Response",
  description:
    "When an API returns broken JSON, guesswork wastes time. Learn the inspection order — status, headers, body, validation — and use the right local tool at each step to find the real fault fast.",
  h1: "How to Debug a JSON API Response",
  category: "Debugging",
  excerpt:
    "A response that won't parse usually has one of a handful of causes. Read it in order: status, headers, body text, then validation — each step narrows the bug before your editor does anything.",
  geo: {
    what: "Debugging a JSON API response is systematically inspecting what the server actually returned: the status code, the Content-Type header, the raw body text, and then whether that body parses as valid JSON — rather than assuming the client code is at fault.",
    who: "Developers chasing malformed payloads, unexpected nulls or unparseable bodies from endpoints they may not control, who want a repeatable inspection order instead of console.log guesses.",
    different: "An in-browser API tester shows the raw response, a validator reports the exact line and column of any JSON syntax error, and a formatter renders the payload readably — all locally, with the actual response text in view.",
  },
  publishedAt: "2026-09-24",
  relatedToolPaths: ["/api-tester", "/json-formatter", "/json-validator"],
  relatedSlugs: ["unexpected-token-in-json", "how-to-test-an-api-without-postman"],
  blocks: [
    {
      type: "p",
      text: "A JSON API response that 'doesn't work' usually produces a vague symptom — a parse error, a null where an object should be, a blank screen. The instinct is to open the parser or the client code, but the fault is almost always in one of four places, and they have a natural inspection order: status, headers, body text, then validation. Walk them in that sequence and the bug names itself.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "Content-Type",
          definition: "The header that declares what a body is: application/json means parse it; text/html means you got a page, not data.",
        },
        {
          term: "Payload",
          definition: "The actual body bytes of the response — the JSON text before it has been parsed into an object.",
        },
        {
          term: "Syntax error",
          definition: "A byte-level problem in the payload (trailing comma, missing quote) that makes the text unparseable as JSON.",
        },
        {
          term: "Schema mismatch",
          definition: "Payload parses fine but has fields in different shapes than the client expects — a quiet, common bug that parsing never catches.",
        },
      ],
    },
    {
      type: "h2",
      text: "Step 1 — the status code",
    },
    {
      type: "ul",
      items: [
        "2xx — the request worked; the body is data (or unexpectedly empty).",
        "4xx — the server rejected your request, and the body is usually an error object like { \"error\": \"...\" } — still JSON.",
        "5xx — the server failed, and the body may be an HTML error page instead of JSON. That's not a JSON bug at all.",
      ],
    },
    {
      type: "h2",
      text: "Step 2 — the headers",
    },
    {
      type: "p",
      text: "Check Content-Type before touching the body. application/json means parse it. text/html or empty means whatever is in the body is not JSON — an error page, a redirect frame, a login wall — and no validator will ever fix that. The API tester keeps status and headers side by side so this step is a glance.",
    },
    {
      type: "h2",
      text: "Step 3 — the raw body",
    },
    {
      type: "p",
      text: "Read the body as text first. If it starts with <html>, stop: you're debugging a document, not data. If it's truncated, the connection or the server cut the body short. If it's a single long line of minified JSON, that's expected — just don't try to eyeball it.",
    },
    {
      type: "h2",
      text: "Step 4 — validate before you format",
    },
    {
      type: "p",
      text: "Only after the body is genuinely JSON do syntax problems matter. The validator reports the exact line and column of any error, so a trailing comma or an HTML fragment buried mid-payload gets pointed out directly instead of surfacing as a vague client-side parse exception. Then the formatter renders the valid payload readably, and a diff compares it against what you expected.",
    },
    {
      type: "example",
      inputLabel: "Broken payload",
      input: `{
  "order": { "id": 42, "total": 9.99, } 
}`,
      outputLabel: "Validator's answer",
      output: `Invalid JSON — Line 2, Column 39: Expected double-quoted property name in JSON at position 40 (line 2 column 39)`,
    },
    {
      type: "note",
      title: "Parsing success is not a correct response",
      text: "The worst bug is often invisible: the body parses fine but has nulls and defaults because the schema had optional fields. Compare the parsed structure against the documented shape — schema evaluation for real payloads is a separate, earlier line of defense.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Why do I get JSON.parse errors on a 200 response?",
          a: "200 only means the HTTP exchange worked. A proxy error page, an HTML login redirect or an empty body can all arrive with a 200 — check Content-Type before parsing.",
        },
        {
          q: "What does an empty body mean?",
          a: "Some endpoints return 204 with no body (fine), others return 200 with a genuinely empty body (a server bug). Both are straightforward once you read status and headers first.",
        },
        {
          q: "How do I find the exact character that breaks parsing?",
          a: "Paste the raw text into the JSON Validator — it reports line and column, so you jump straight to the culprit instead of scanning a minified blob.",
        },
        {
          q: "Is a large minified response a problem?",
          a: "No — minification is the normal transport form. Format it locally to read it, and re-minify only if you need to reproduce the exact wire bytes.",
        },
      ],
    },
  ],
};

export default article;