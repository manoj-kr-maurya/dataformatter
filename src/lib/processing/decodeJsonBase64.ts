import { detectBase64 } from "@/lib/detection/detectBase64";
import { parseJson } from "@/lib/json/validate";
import { parseJwt } from "@/lib/jwt/decode";

export interface RecursiveDecodeResult {
  value: unknown;
  changed: boolean;
}

/** True if any string value anywhere in the JSON is confident Base64 or a JWT. */
export function jsonHasDecodableBase64(value: unknown): boolean {
  if (typeof value === "string") {
    return detectBase64(value).ok || parseJwt(value).ok;
  }
  if (Array.isArray(value)) {
    return value.some(jsonHasDecodableBase64);
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).some(jsonHasDecodableBase64);
  }
  return false;
}

/**
 * Recursively walk a JSON value and decode any string that is confident
 * Base64. When a decoded value is itself valid JSON, it is re-parsed into a
 * nested value and recursion continues into it; otherwise it becomes the
 * raw decoded string. "Confident" follows the existing Base64 detector: at
 * least 8 chars, valid alphabet, decodes to readable text.
 */
export function decodeJsonBase64Recursive(value: unknown): RecursiveDecodeResult {
  if (typeof value === "string") {
    const decoded = decodeString(value);
    return { value: decoded.value, changed: decoded.changed };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((item) => {
      const result = decodeJsonBase64Recursive(item);
      if (result.changed) {
        changed = true;
      }
      return result.value;
    });
    return { value: items, changed };
  }

  if (value !== null && typeof value === "object") {
    const obj: Record<string, unknown> = {};
    let changed = false;
    for (const [key, item] of Object.entries(value)) {
      const result = decodeJsonBase64Recursive(item);
      if (result.changed) {
        changed = true;
      }
      obj[key] = result.value;
    }
    return { value: obj, changed };
  }

  return { value, changed: false };
}

function decodeString(input: string): RecursiveDecodeResult {
  const detected = detectBase64(input);
  if (detected.ok && detected.decoded !== undefined) {
    const decodedText = detected.decoded;
    const parsed = parseJson(decodedText);
    if (parsed.ok) {
      const nested = decodeJsonBase64Recursive(parsed.value);
      return { value: nested.value, changed: true };
    }
    return { value: decodedText, changed: true };
  }

  const jwt = parseJwt(input);
  if (jwt.ok) {
    const header = decodeJsonBase64Recursive(jwt.value.header);
    const payload = decodeJsonBase64Recursive(jwt.value.payload);
    return {
      value: { header: header.value, payload: payload.value, signature: jwt.value.signature },
      changed: true,
    };
  }

  return { value: input, changed: false };
}
