import { detectBase64 } from "@/lib/detection/detectBase64";
import { detectJson } from "@/lib/detection/detectJson";

export type DetectOutcome =
  | { status: "empty" }
  | { status: "json"; value: unknown }
  | { status: "base64"; decoded: string; decodedIsJson: boolean; jsonValue?: unknown }
  | { status: "unknown" };

/**
 * Deterministic detection priority:
 *  1. Valid JSON  → JSON
 *  2. Valid Base64 (robust) → BASE64 (with decoded payload inspected for JSON)
 *  3. Otherwise   → UNKNOWN (input left untouched)
 */
export function detectInput(input: string): DetectOutcome {
  if (!input.trim()) {
    return { status: "empty" };
  }

  const json = detectJson(input);
  if (json.isJson) {
    return { status: "json", value: json.value };
  }

  const base64 = detectBase64(input);
  if (base64.ok && base64.decoded !== undefined) {
    const decodedJson = detectJson(base64.decoded);
    return {
      status: "base64",
      decoded: base64.decoded,
      decodedIsJson: decodedJson.isJson,
      jsonValue: decodedJson.isJson ? decodedJson.value : undefined,
    };
  }

  return { status: "unknown" };
}