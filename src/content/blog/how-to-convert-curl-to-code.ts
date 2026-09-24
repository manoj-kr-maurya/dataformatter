import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "how-to-convert-curl-to-code",
  title: "How to Convert cURL Commands to JavaScript, Python & Go",
  description:
    "Turning a curl command into fetch, axios, Python or Go code by hand is error-prone. Learn how to import a command mechanically — method, headers, body, auth — and get runnable client code in seconds.",
  h1: "How to Convert cURL Commands to JavaScript, Python & Go",
  category: "API Engineering",
  excerpt:
    "curl has a different spelling of the same request for every language you target. An importer reads the flags once and emits runnable fetch, axios, Python, Java or Go code — so you stop translating by hand.",
  geo: {
    what: "Converting curl to code means turning one command's flags (-X, -H, -d, -u, -F) into an HTTP client call in another language. A cURL importer parses the command into a request model and emits JavaScript, Python, Go and more from it.",
    who: "Developers who have a working curl command from a ticket, an API log or a tool like the API Client, and need the same request expressed in the language of their app.",
    different: "The cURL to Code tool tokenizes the full command — including -F multipart forms, --data-binary, cookies and basic auth — and generates equivalent code without a proxy or account.",
  },
  publishedAt: "2026-09-24",
  relatedToolPaths: ["/curl-to-code", "/api-tester", "/openapi"],
  relatedSlugs: ["how-to-test-an-api-without-postman", "what-makes-an-api-change-breaking"],
  blocks: [
    {
      type: "p",
      text: "Every client library spells the same HTTP request differently. A curl one-liner that sends a POST with one header and a JSON body becomes five different snippets depending on whether you're writing fetch, axios, Python requests, Go or C#. Converting by hand means keeping every -H, -d and --cookie straight — which is exactly where subtle bugs slip in.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "curl flag",
          definition: "The command-line switch that describes a request part: -X sets the method, -H a header, -d the body, -u basic auth, -F a multipart form field.",
        },
        {
          term: "URL-encoded body",
          definition: "A request body of key=value pairs joined by &, the format HTML forms and some APIs use instead of JSON.",
        },
        {
          term: "Multipart form (multipart/form-data)",
          definition: "An upload format that separates fields and files with boundaries — produced on the command line with -F 'field=@file'.",
        },
        {
          term: "Cookies",
          definition: "Small state tokens sent back to the server; in curl they're attached with --cookie or --Cookie, and in client code they must be re-sent on every relevant request.",
        },
      ],
    },
    {
      type: "h2",
      text: "What the importer has to read",
    },
    {
      type: "ul",
      items: [
        "The method — from an explicit -X POST or inferred from -d.",
        "Every header, including duplicate headers and quoted values with spaces.",
        "The body — raw JSON, URL-encoded pairs, binary data with --data-binary, or multipart uploads.",
        "Authentication — -u user:pass becomes basic-auth headers; --cookie attaches session state.",
        "The URL, with its query string intact.",
      ],
    },
    {
      type: "h2",
      text: "A command, tokenized",
    },
    {
      type: "example",
      inputLabel: "curl input",
      input: `curl -X POST 'https://api.example.com/orders?dryRun=true' \\
  -H 'Content-Type: application/json' \\
  -d '{"qty": 2}'`,
      outputLabel: "JavaScript (fetch) output",
      output: `const response = await fetch(
  "https://api.example.com/orders?dryRun=true",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"qty": 2}',
  }
);`,
    },
    {
      type: "h2",
      text: "When actually sending beats converting",
    },
    {
      type: "p",
      text: "If the goal is to check whether the request works at all, send it before you translate it. The API Tester accepts the request, runs it live and shows the status and body — so you verify behavior first and generate code from a request you already know is valid. Convert last, and only then does the importer's output become the code you ship.",
    },
    {
      type: "h2",
      text: "From one command to a whole documented API",
    },
    {
      type: "p",
      text: "A single curl command only describes one call. When the endpoint is part of a larger contract, the OpenAPI workbench generates code from every operation in the specification — paths, parameters, request and response schemas — so you're not pasting one command at a time.",
    },
    {
      type: "note",
      title: "Escaping is the most common translator bug",
      text: "Hand-converted code usually breaks on quoting: the body in PowerShell, the header in a shell string, the JSON in Python's triple quotes. Generate from the parsed request model and the escaping matches the target language's rules.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Does converting curl to code keep the exact same headers?",
          a: "Yes — every -H flag, cookie and auth flag is carried into the generated request so the translated call behaves identically to the command.",
        },
        {
          q: "What about a file upload like -F 'doc=@report.pdf'?",
          a: "The importer understands multipart -F fields and emits the target language's file-upload construct (FormData for fetch, files= for requests, multipart.Writer for Go).",
        },
        {
          q: "Why would my converted code fail when the original curl worked?",
          a: "curl happily ignores proxies and CORS, while browser code enforces them. If you generated fetch code, test the raw request first — the API Tester will surface a CORS block in one click.",
        },
        {
          q: "Is the conversion lossless?",
          a: "The request model captures method, URL, per-header headers, body and auth; any curl construct the parser can't faithfully model is surfaced as a warning rather than silently dropped.",
        },
      ],
    },
  ],
};

export default article;