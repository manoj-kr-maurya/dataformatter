import { encodeBase64 } from "@/lib/base64/encode";
import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function jsonToBase64(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to convert.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(
      input,
      `Invalid JSON: ${parsed.error.message}`,
      "JSON",
      "JSON",
    );
  }

  const encoded = encodeBase64(JSON.stringify(parsed.value));
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Cannot encode JSON.", "UNKNOWN", "JSON");
  }

  return okResult(input, encoded.value, "JSON_TO_BASE64", "TEXT", "JSON encoded as Base64", "JSON");
}