import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "base64-vs-base64url",
  title: "Base64 vs Base64URL: What's the Difference and When to Use Each",
  description:
    "Base64 and Base64URL differ in two characters and in padding: + and / become - and _, and padding is optional. Learn when each variant is safe, why JWTs and data URIs demand Base64URL, and how to convert between them.",
  h1: "Base64 vs Base64URL: What's the Difference and When to Use Each",
  category: "Data Formats",
  excerpt:
    "Base64 and Base64URL look almost identical but differ in two characters and padding rules. The wrong variant breaks URLs, file names and JWTs — here's when each is safe and how to pick.",
  geo: {
    what: "Base64URL is the URL-safe variant of Base64: it swaps + for - and / for _, and drops the = padding. Base64 is the original 4-to-3 byte encoding; Base64URL is the same encoding made safe for URLs, file names and headers.",
    who: "Developers encoding data for web contexts — query strings, signed tokens, data URIs and CDN file names — who need to know which variant won't get mangled in transit.",
    different: "The Base64 Encoder generates standard Base64, the Base64 Decoder reads most variants including URL-safe input, and the JWT Decoder handles the base64url segments that JWTs are built from.",
  },
  publishedAt: "2026-09-24",
  relatedToolPaths: ["/base64-encoder", "/base64-decoder", "/jwt-decoder", "/url-encoder"],
  relatedSlugs: ["how-to-decode-a-jwt", "how-json-formatter-works"],
  blocks: [
    {
      type: "p",
      text: "Base64 and Base64URL encode the same bytes the same way — the alphabet is nearly identical. Only two characters change and padding becomes optional. That sounds trivial, until an encoded string silently breaks a URL, a file name or a JWT. This article shows exactly where they differ and which one you should use.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "Base64",
          definition: "A binary-to-text encoding that maps 3 input bytes to 4 ASCII characters using a 64-character alphabet (A–Z, a–z, 0–9, + and /), padded to a multiple of 4 with = signs.",
        },
        {
          term: "Base64URL",
          definition: "The URL-safe variant of Base64 defined in RFC 4648: + becomes -, / becomes _, and trailing = padding is usually removed so the string is safe in URLs, file names and headers.",
        },
        {
          term: "Padding (=)",
          definition: "The = signs appended to a Base64 string when its length isn't a multiple of 3. Base64URL can omit them because the recipient can infer the missing padding from the length.",
        },
        {
          term: "Percent-encoding",
          definition: "The URL escaping scheme that turns characters like + and / into %2B and %2F. Standard Base64 must be percent-encoded inside query strings; Base64URL does not need to be.",
        },
      ],
    },
    {
      type: "h2",
      text: "The two characters that differ",
    },
    {
      type: "p",
      text: "Both alphabets share the first 62 characters: A–Z, a–z and 0–9. The difference is in the last two slots and the trailing padding:",
    },
    {
      type: "table",
      caption: "Standard Base64 vs Base64URL alphabet",
      headers: ["Encoding", "62nd char", "63rd char", "Padding"],
      rows: [
        ["Base64", "+", "/", "required (= and ==)"],
        ["Base64URL", "-", "_", "optional (usually removed)"],
        ["Example", "hLg/eA==", "hLg_eA", "—"],
      ],
    },
    {
      type: "h2",
      text: "Why those two characters matter",
    },
    {
      type: "ul",
      items: [
        "In a query string, + is decoded as a space by most server frameworks, so payloads get corrupted.",
        "In a path or file name, / is a directory separator — it would create subdirectories.",
        "Percent-escaping + and / as %2B and %2F works, but it inflates the string and is easy to forget.",
        "Base64URL's - and _ are safe almost everywhere: URLs, file names, headers and JWT segments.",
      ],
    },
    {
      type: "p",
      text: "The rule of thumb: if the encoded text will ever live in a URL, a file name, a cookie or an HTTP header, use Base64URL. If it's stored in a database or payload body where +, / and = are fine, standard Base64 is acceptable.",
    },
    {
      type: "h2",
      text: "Padding: required vs optional",
    },
    {
      type: "p",
      text: "Standard Base64 pads its output to a multiple of 4 with = characters, so length is always divisible by 4. Base64URL removes the padding — the decoder infers it from length modulo 4. That's why JWT segments usually have no = at the end.",
    },
    {
      type: "code",
      label: "Same bytes, both spellings",
      code: `Input (3 bytes): 0x68 0xF8 0x7E

Standard Base64: hLg/eA==
Base64URL:      hLg_eA`,
    },
    {
      type: "h2",
      text: "Where Base64URL is effectively mandatory",
    },
    {
      type: "ul",
      items: [
        "JWTs — header, payload and signature are base64url-encoded so a token survives in an Authorization header and query strings.",
        "Data URIs — an inline image as data:image/png;base64, uses standard Base64 inside the URI value.",
        "CDN and storage keys — file-like identifiers for object storage should use Base64URL to avoid slashes.",
        "OAuth parameters — state and verifier values often travel percent-encoded; Base64URL keeps them compact.",
      ],
    },
    {
      type: "h2",
      text: "Converting between the two",
    },
    {
      type: "ol",
      items: [
        "Paste the string into the Base64 Decoder — it handles standard and URL-safe input.",
        "If you switch encodings in code, translate the alphabet explicitly: + to -, / to _, and restore padding by length.",
        "For JWTs, use the JWT Decoder, which decodes the three base64url segments as one token.",
      ],
    },
    {
      type: "note",
      title: "Do not hand-translate without handling padding",
      text: "Replacing + with - and / with _ is not enough: the padded standard form has = suffixes the decoder must drop, and the unpadded URL-safe form's length may need padding restored. Convert with a real decoder to avoid off-by-one corruption.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is Base64URL the same as standard Base64?",
          a: "Almost — the alphabet differs only in characters 62 and 63 (+ and / become - and _), and padding is optional. The bytes decoded are identical for equivalent input.",
        },
        {
          q: "Why does my JWT have no = signs but my Base64 does?",
          a: "JWTs use the unpadded base64url variant, which removes the trailing = padding. Standard Base64 in data URIs or emails keeps the padding.",
        },
        {
          q: "Can I put standard Base64 in a URL?",
          a: "Only if you percent-encode it first — otherwise + is read as a space and / breaks path segments. Using Base64URL avoids that entirely.",
        },
        {
          q: "How do I decode a Base64URL string?",
          a: "The Base64 Decoder accepts URL-safe input automatically, so you can paste it directly and get the decoded text or pretty-printed JSON.",
        },
      ],
    },
  ],
};

export default article;