import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { isPlainObject } from "@/lib/transformers/jsonTable";

function yamlScalar(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return Number.isNaN(value) ? "null" : String(value);
  }
  const text = String(value);
  if (text === "") {
    return '""';
  }
  const numRegex = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
  const looksBoolean = /^(true|false|yes|no|on|off|null|~)$/i.test(text);
  const trims = text.trim() !== text;
  const containsMarker =
    /[:#](?:\s|$)/.test(text) ||
    /^[\-?:#,|>'"%@`&*!\\[\]{}]/.test(text) ||
    /,\s|:\s/.test(text);
  if (numRegex.test(text) || looksBoolean || trims || containsMarker) {
    return JSON.stringify(text);
  }
  return text;
}

/** Emit mapping keys at `pad`, recursing into children with deeper pads. */
function objectLines(
  obj: Record<string, unknown>,
  pad: string,
): string[] {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return [`${pad}{}`];
  }
  const lines: string[] = [];
  entries.forEach(([key, child]) => {
    const keyPrefix = `${pad}${key}:`;
    if (isPlainObject(child)) {
      if (Object.keys(child).length === 0) {
        lines.push(`${keyPrefix} {}`);
      } else {
        lines.push(keyPrefix);
        lines.push(...objectLines(child, `${pad}  `));
      }
    } else if (Array.isArray(child)) {
      if (child.length === 0) {
        lines.push(`${keyPrefix} []`);
      } else {
        lines.push(keyPrefix);
        lines.push(...arrayLines(child, `${pad}  `));
      }
    } else {
      lines.push(`${keyPrefix} ${yamlScalar(child)}`);
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
      if (item.length === 0) {
        lines.push(`${pad}- []`);
      } else {
        lines.push(`${pad}-`);
        lines.push(...arrayLines(item, `${pad}  `));
      }
    } else {
      lines.push(`${pad}- ${yamlScalar(item)}`);
    }
  });
  return lines;
}

export function jsonToYaml(input: string): TransformationResult {
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
      : [`${yamlScalar(value)}`];

  return okResult(
    input,
    lines.join("\n"),
    "JSON_TO_YAML",
    "TEXT",
    "JSON converted to YAML",
    "JSON",
  );
}