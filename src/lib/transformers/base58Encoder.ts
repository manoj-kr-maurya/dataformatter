import { encodeBase58 } from "@/lib/base58/encode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base58Encoder(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to encode.", "UNKNOWN", "TEXT");
  }

  const encoded = encodeBase58(input);
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Unable to encode Base58.", "UNKNOWN", "TEXT");
  }

  return okResult(input, encoded.value, "BASE58_ENCODE", "TEXT", "Base58 encoded");
}