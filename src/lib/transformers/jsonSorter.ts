import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortValue((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export function jsonSorter(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to sort.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(input, `${parsed.error.title}: ${parsed.error.message}`, "JSON", "JSON");
  }

  return okResult(
    input,
    JSON.stringify(sortValue(parsed.value), null, 2),
    "JSON_FORMAT",
    "JSON",
    "JSON keys sorted",
    "JSON",
  );
}