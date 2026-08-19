import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { jsonFailResult, okResult } from "@/lib/transformers/builders";

/**
 * Pure JSON validation — never rewrites the input. Reports "Valid JSON"
 * or a precise `Line X, Column Y` parse error for the UI to surface.
 */
export function jsonValidator(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return jsonFailResult(input, {
      title: "Invalid JSON",
      message: "There is no JSON to validate.",
    });
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return jsonFailResult(input, parsed.error);
  }

  return okResult(
    input,
    input,
    "JSON_VALIDATE",
    "JSON",
    "Valid JSON",
    "JSON",
  );
}