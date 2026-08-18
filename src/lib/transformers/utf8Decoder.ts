import { unescapeUtf8Escapes } from "@/lib/encoding/utf8";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function utf8Decoder(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to decode.", "UNKNOWN", "TEXT");
  }

  return okResult(
    input,
    unescapeUtf8Escapes(input),
    "UTF8_DECODE",
    "TEXT",
    "UTF-8 escape sequences decoded",
    "TEXT",
  );
}