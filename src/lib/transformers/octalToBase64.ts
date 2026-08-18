import { bytesToBase64, octalToBytes } from "@/lib/base64/binary";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function octalToBase64(input: string): TransformationResult {
  const parsed = octalToBytes(input);
  if (!parsed.ok) {
    return failResult(input, parsed.error ?? "Invalid octal.", "TEXT", "TEXT");
  }

  return okResult(
    input,
    bytesToBase64(parsed.bytes),
    "OCTAL_TO_BASE64",
    "BASE64",
    "Octal encoded as Base64",
    "TEXT",
  );
}