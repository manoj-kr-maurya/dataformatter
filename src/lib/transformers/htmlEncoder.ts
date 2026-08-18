import { encodeHtmlEntities } from "@/lib/encoding/html";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function htmlEncoder(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to encode.", "UNKNOWN", "TEXT");
  }

  return okResult(input, encodeHtmlEntities(input), "HTML_ENCODE", "TEXT", "HTML encoded");
}