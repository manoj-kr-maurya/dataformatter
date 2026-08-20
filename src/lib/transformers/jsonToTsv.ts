import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { jsonTable, tsvCell } from "@/lib/transformers/jsonTable";

export function jsonToTsv(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to convert.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(input, `Invalid JSON: ${parsed.error.message}`, "JSON", "JSON");
  }

  const table = jsonTable(parsed.value);
  if (!table.ok) {
    return failResult(input, table.error, "JSON", "JSON");
  }

  const header = table.columns.map(tsvCell).join("\t");
  const body = table.rows.map((row) => row.map(tsvCell).join("\t"));
  const output = [header, ...body].join("\n");

  return okResult(input, output, "JSON_TO_TSV", "TEXT", "JSON converted to TSV", "JSON");
}