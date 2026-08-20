import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { jsonFailResult, okResult } from "@/lib/transformers/builders";

export function jsonFormatter(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return jsonFailResult(input, {
      title: "Invalid JSON",
      message: "There is no JSON to format.",
    });
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return jsonFailResult(input, parsed.error);
  }

  const pretty = JSON.stringify(parsed.value, null, 2);
  return okResult(
    input,
    pretty,
    "JSON_FORMAT",
    "JSON",
    "Valid JSON formatted",
    "JSON",
  );
}