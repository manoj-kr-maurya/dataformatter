import { decodeHtmlEntities } from "@/lib/encoding/html";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function htmlDecoder(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to decode.", "UNKNOWN", "TEXT");
  }

  return okResult(
    input,
    decodeHtmlEntities(input),
    "HTML_DECODE",
    "TEXT",
    "HTML decoded to plain text",
    "TEXT",
  );
}