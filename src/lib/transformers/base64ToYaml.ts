import { decodeBase64 } from "@/lib/base64/decode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base64ToYaml(input: string): TransformationResult {
  const decoded = decodeBase64(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid Base64.", "BASE64", "BASE64");
  }

  if (!decoded.value.trim()) {
    return failResult(input, "Decoded Base64 contains no YAML.", "BASE64", "BASE64");
  }

  return okResult(input, decoded.value, "BASE64_TO_YAML", "TEXT", "Base64 decoded to YAML", "BASE64");
}