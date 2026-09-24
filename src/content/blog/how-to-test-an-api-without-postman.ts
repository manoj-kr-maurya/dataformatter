import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "how-to-test-an-api-without-postman",
  title: "How to Test an API Without Postman",
  description:
    "Test an API straight from the browser without Postman: point a request builder at the endpoint, add headers and a body, read the status and response, and turn the exchange into curl or code — all locally, with nothing uploaded.",
  h1: "How to Test an API Without Postman",
  category: "API Engineering",
  excerpt:
    "You don't need a heavyweight client to test an API. Build a request in-browser, inspect the response, import an existing curl command, and generate code — all locally, with zero installation.",
  geo: {
    what: "Postman is a desktop client for building and sending HTTP requests. The browser can do the same job with a request builder (API Tester) and a request-builder page (API Client): method, URL, headers, body, live send, response view, all rendered locally.",
    who: "Developers who need to probe an endpoint quickly, reproduce a bug report or demonstrate a call, and who would rather not install, log into or share request history with a third-party app.",
    different: "DataFormatter's API Tester and API Client run requests straight from your browser to the endpoint you type — no proxy server, no account, and nothing you send or receive is uploaded anywhere.",
  },
  publishedAt: "2026-09-24",
  relatedToolPaths: ["/api-tester", "/api-client", "/curl-to-code"],
  relatedSlugs: ["how-to-decode-a-jwt", "unexpected-token-in-json"],
  blocks: [
    {
      type: "p",
      text: "Postman is the default answer for 'how do I hit this endpoint?', but it is a desktop install you have to keep updated, sign into, and whose request history lives outside your machine. For most day-to-day probing — reproduce a failing call, check response headers, inspect a JSON body — the browser already has everything you need, and the request never leaves your computer.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "HTTP request",
          definition: "The message a client sends to a server: a method (GET, POST, PUT...), a URL, headers and an optional body.",
        },
        {
          term: "Status code",
          definition: "The three-digit result a server returns (200 OK, 404, 500...) — the first signal of whether a call succeeded.",
        },
        {
          term: "Response headers",
          definition: "Metadata the server sends back with the body: content type, caching, CORS origins, security headers.",
        },
        {
          term: "cURL",
          definition: "A command-line tool for transferring data over HTTP, and the standard interchangeable way to describe a request in one line.",
        },
      ],
    },
    {
      type: "h2",
      text: "The request you need to reproduce",
    },
    {
      type: "p",
      text: "Every hand-written test starts the same way: method, URL, headers, body. A bug report usually contains all four — 'POST https://api.example.com/orders returned 422', often with a curl command or a HAR export attached.",
    },
    {
      type: "ol",
      items: [
        "Pick the method and enter the URL in the API Tester.",
        "Add the headers the endpoint expects — Content-Type and any Authorization token.",
        "Paste the request body from the report.",
        "Send it and read the status plus the raw response body.",
      ],
    },
    {
      type: "h2",
      text: "Turn the report's curl command into a test instantly",
    },
    {
      type: "p",
      text: "When a report includes raw curl, don't transcribe it by hand. The cURL to Code importer reads the flags — -X, -H, -d, --data, -F, --user — and rebuilds the exact request, which the API Tester can then send live. That turns 'someone else's inscrutable one-liner' into a visible, editable, replayable request.",
    },
    {
      type: "h2",
      text: "Reading the response properly",
    },
    {
      type: "ul",
      items: [
        "Status first — 4xx means the client sent something wrong; 5xx means the server failed; 2xx means receipt.",
        "Headers next — the Content-Type tells you how to read the body, and CORS headers explain why your browser blocked a cross-origin call.",
        "Body last — pretty-parse JSON in the JSON Formatter and validate it before quoting it in a bug report.",
      ],
    },
    {
      type: "note",
      title: "Tokens never leave your machine",
      text: "Requests you send from these tools go directly from your browser tab to the endpoint, with no proxy in between. That means Authorization headers stay between you and the API — but it also means CORS rules apply, so a request that works on a server may be blocked by the browser.",
    },
    {
      type: "h2",
      text: "From test to code",
    },
    {
      type: "p",
      text: "Once a call works, the same request becomes the skeleton of your integration: fetch, axios, Python, Java or Go snippets can be generated from the exchange, keeping the method, headers and body identical to what you verified. An OpenAPI workbench extends this to the whole documented contract.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Can I test a GET request with a query string in the browser?",
          a: "Yes — the API Tester accepts the full URL including ?key=value, and the URL parser can inspect how each parameter is decoded.",
        },
        {
          q: "What if the endpoint requires an Authorization header?",
          a: "Add the header manually. Tools decode JWTs locally so you can inspect what a token claims before sending it, and tokens are never uploaded.",
        },
        {
          q: "Why does my request work in cURL but fail in the browser?",
          a: "Almost always CORS: browsers enforce the Access-Control-Allow-Origin check that curl ignores. The response headers panel shows exactly what the server allowed.",
        },
        {
          q: "Is a browser-based tester as complete as Postman?",
          a: "For inspecting an endpoint, debugging one call and generating code, yes. For saved collections, scheduled runs and team sharing you'd still want a dedicated product.",
        },
      ],
    },
  ],
};

export default article;