import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { htmlEscape, isPlainObject } from "@/lib/transformers/jsonTable";

function scalarHtml(value: unknown): string {
  if (value === null || value === undefined) {
    return htmlEscape("null");
  }
  if (typeof value === "string") {
    return htmlEscape(value);
  }
  return htmlEscape(String(value));
}

function objectHtml(obj: Record<string, unknown>): string {
  const items: string[] = [];
  Object.entries(obj).forEach(([key, child]) => {
    if (isPlainObject(child)) {
      items.push(`<li><strong>${htmlEscape(key)}</strong><ul>${objectHtml(child)}</ul></li>`);
    } else if (Array.isArray(child)) {
      items.push(`<li><strong>${htmlEscape(key)}</strong><ul>${arrayHtml(child)}</ul></li>`);
    } else {
      items.push(`<li><strong>${htmlEscape(key)}</strong>: ${scalarHtml(child)}</li>`);
    }
  });
  return items.join("");
}

function arrayHtml(values: unknown[]): string {
  const items: string[] = [];
  values.forEach((item) => {
    if (isPlainObject(item)) {
      items.push(`<li><ul>${objectHtml(item)}</ul></li>`);
    } else if (Array.isArray(item)) {
      items.push(`<li><ul>${arrayHtml(item)}</ul></li>`);
    } else {
      items.push(`<li>${scalarHtml(item)}</li>`);
    }
  });
  return items.join("");
}

export function jsonToHtml(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to convert.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(input, `Invalid JSON: ${parsed.error.message}`, "JSON", "JSON");
  }

  const value = parsed.value;
  const body = isPlainObject(value)
    ? objectHtml(value)
    : Array.isArray(value)
      ? arrayHtml(value)
      : `<li>${scalarHtml(value)}</li>`;

  return okResult(
    input,
    `<ul>${body}</ul>`,
    "JSON_TO_HTML",
    "TEXT",
    "JSON converted to HTML",
    "JSON",
  );
}