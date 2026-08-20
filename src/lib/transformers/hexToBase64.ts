import { bytesToBase64, hexToBytes } from "@/lib/base64/binary";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function hexToBase64(input: string): TransformationResult {
  const parsed = hexToBytes(input);
  if (!parsed.ok) {
    return failResult(input, parsed.error ?? "Invalid hex.", "TEXT", "TEXT");
  }

  return okResult(
    input,
    bytesToBase64(parsed.bytes),
    "HEX_TO_BASE64",
    "BASE64",
    "Hex encoded as Base64",
    "TEXT",
  );
}