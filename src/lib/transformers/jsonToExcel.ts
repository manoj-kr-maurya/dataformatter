import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { htmlEscape, jsonTable } from "@/lib/transformers/jsonTable";

/**
 * Produce an Excel-openable HTML table. Excel imports HTML `<table>` markup
 * natively, so the generated string can be saved as an .xls file.
 */
export function jsonToExcel(input: string): TransformationResult {
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

  const header = table.columns.map((name) => `<th>${htmlEscape(name)}</th>`).join("");
  const rows = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${htmlEscape(cell)}</td>`).join("")}</tr>`)
    .join("\n");

  const output = [
    '<table border="1">',
    "  <thead>",
    `    <tr>${header}</tr>`,
    "  </thead>",
    "  <tbody>",
    rows
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n"),
    "  </tbody>",
    "</table>",
  ].join("\n");

  return okResult(input, output, "JSON_TO_EXCEL", "TEXT", "JSON converted to Excel", "JSON");
}