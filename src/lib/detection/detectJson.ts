import { parseJson } from "@/lib/json/validate";

export interface JsonDetection {
  isJson: boolean;
  value?: unknown;
}

export function detectJson(input: string): JsonDetection {
  const trimmed = input.trim();
  const parsed = parseJson(trimmed);
  if (parsed.ok) {
    return { isJson: true, value: parsed.value };
  }
  return { isJson: false };
}