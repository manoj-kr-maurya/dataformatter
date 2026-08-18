import { encodeBase64 } from "@/lib/base64/encode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function tsvToBase64(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no TSV to convert.", "UNKNOWN", "TEXT");
  }
  if (!trimmed.includes("\t") && !trimmed.includes("\n")) {
    return failResult(input, "Invalid TSV. The input contains no tab-separated data.", "TEXT", "TEXT");
  }

  const encoded = encodeBase64(trimmed);
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Unable to encode TSV.", "UNKNOWN", "TEXT");
  }

  return okResult(input, encoded.value, "TSV_TO_BASE64", "TEXT", "TSV encoded as Base64", "TEXT");
}