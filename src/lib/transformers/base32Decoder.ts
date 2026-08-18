import { decodeBase32 } from "@/lib/base32/decode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base32Decoder(input: string): TransformationResult {
  const decoded = decodeBase32(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid Base32.", "UNKNOWN", "TEXT");
  }

  return okResult(input, decoded.value, "BASE32_DECODE", "TEXT", "Base32 decoded to plain text", "TEXT");
}