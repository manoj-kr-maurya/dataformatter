import { decodeBase64 } from "@/lib/base64/decode";
import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base64ToJson(input: string): TransformationResult {
  const decoded = decodeBase64(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid Base64.", "BASE64", "BASE64");
  }

  const parsed = parseJson(decoded.value);
  if (!parsed.ok) {
    return failResult(
      input,
      "Decoded Base64 is not valid JSON.",
      decoded.value ? "TEXT" : "UNKNOWN",
      "BASE64",
    );
  }

  return okResult(
    input,
    JSON.stringify(parsed.value, null, 2),
    "BASE64_TO_JSON",
    "JSON",
    "Base64 decoded and JSON pretty-printed",
    "BASE64",
  );
}