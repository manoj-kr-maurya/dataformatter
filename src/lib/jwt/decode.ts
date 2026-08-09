import { decodeBase64 } from "@/lib/base64/decode";

export interface ParsedJwt {
  /** Decoded header (JWT segment 1), JSON object per spec. */
  header: Record<string, unknown>;
  /** Decoded payload/claims (JWT segment 2), JSON object per spec. */
  payload: Record<string, unknown>;
  /** Raw base64url signature segment (segment 3) — never decoded to text. */
  signature: string;
}

export type ParseJwtResult =
  | { ok: true; value: ParsedJwt }
  | { ok: false; error: string };

const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

const BEARER_PREFIX_RE = /^\s*bearer\s+/i;

/**
 * Remove a leading authorization label like `Bearer ` (case-insensitive),
 * so tokens pasted straight from an HTTP authorization header are accepted.
 * Returns the input unchanged when no label is present.
 */
export function stripBearerLabel(input: string): string {
  return input.replace(BEARER_PREFIX_RE, "");
}

function decodeAndAssertObject(
  part: string,
): { ok: true; value: Record<string, unknown> } | { ok: false } {
  const standard = part.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = decodeBase64(standard);
  if (!decoded.ok) {
    return { ok: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded.value);
  } catch {
    return { ok: false };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false };
  }

  return { ok: true, value: parsed as Record<string, unknown> };
}

/**
 * Parse a JWT (`header.payload.signature`) without verifying its signature.
 * A leading `Bearer ` label is accepted and ignored.
 *
 * Strict structural validation (all must hold for detection to pass):
 * - Exactly 3 dot-separated segments, none empty.
 * - Every segment uses only the base64url alphabet (`A–Z a–z 0–9 - _`, no padding).
 * - Header and payload decode as UTF-8 and parse as JSON objects.
 * The signature segment is only shape-checked — it may contain arbitrary bytes.
 */
export function parseJwt(input: string): ParseJwtResult {
  const cleaned = stripBearerLabel(input).trim();
  const parts = cleaned.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    return {
      ok: false,
      error: "Invalid JWT — expected 3 dot-separated parts (header.payload.signature).",
    };
  }

  const [headerPart, payloadPart, signature] = parts;
  if (
    !BASE64URL_RE.test(headerPart) ||
    !BASE64URL_RE.test(payloadPart) ||
    !BASE64URL_RE.test(signature)
  ) {
    return {
      ok: false,
      error: "Invalid JWT — parts may only contain base64url characters (A–Z, a–z, 0–9, -, _).",
    };
  }

  const header = decodeAndAssertObject(headerPart);
  if (!header.ok) {
    return {
      ok: false,
      error: "Invalid JWT — the header is not valid base64url-encoded JSON.",
    };
  }

  const payload = decodeAndAssertObject(payloadPart);
  if (!payload.ok) {
    return {
      ok: false,
      error: "Invalid JWT — the payload is not valid base64url-encoded JSON.",
    };
  }

  return {
    ok: true,
    value: { header: header.value, payload: payload.value, signature },
  };
}

/**
 * Token-shaped subsequences: three dot-separated base64url segments.
 * The look-alike boundary keeps the match inside a larger run of token
 * characters from merging with neighboring words.
 */
const TOKEN_CANDIDATE_RE = /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g;

/**
 * Like jwt.io, allow a JWT to be embedded anywhere in the pasted text
 * (e.g. `verify this → <token>`). Scans for every `header.payload.signature`
 * candidate and returns the first one that parses as a valid JWT.
 */
export function extractEmbeddedJwt(input: string): ParseJwtResult {
  TOKEN_CANDIDATE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_CANDIDATE_RE.exec(input)) !== null) {
    const parsed = parseJwt(match[1]);
    if (parsed.ok) {
      return parsed;
    }
  }
  return { ok: false, error: "No JWT could be found in the input text." };
}