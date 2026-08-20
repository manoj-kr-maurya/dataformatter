import { base64ToBytes, bytesToBinaryString } from "@/lib/base64/binary";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base64ToBinary(input: string): TransformationResult {
  const decoded = base64ToBytes(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid Base64.", "BASE64", "BASE64");
  }

  return okResult(
    input,
    bytesToBinaryString(decoded.bytes),
    "BASE64_TO_BINARY",
    "TEXT",
    "Base64 decoded to binary",
    "BASE64",
  );
}