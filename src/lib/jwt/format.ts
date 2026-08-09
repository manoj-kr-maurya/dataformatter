import type { ParsedJwt } from "@/lib/jwt/decode";

/**
 * Human-readable output for a decoded JWT:
 *
 *   HEADER
 *   { ... }
 *
 *   PAYLOAD
 *   { ... }
 */
export function formatJwtOutput(jwt: ParsedJwt): string {
  return `HEADER\n${JSON.stringify(jwt.header, null, 2)}\n\nPAYLOAD\n${JSON.stringify(jwt.payload, null, 2)}`;
}