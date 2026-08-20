import { encodeBase64 } from "@/lib/base64/encode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function csvToBase64(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no CSV to convert.", "UNKNOWN", "TEXT");
  }
  if (!trimmed.includes(",") && !trimmed.includes("\n")) {
    return failResult(input, "Invalid CSV. The input contains no comma-separated data.", "TEXT", "TEXT");
  }

  const encoded = encodeBase64(trimmed);
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Unable to encode CSV.", "UNKNOWN", "TEXT");
  }

  return okResult(input, encoded.value, "CSV_TO_BASE64", "TEXT", "CSV encoded as Base64", "TEXT");
}