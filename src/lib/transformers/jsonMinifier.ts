import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { jsonFailResult, okResult } from "@/lib/transformers/builders";

export function jsonMinifier(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return jsonFailResult(input, {
      title: "Invalid JSON",
      message: "There is no JSON to minify.",
    });
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return jsonFailResult(input, parsed.error);
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