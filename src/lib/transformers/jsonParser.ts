import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { jsonFailResult, okResult } from "@/lib/transformers/builders";
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
    return jsonFailResult(input, {
      title: "Invalid JSON",
      message: "There is no JSON to parse.",
    });
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return jsonFailResult(input, parsed.error);
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