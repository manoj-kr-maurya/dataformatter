import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "how-to-decode-a-jwt",
  title: "How to Decode a JWT: Header, Payload and Claims Explained",
  description:
    "A JSON Web Token is three base64url segments joined by dots: header, payload and signature. Learn what each part contains, how claims like sub, exp and iat work, and how to decode a token online without uploading it.",
  h1: "How to Decode a JWT: Header, Payload and Claims Explained",
  category: "API Engineering",
  excerpt:
    "A JWT looks like eyJhbGciOi… but it's just three base64url parts: header, payload and signature. Decoding shows you the algorithm and the claims — decoding is not the same as verifying.",
  geo: {
    what: "A JSON Web Token (JWT) is a three-segment string — header.payload.signature — where header and payload are base64url-encoded JSON. Decoding reveals the signing algorithm (alg, e.g. HS256) and the claims (sub, iss, aud, exp, iat).",
    who: "Developers and security reviewers inspecting access tokens and OIDC ID tokens, or debugging why a request was rejected, without pasting secrets into a third-party service.",
    different: "The JWT Decoder strips Bearer prefixes automatically, renders header and payload as readable JSON, and decodes everything locally so the token never leaves your browser.",
  },
  publishedAt: "2026-09-15",
  relatedToolPaths: ["/jwt-decoder", "/base64-decoder", "/timestamp", "/json-formatter"],
  relatedSlugs: ["http-headers-developers-should-know", "what-makes-an-api-change-breaking"],
  blocks: [
    {
      type: "p",
      text: "A JWT is a compact, URL-safe way to carry claims between parties. Its structure is deliberately simple: three base64url segments separated by dots. Once you can read those segments, decoding a token takes seconds — and it never requires the secret that signed it.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "JWT",
          definition: "JSON Web Token — an encoded, signed (or signed-and-encrypted) container for JSON claims, standardized in RFC 7519, commonly used for access tokens and ID tokens.",
        },
        {
          term: "Header",
          definition: "The first segment. A small JSON object that states the signing algorithm (typically HS256, RS256 or ES256) and often the token type (typ: JWT).",
        },
        {
          term: "Payload (claims)",
          definition: "The second segment. JSON statements about the subject: who it is (sub), who issued it (iss), who it's for (aud), when it expires (exp) and when it was issued (iat).",
        },
        {
          term: "Signature",
          definition: "The third segment. A cryptographic tag produced from header + payload using the algorithm's secret or private key. It proves the token hasn't been tampered with and pins its issuer.",
        },
        {
          term: "base64url",
          definition: "The URL-safe Base64 variant JWTs use: - replaces +, _ replaces /, and trailing = padding is removed so the token travels inside headers and query strings without escaping issues.",
        },
      ],
    },
    {
      type: "h2",
      text: "The three parts of a JWT",
    },
    {
      type: "p",
      text: "Every standard JWT has exactly two dots, splitting it into three segments. The first two are plain JSON that has been base64url-encoded — anyone can read them, which is why JWTs carry claims, never sensitive secrets.",
    },
    {
      type: "code",
      label: "A token's anatomy",
      code: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJKb2huIn0.fGBj_cRZlF2P_fuY-SL9vLKab7nNZs7mR4kHVeLP86Y

header.payload.signature

1. header    ->  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
2. payload   ->  eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJKb2huIn0
3. signature ->  fGBj_cRZlF2P_fuY-SL9vLKab7nNZs7mR4kHVeLP86Y`,
    },
    {
      type: "h2",
      text: "What's in the header",
    },
    {
      type: "p",
      text: "The header is the smallest part. Its only job is to tell verifiers how the token was signed and what type it is. Decoding the first segment above gives exactly this JSON:",
    },
    {
      type: "code",
      label: "Decoded header",
      code: `{
  "alg": "HS256",
  "typ": "JWT"
}`,
    },
    {
      type: "h2",
      text: "Common claims in the payload",
    },
    {
      type: "p",
      text: "The payload holds the claims. Some are registered (community-standardized), some are public (custom, but collision-resistant), and some are private to your issuer. The most common registered claims are:",
    },
    {
      type: "table",
      caption: "The registered JWT claims you'll decode most often",
      headers: ["Claim", "Meaning", "Example"],
      rows: [
        ["sub", "Subject — who the token is about", "user:1042"],
        ["iss", "Issuer — who minted the token", "https://auth.example.com"],
        ["aud", "Audience — who may accept it", "api.example.com"],
        ["exp", "Expiry — Unix seconds after which the token is invalid", "1827072000"],
        ["iat", "Issued-at — Unix seconds when the token was created", "1765584000"],
        ["nbf", "Not-before — token is invalid before this Unix time", "1765584000"],
        ["jti", "JWT ID — a unique identifier for this token", "9f2c…"],
      ],
    },
    {
      type: "p",
      text: "The exp and iat values are Unix timestamps. To read them as human dates, paste them into the Timestamp Converter — the difference between exp and iat is the token's intended lifetime.",
    },
    {
      type: "h2",
      text: "Decoding is not verifying",
    },
    {
      type: "p",
      text: "Because header and payload are encoded, not encrypted, decoding never needs a secret — and success says nothing about authenticity. A token decodes perfectly even if an attacker forged it. Verifying means recomputing the signature with the issuer's public key or shared secret, and that happens in your application, on the server.",
    },
    {
      type: "h2",
      text: "How to decode a JWT online",
    },
    {
      type: "ol",
      items: [
        "Paste the token into the JWT Decoder — a leading 'Bearer ' is stripped automatically, and dots count as exactly two.",
        "Read the header (algorithm) and payload (claims) as formatted JSON sections.",
        "Check exp and iat: convert them with the Timestamp Converter to confirm the token's lifetime and current validity.",
        "Satisfied with the claims? Move on to verification — a signature check requires the issuer's key and never happens in a decoder.",
      ],
    },
    {
      type: "example",
      inputLabel: "Token in",
      input: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyOjEwNDIiLCJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJleHAiOjE4MjcwNzIwMDB9.signature",
      outputLabel: "Decoded out",
      output: `Header
{
  "alg": "HS256"
}
---
Payload
{
  "sub": "user:1042",
  "iss": "https://auth.example.com",
  "exp": 1827072000
}`,
    },
    {
      type: "note",
      title: "Decode freely, verify always",
      text: "A decoder's job ends when the claims are legible. Treat any claim from an unverified token as circumstantial evidence — check the signature in your application before trusting sub, scopes or roles.",
    },
    {
      type: "h2",
      text: "Why a pasted token might fail to decode",
    },
    {
      type: "ul",
      items: [
        "Truncation — most often the final signature segment is dropped during copy-paste. Re-copy the whole three-part token.",
        "URL-encoding — tokens that traveled through logs or query strings may contain %22 or %7B sequences. Run them through the URL Decoder first.",
        "Not a JWT — an access-token format that isn't three dot-separated base64url segments (for example opaque tokens or some opaque SAML artifacts).",
      ],
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Paste any real token into the JWT Decoder to see its header and claims as readable JSON, then use the Timestamp Converter to interpret exp, iat and nbf. Pair it with the HTTP Header Inspector when an Authorization header is rejecting your requests.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is decoding a JWT the same as verifying it?",
          a: "No. Decoding only base64url-decodes the header and payload, which needs no secret. Verifying recomputes the signature with the issuer's key and must happen server-side in your application.",
        },
        {
          q: "Why can I decode a token without the signing key?",
          a: "Header and payload are encoded (base64url), not encrypted. Encoded data is read by anyone by design; the signature is what protects integrity — and it cannot be validated without the key.",
        },
        {
          q: "How do I read the exp claim as a date?",
          a: "exp is a Unix timestamp in seconds. Convert it with the Timestamp Converter or compare two timestamps with its difference mode; exp minus iat is the token lifetime.",
        },
        {
          q: "Is it safe to paste a token online to decode it?",
          a: "Any decoder that works locally is safe to use. The JWT Decoder runs entirely in your browser and nothing is uploaded — but avoid pasting live production tokens with privileged claims as a general habit.",
        },
      ],
    },
  ],
};

export default article;