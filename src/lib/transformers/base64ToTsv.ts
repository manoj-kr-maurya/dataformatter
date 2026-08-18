import { decodeBase64 } from "@/lib/base64/decode";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base64ToTsv(input: string): TransformationResult {
  const decoded = decodeBase64(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid Base64.", "BASE64", "BASE64");
  }

  const trimmed = decoded.value.trim();
  if (!trimmed.includes("\t") && !trimmed.includes("\n")) {
    return failResult(input, "Decoded Base64 is not TSV.", "BASE64", "BASE64");
  }

  return okResult(input, decoded.value, "BASE64_TO_TSV", "TEXT", "Base64 decoded to TSV", "BASE64");
}