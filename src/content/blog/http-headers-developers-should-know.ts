import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "http-headers-developers-should-know",
  title: "HTTP Headers Every Developer Should Know",
  description:
    "Security, caching, CORS, session and content headers every developer should recognize: HSTS, CSP, nosniff, Cache-Control, ETag and the cross-header gotchas — as a real inspector flags them.",
  h1: "HTTP Headers Every Developer Should Know",
  category: "Debugging",
  excerpt:
    "A response headers block is a diagnosis in plain text: caching freshness, CORS policy, session protections and security posture. Knowing the handful that matter turns an opaque wall into a readable story.",
  geo: {
    what: "HTTP response headers carry the metadata that governs caching, CORS, sessions and security (Cache-Control, ETag, Set-Cookie, HSTS, CSP), and knowing how to read them is core debugging skill.",
    who: "Developers reviewing production responses, debugging redirects, CORS failures or caching surprises, and auditing security headers.",
    different: "The HTTP Header Inspector categorizes a pasted header block (content, caching, CORS, session, security), flags real issues like insecure cookies or wildcard-CORS-with-credentials, and runs locally so real responses are safe to paste.",
  },
  publishedAt: "2026-08-26",
  relatedToolPaths: ["/http-header-inspector", "/har", "/curl-to-code", "/api-tester"],
  relatedSlugs: ["how-to-read-a-stack-trace", "what-makes-an-api-change-breaking"],
  blocks: [
    {
      type: "p",
      text: "Headers are name: value pairs, one per line, sent with requests and responses. Five groups carry most of what you need day to day: security, caching, CORS, sessions and content. The Inspector reads the block, assigns each header to a category, and attaches a tone — ok, warn, info or error — so the important lines stand out.",
    },
    {
      type: "h2",
      text: "How the block is parsed",
    },
    {
      type: "p",
      text: "Each non-empty line is split at its first colon: the left half is the header name, the right half the value. Response lines appear as they come from the server, so you can paste a block straight out of a browser's network panel. Metrics and values are converted to human-readable forms where it helps — Content-Length becomes '1,234 bytes', max-age becomes '1h 30m'.",
    },
    {
      type: "h2",
      text: "Security headers",
    },
    {
      type: "ul",
      items: [
        "Strict-Transport-Security — 'HSTS pinned' with its max-age (and whether includeSubDomains is set); tells browsers to force HTTPS.",
        "Content-Security-Policy — a source list of what the page may load; review the origins you trust.",
        "X-Content-Type-Options: nosniff — disables MIME sniffing; anything else is only informational.",
        "X-Frame-Options: DENY — blocks framing; CSP frame-ancestors is the modern replacement.",
        "Referrer-Policy and Permissions-Policy — control what is leaked on navigation and what APIs the page may use.",
        "X-XSS-Protection — deprecated and ignored by modern browsers; seeing it is a sign of an old config.",
      ],
    },
    {
      type: "h2",
      text: "Caching headers",
    },
    {
      type: "p",
      text: "Cache-Control drives freshness with directives like no-store, no-cache and max-age=N seconds. When none of those are present the Inspector notes that caches may apply heuristic expiry — an important gap for APIs that must control freshness. ETag is the revalidation validator: quotes mean a strong ETag, a W/ prefix means a weak one, and browsers send it back as If-None-Match. Expires is the old HTTP-date freshness marker that Cache-Control supersedes when both appear.",
    },
    {
      type: "code",
      label: "A well-formed caching policy",
      code: `Cache-Control: public, max-age=3600
ETag: "33a64df5"`,
    },
    {
      type: "h2",
      text: "CORS headers",
    },
    {
      type: "p",
      text: "Access-Control-Allow-Origin tells the browser which origin may read a response. A wildcard (*) works only without credentials — combine it with Access-Control-Allow-Credentials: true and browsers refuse the CORS exchange entirely, which the Inspector flags as an error. Access-Control-Max-Age says how long a preflight may be cached.",
    },
    {
      type: "h2",
      text: "Session and credential headers",
    },
    {
      type: "p",
      text: "Set-Cookie is checked for the two flags that matter most: Secure (transport only) and HttpOnly (invisible to JavaScript). Missing either produces a warning, and the header is never shown in full — cookie values stay masked. Authorization is treated as a secret outright: the Inspector flags it as an error and reminds you never to log or share raw headers.",
    },
    {
      type: "h2",
      text: "Content and encoding headers",
    },
    {
      type: "p",
      text: "Content-Type names the body's media type; Content-Length and Content-Encoding (gzip, br, deflate, zstd) describe size and compression; Transfer-Encoding signals chunked, streamed bodies. A body sent with both Content-Length and Transfer-Encoding is a red flag — a real length is undefined in that combination.",
    },
    {
      type: "h2",
      text: "Headers that are mostly noise",
    },
    {
      type: "p",
      text: "Accept-*, Host, User-Agent, Connection and sec-fetch-* appear constantly but rarely matter for diagnosis; the Inspector collects them into a separate unknown/request list so the findings stay focused. Server introspection headers are flagged when they expose framework or version fingerprints.",
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Copy a response's raw headers into the HTTP Header Inspector for categorized, commented findings. For full request/response pairs, capture a HAR and drop it into the HAR Debugger instead.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Why is X-XSS-Protection flagged as informational?",
          a: "It is deprecated and ignored by modern browsers, so its presence is a clue about config age rather than a protection you can rely on.",
        },
        {
          q: "Is a wildcard CORS origin bad?",
          a: "Only in combination with credentials (Access-Control-Allow-Credentials: true) — browsers reject that pair, which the Inspector reports as an error. A wildcard with no credentials simply means any site may read non-credentialed responses.",
        },
        {
          q: "Why should I care if a cookie lacks HttpOnly?",
          a: "Without HttpOnly, page JavaScript can read the cookie via document.cookie, expanding the blast radius of any XSS bug. Secure matters when the cookie must never travel over plain HTTP.",
        },
      ],
    },
  ],
};

export default article;