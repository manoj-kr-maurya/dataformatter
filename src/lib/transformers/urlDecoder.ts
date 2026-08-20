import { decodeUrl } from "@/lib/encoding/url";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function urlDecoder(input: string): TransformationResult {
  const decoded = decodeUrl(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid URL encoding.", "UNKNOWN", "TEXT");
  }

  return okResult(input, decoded.value, "URL_DECODE", "TEXT", "URL decoded");
}