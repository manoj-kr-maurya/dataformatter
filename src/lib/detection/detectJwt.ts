import { extractEmbeddedJwt, parseJwt, type ParsedJwt } from "@/lib/jwt/decode";

export interface JwtDetection {
  isJwt: boolean;
  value?: ParsedJwt;
}

/**
 * JWT detection sits ahead of JSON and Base64 in the auto-detect priority:
 * a token is `${header}.${payload}.${signature}` where the header and payload
 * are base64url-encoded JSON objects. When the full input is not a single
 * token, an embedded token is looked for (mirroring jwt.io).
 */
export function detectJwt(input: string): JwtDetection {
  const parsed = parseJwt(input);
  if (parsed.ok) {
    return { isJwt: true, value: parsed.value };
  }

  const embedded = extractEmbeddedJwt(input);
  if (embedded.ok) {
    return { isJwt: true, value: embedded.value };
  }

  return { isJwt: false };
}