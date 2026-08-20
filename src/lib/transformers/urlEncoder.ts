import { encodeUrl } from "@/lib/encoding/url";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function urlEncoder(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to encode.", "UNKNOWN", "TEXT");
  }

  const encoded = encodeUrl(input);
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Unable to URL encode.", "UNKNOWN", "TEXT");
  }

  return okResult(input, encoded.value, "URL_ENCODE", "TEXT", "URL encoded");
}