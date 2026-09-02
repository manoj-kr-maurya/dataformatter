/**
 * Privacy-first sanitization for sensitive values (bearer tokens, JWTs,
 * cookies, emails, phone numbers, credit-card-like runs, API keys, IPs).
 * Everything runs locally. Detection is deliberately cautious — it reports
 * "potential sensitive value", never a claim of perfect PII coverage.
 */

export type SanitizeMode = "mask" | "redact";

const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?){2}\d{3,4}(?!\d)/g;
const CC_RE = /\b(?:\d[ -]?){13,16}\b/g;
const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const ID_RE = /(?:[A-Za-z0-9_-]{16,})(?:[=+/\\][A-Za-z0-9_-]*)?/g;

/** Matches a token-shaped header value like `Bearer <base64url>...`. */
const BEARER_TOKEN_RE = /(?=(?<scheme>Bearer|Basic)\s+)(?<token>[A-Za-z0-9._~+/=\-]+)/gi;

/** TODO match JWT-shaped `header.payload.signature` runs. */
const JWT_RE = /[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

export interface SensitiveMatch {
  kind: "email" | "phone" | "card" | "ip" | "jwt" | "token" | "id";
  label: string;
}

/**
 * Describes the kinds of sensitive values present in the text without
 * printing the values themselves.
 */
export function detectSensitive(text: string): SensitiveMatch[] {
  const found = new Set<SensitiveMatch["kind"]>();
  if (EMAIL_RE.test(text)) found.add("email");
  EMAIL_RE.lastIndex = 0;
  if (PHONE_RE.test(text)) found.add("phone");
  PHONE_RE.lastIndex = 0;
  if (CC_RE.test(text)) found.add("card");
  CC_RE.lastIndex = 0;
  if (IP_RE.test(text)) found.add("ip");
  IP_RE.lastIndex = 0;
  if (JWT_RE.test(text)) found.add("jwt");
  JWT_RE.lastIndex = 0;
  if (BEARER_TOKEN_RE.test(text)) found.add("token");
  BEARER_TOKEN_RE.lastIndex = 0;
  if (ID_RE.test(text)) found.add("id");
  ID_RE.lastIndex = 0;

  const labels: Record<SensitiveMatch["kind"], string> = {
    email: "email address",
    phone: "phone number",
    card: "card-like number",
    ip: "IP address",
    jwt: "JWT",
    token: "authorization token",
    id: "long identifier (possible token/ID)",
  };
  return Array.from(found).map((kind) => ({ kind, label: labels[kind] }));
}

function maskValue(value: string, mode: SanitizeMode): string {
  if (mode === "redact") return "[redacted]";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••••${value.slice(-4)}`;
}

/**
 * Returns sanitized text and a report of what was masked. `mask` keeps a hint
 * (first/last characters), `redact` replaces the whole value.
 */
export function sanitizeText(text: string, mode: SanitizeMode = "mask") {
  let out = text;

  out = out.replace(JWT_RE, (token) => maskValue(token, mode));
  out = out.replace(
    /(?<=Bearer\s+)([A-Za-z0-9._~+/=\-]+)/gi,
    (token) => maskValue(token, mode),
  );
  out = out.replace(EMAIL_RE, () => (mode === "redact" ? "[redacted]" : "••••@••••"));
  out = out.replace(CC_RE, (value) => maskValue(value.trim(), mode));
  out = out.replace(PHONE_RE, (value) => maskValue(value.trim(), mode));
  out = out.replace(IP_RE, (value) => maskValue(value.trim(), mode));
  out = out.replace(ID_RE, (value) => {
    // Only mask long identifier runs that look entropy/token-like (letters +
    // digits). Purely lowercase word-identifiers like "upstream_timeout" or
    // "internal-server-error" pass through unmasked.
    if (!/[0-9]/.test(value)) return value;
    return maskValue(value.trim(), mode);
  });

  return { text: out, masked: detectSensitive(out).length === 0 };
}

/** Masks the values of named sensitive headers (auth/cookie) for display. */
export function maskHeaderValues(headers: [string, string][]): [string, string][] {
  return headers.map(([name, value]) => {
    const lower = name.toLowerCase();
    if (lower === "authorization" || lower === "proxy-authorization" || lower === "cookie" || lower === "set-cookie") {
      return [name, maskValue(value, "mask")];
    }
    return [name, value];
  });
}

export function maskAuthorizationValue(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) return "";
  const match = /^(Bearer|Basic|Token)\s+/i.exec(cleaned);
  if (match) {
    return `${match[1]} ${maskValue(cleaned.slice(match[0].length), "mask")}`;
  }
  return maskValue(cleaned, "mask");
}