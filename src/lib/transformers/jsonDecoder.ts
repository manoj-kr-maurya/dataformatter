import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function jsonDecoder(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no JSON to decode.", "UNKNOWN", "TEXT");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input) as unknown;
  } catch {
    return failResult(input, "Invalid JSON. The text could not be decoded.", "UNKNOWN", "JSON");
  }

  const output = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
  return okResult(input, output, "JSON_DECODE", "TEXT", "JSON string decoded", "JSON");
}