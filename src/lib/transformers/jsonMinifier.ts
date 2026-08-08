import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function jsonMinifier(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to minify.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(input, `${parsed.error.title}: ${parsed.error.message}`, "JSON", "JSON");
  }

  return okResult(
    input,
    JSON.stringify(parsed.value),
    "JSON_MINIFY",
    "JSON",
    "JSON minified",
    "JSON",
  );
}