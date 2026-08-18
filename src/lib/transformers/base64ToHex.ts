import { base64ToBytes, bytesToHex } from "@/lib/base64/binary";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function base64ToHex(input: string): TransformationResult {
  const decoded = base64ToBytes(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid Base64.", "BASE64", "BASE64");
  }

  return okResult(
    input,
    bytesToHex(decoded.bytes),
    "BASE64_TO_HEX",
    "TEXT",
    "Base64 decoded to hex",
    "BASE64",
  );
}