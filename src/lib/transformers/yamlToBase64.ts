import { encodeBase64 } from "@/lib/base64/encode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function yamlToBase64(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no YAML to convert.", "UNKNOWN", "TEXT");
  }

  const encoded = encodeBase64(trimmed);
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Unable to encode YAML.", "UNKNOWN", "TEXT");
  }

  return okResult(input, encoded.value, "YAML_TO_BASE64", "TEXT", "YAML encoded as Base64", "TEXT");
}