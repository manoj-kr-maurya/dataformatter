import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { isPlainObject } from "@/lib/transformers/jsonTable";

function typeName(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function scalarText(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function renderNode(value: unknown, label: string, pad: string): string[] {
  const lines: string[] = [];
  const prefix = `${pad}${label}`;

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    lines.push(`${prefix}: object (${entries.length} key${entries.length === 1 ? "" : "s"})`);
    entries.forEach(([key, child]) => lines.push(...renderNode(child, key, `${pad}  `)));
    return lines;
  }

  if (Array.isArray(value)) {
    lines.push(`${prefix}: array (${value.length} item${value.length === 1 ? "" : "s"})`);
    value.forEach((child, index) => lines.push(...renderNode(child, `[${index}]`, `${pad}  `)));
    return lines;
  }

  lines.push(`${prefix} (${typeName(value)}): ${scalarText(value)}`);
  return lines;
}

export function jsonParser(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to parse.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(input, `Invalid JSON: ${parsed.error.message}`, "JSON", "JSON");
  }

  return okResult(
    input,
    renderNode(parsed.value, "root", "").join("\n"),
    "JSON_PARSE",
    "TEXT",
    "JSON parsed into a typed tree",
    "JSON",
  );
}
