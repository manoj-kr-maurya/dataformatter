import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function jsonEncoder(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to encode.", "UNKNOWN", "TEXT");
  }

  try {
    const encoded = JSON.stringify(input);
    return okResult(input, encoded, "JSON_ENCODE", "JSON", "JSON string encoded", "TEXT");
  } catch {
    return failResult(input, "Unable to encode JSON.", "UNKNOWN", "TEXT");
  }
}