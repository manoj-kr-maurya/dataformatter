import { binaryStringToBytes, bytesToBase64 } from "@/lib/base64/binary";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function binaryToBase64(input: string): TransformationResult {
  const parsed = binaryStringToBytes(input);
  if (!parsed.ok) {
    return failResult(input, parsed.error ?? "Invalid binary.", "TEXT", "TEXT");
  }

  return okResult(
    input,
    bytesToBase64(parsed.bytes),
    "BINARY_TO_BASE64",
    "BASE64",
    "Binary encoded as Base64",
    "TEXT",
  );
}