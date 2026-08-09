import { parseJwt } from "@/lib/jwt/decode";
import { formatJwtOutput } from "@/lib/jwt/format";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function jwtDecoder(input: string): TransformationResult {
  const parsed = parseJwt(input);
  if (!parsed.ok) {
    return failResult(input, parsed.error, "JWT", "JWT");
  }

  return okResult(
    input,
    formatJwtOutput(parsed.value),
    "JWT_DECODE",
    "JWT",
    "JWT decoded — header and payload shown",
    "JWT",
  );
}