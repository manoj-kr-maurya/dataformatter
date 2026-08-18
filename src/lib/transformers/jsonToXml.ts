import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { isPlainObject } from "@/lib/transformers/jsonTable";

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function xmlName(key: string): string {
  const cleaned = key.replace(/[^\w.\-]/g, "_");
  const valid = /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
  return valid || "item";
}

function renderXml(value: unknown, name: string, depth: number): string {
  const pad = "  ".repeat(depth);
  if (value === null || value === undefined) {
    return `${pad}<${name}/>`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${pad}<${name}/>`;
    }
    return value
      .map((item) => renderXml(item, name, depth))
      .join("\n");
  }
  if (isPlainObject(value)) {
    if (Object.keys(value).length === 0) {
      return `${pad}<${name}/>`;
    }
    const children = Object.entries(value)
      .map(([key, childValue]) => renderXml(childValue, xmlName(key), depth + 1))
      .join("\n");
    return `${pad}<${name}>\n${children}\n${pad}</${name}>`;
  }
  return `${pad}<${name}>${xmlEscape(String(value))}</${name}>`;
}

export function jsonToXml(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to convert.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(input, `Invalid JSON: ${parsed.error.message}`, "JSON", "JSON");
  }

  const value = parsed.value;

  if (isPlainObject(value)) {
    const children = Object.entries(value)
      .map(([key, childValue]) => renderXml(childValue, xmlName(key), 1))
      .join("\n");
    return okResult(
      input,
      `<root>\n${children}\n</root>`,
      "JSON_TO_XML",
      "TEXT",
      "JSON converted to XML",
      "JSON",
    );
  }

  const single = renderXml(value, "root", 0);
  return okResult(input, single, "JSON_TO_XML", "TEXT", "JSON converted to XML", "JSON");
}