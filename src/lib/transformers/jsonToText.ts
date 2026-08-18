import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { isPlainObject } from "@/lib/transformers/jsonTable";

function scalarText(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
}

function objectLines(obj: Record<string, unknown>, pad: string): string[] {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return [`${pad}<empty object>`];
  }
  const lines: string[] = [];
  entries.forEach(([key, child]) => {
    if (isPlainObject(child)) {
      lines.push(`${pad}${key}:`);
      lines.push(...objectLines(child, `${pad}  `));
    } else if (Array.isArray(child)) {
      if (child.length === 0) {
        lines.push(`${pad}${key}: <empty array>`);
      } else {
        lines.push(`${pad}${key}:`);
        lines.push(...arrayLines(child, `${pad}  `));
      }
    } else {
      lines.push(`${pad}${key}: ${scalarText(child)}`);
    }
  });
  return lines;
}

function arrayLines(values: unknown[], pad: string): string[] {
  const lines: string[] = [];
  values.forEach((item) => {
    if (isPlainObject(item)) {
      const sub = objectLines(item, `${pad}  `);
      const [first, ...rest] = sub;
      lines.push(first ? `${pad}- ${first.trimStart()}` : `${pad}-`);
      lines.push(...rest);
    } else if (Array.isArray(item)) {
      lines.push(`${pad}- <nested array>`);
      lines.push(...arrayLines(item, `${pad}  `));
    } else {
      lines.push(`${pad}- ${scalarText(item)}`);
    }
  });
  return lines;
}

export function jsonToText(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to convert.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(input, `Invalid JSON: ${parsed.error.message}`, "JSON", "JSON");
  }

  const value = parsed.value;
  const lines = isPlainObject(value)
    ? objectLines(value, "")
    : Array.isArray(value)
      ? arrayLines(value, "")
      : [scalarText(value)];

  return okResult(
    input,
    lines.join("\n"),
    "JSON_TO_TEXT",
    "TEXT",
    "JSON converted to plain text",
    "JSON",
  );
}