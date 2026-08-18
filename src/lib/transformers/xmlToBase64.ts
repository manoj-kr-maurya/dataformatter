import { encodeBase64 } from "@/lib/base64/encode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function xmlToBase64(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no XML to convert.", "UNKNOWN", "TEXT");
  }
  if (!(trimmed.startsWith("<") && trimmed.endsWith(">"))) {
    return failResult(input, "Invalid XML. XML must start with '<' and end with '>'.", "TEXT", "TEXT");
  }

  const encoded = encodeBase64(trimmed);
  if (!encoded.ok) {
    return failResult(input, encoded.error ?? "Unable to encode XML.", "UNKNOWN", "TEXT");
  }

  return okResult(input, encoded.value, "XML_TO_BASE64", "TEXT", "XML encoded as Base64", "TEXT");
}