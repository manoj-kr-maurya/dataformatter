import { encodeBase64 } from "@/lib/base64/encode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base64Encoder(input: string): TransformationResult {
  if (!input) {
    return failResult(input, "There is no text to encode.", "UNKNOWN", "TEXT");
  }

  const encoded = encodeBase64(input);
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Unable to encode Base64.", "UNKNOWN", "TEXT");
  }

  return okResult(input, encoded.value, "BASE64_ENCODE", "TEXT", "Base64 encoded");
}