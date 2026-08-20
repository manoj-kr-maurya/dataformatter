import { encodeUrl } from "@/lib/encoding/url";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function jsonUrlEncoder(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to encode.", "UNKNOWN", "TEXT");
  }

  try {
    JSON.parse(input);
  } catch {
    return failResult(input, "Invalid JSON. URL-encoding requires valid JSON first.", "UNKNOWN", "JSON");
  }

  const encoded = encodeUrl(input);
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Unable to URL encode the JSON.", "UNKNOWN", "JSON");
  }

  return okResult(input, encoded.value, "JSON_URL_ENCODE", "TEXT", "JSON URL encoded", "JSON");
}