import { hexToBytes } from "@/lib/encoding/utf8";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function hexToUtf8(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no hex to convert.", "UNKNOWN", "TEXT");
  }

  const parsed = hexToBytes(input);
  if (!parsed.ok) {
    return failResult(input, parsed.error ?? "Invalid hex.", "UNKNOWN", "TEXT");
  }

  try {
    const value = new TextDecoder("utf-8", { fatal: true }).decode(parsed.value);
    return okResult(input, value, "HEX_TO_UTF8", "TEXT", "Hex decoded to UTF-8 text", "TEXT");
  } catch {
    return failResult(input, "Invalid hex. The bytes are not valid UTF-8 text.", "UNKNOWN", "TEXT");
  }
}