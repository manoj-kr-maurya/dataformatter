import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

function locationSuffix(line?: number, column?: number): string {
  return line !== undefined && column !== undefined
    ? ` (around line ${line}, column ${column})`
    : "";
}

export function jsonFormatter(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to format.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(
      input,
      `${parsed.error.title}: ${parsed.error.message}${locationSuffix(
        parsed.error.line,
        parsed.error.column,
      )}`,
      "JSON",
      "JSON",
    );
  }

  const pretty = JSON.stringify(parsed.value, null, 2);
  return okResult(
    input,
    pretty,
    "JSON_FORMAT",
    "JSON",
    "JSON detected and pretty-printed",
    "JSON",
  );
}