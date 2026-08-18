import { encodeBase32 } from "@/lib/base32/encode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base32Encoder(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to encode.", "UNKNOWN", "TEXT");
  }

  const encoded = encodeBase32(input);
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Unable to encode Base32.", "UNKNOWN", "TEXT");
  }

  return okResult(input, encoded.value, "BASE32_ENCODE", "TEXT", "Base32 encoded");
}