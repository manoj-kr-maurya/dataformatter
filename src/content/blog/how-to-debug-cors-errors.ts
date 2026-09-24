import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "how-to-debug-cors-errors",
  title: "How to Debug CORS Errors in Your Browser",
  description:
    "CORS errors block perfectly good requests when the server omits an allow-origin header. Learn what the browser actually checks, how to read the failure message, and how to prove a fix with an in-browser API tester.",
  h1: "How to Debug CORS Errors in Your Browser",
  category: "Debugging",
  excerpt:
    "'Blocked by CORS policy' looks like your request failed — but it was probably fine. Learn what the browser checks before code runs, how to read the error, and how to confirm a fix without guessing.",
  geo: {
    what: "CORS (Cross-Origin Resource Sharing) is the browser's rule that a page at one origin may only call a server at another if that server answers with the right Access-Control-Allow-Origin header. When the header is missing or wrong, the browser blocks the response — even though the server handled the request.",
    who: "Frontend developers whose fetch or client-side code mysteriously fails against an API, and who need to distinguish a CORS block (a browser policy) from a genuine server or network error.",
    different: "A browser-based API tester sends requests like the browser does, exposes the exact response headers the server returned, and pairs with a header inspector to show why an allow-origin decision was rejected.",
  },
  publishedAt: "2026-09-24",
  relatedToolPaths: ["/api-tester", "/http-header-inspector", "/har"],
  relatedSlugs: ["how-to-test-an-api-without-postman", "http-headers-developers-should-know"],
  blocks: [
    {
      type: "p",
      text: "A CORS error is the most misleading failure in web development: your request reached the server, the server answered, and your code still gets 'Blocked by CORS policy'. Nothing is wrong with the network or the endpoint — the browser refused to hand the response to your page because the server didn't opt in. Debugging CORS is about reading the headers, and the tools that show them plainly make it a two-minute fix.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "Origin",
          definition: "The scheme + host + port of a page — https://app.example.com and https://api.example.com are different origins even though they share a host name.",
        },
        {
          term: "Access-Control-Allow-Origin",
          definition: "A response header naming which origins may read the response; a missing or mismatched value is the cause of most CORS errors.",
        },
        {
          term: "Preflight",
          definition: "An automatic OPTIONS request the browser sends before a 'non-simple' request (custom headers, JSON bodies) to ask permission in advance.",
        },
        {
          term: "Same-origin policy",
          definition: "The browser rule that pages may only read responses from their own origin, unless CORS headers lift the restriction.",
        },
      ],
    },
    {
      type: "h2",
      text: "The browser made the request — and hid the response",
    },
    {
      type: "p",
      text: "When you see 'blocked by CORS policy', fire the same request in an API tester that doesn't enforce CORS: you'll see the response return with a 200 and a body. That contrast is the key insight — the endpoint works; the browser just isn't allowed to expose the result to your page. If the server returns a 5xx, that's a different bug entirely.",
    },
    {
      type: "h2",
      text: "Reading the error message",
    },
    {
      type: "ul",
      items: [
        "No 'Access-Control-Allow-Origin' header — the server returned the resource but never said who may read it; add the header server-side.",
        "Not allowed by Access-Control-Allow-Origin — the header exists but names a different origin than your page; align them.",
        "Preflight request failed — the OPTIONS request was rejected (often a 401 or 405) before your real request ran; the server must permit OPTIONS for the path.",
        "Request header field x-custom is not allowed — a custom header wasn't echoed in Access-Control-Allow-Headers.",
      ],
    },
    {
      type: "h2",
      text: "Checking what the server actually sent",
    },
    {
      type: "p",
      text: "The HTTP Header Inspector turns an endpoint's response into a readable report: which headers exist, whether an Access-Control-Allow-Origin is present, what value it has versus the origin you're calling from, and how CORS pairs with tools like a HAR export that captured the real exchange.",
    },
    {
      type: "h2",
      text: "The fix checklist",
    },
    {
      type: "ol",
      items: [
        "Confirm the response has Access-Control-Allow-Origin — if not, the server needs config, not your code.",
        "Check the value matches your exact origin, scheme included (https vs http).",
        "For custom headers, verify they're listed in Access-Control-Allow-Headers.",
        "Verify OPTIONS preflight isn't blocked by auth middleware.",
        "Retest from an in-browser API tester — if it succeeds there, the API is fine and the config fix is complete.",
      ],
    },
    {
      type: "note",
      title: "Don't fix CORS by disabling it",
      text: "Browser extensions that 'disable CORS' mask the server's missing configuration and teach nothing about what production users will hit. Fix the headers; then the browser enforces a correct allow-list that real users depend on.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Why does my cURL request work when the browser fails?",
          a: "curl doesn't enforce CORS — it sends the request and prints whatever comes back. The browser additionally checks the allow-origin header, which is why the same call appears to 'fail' only in a page.",
        },
        {
          q: "Is CORS a security feature?",
          a: "It protects your users' data from being read by other websites that they happen to visit. The server decides delegation with Allow-Origin, and the browser enforces the decision.",
        },
        {
          q: "Do I need anything for same-origin requests?",
          a: "No — same-origin calls bypass CORS checks entirely. The header only matters when your page's origin and the API's origin differ.",
        },
        {
          q: "What if my API is still blocked even with the header set?",
          a: "Check the header value byte-for-byte (no trailing slash, correct scheme) and whether a proxy or CDN stripped it. The header inspector surfaces both in the reported values.",
        },
      ],
    },
  ],
};

export default article;