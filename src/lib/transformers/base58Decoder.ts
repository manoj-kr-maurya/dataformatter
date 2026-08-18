import { decodeBase58 } from "@/lib/base58/decode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base58Decoder(input: string): TransformationResult {
  const decoded = decodeBase58(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid Base58.", "UNKNOWN", "TEXT");
  }

  return okResult(input, decoded.value, "BASE58_DECODE", "TEXT", "Base58 decoded to plain text", "TEXT");
}