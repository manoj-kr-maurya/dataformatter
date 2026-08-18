import { escapeToUtf8Escapes } from "@/lib/encoding/utf8";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function utf8Converter(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to convert.", "UNKNOWN", "TEXT");
  }

  return okResult(
    input,
    escapeToUtf8Escapes(input),
    "UTF8_ENCODE",
    "TEXT",
    "Converted to UTF-8 escape sequences",
    "TEXT",
  );
}