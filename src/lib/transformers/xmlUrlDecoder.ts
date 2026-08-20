import { decodeUrl } from "@/lib/encoding/url";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function xmlUrlDecoder(input: string): TransformationResult {
  const decoded = decodeUrl(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid URL encoding.", "UNKNOWN", "TEXT");
  }

  return okResult(input, decoded.value, "XML_URL_DECODE", "TEXT", "XML URL decoded");
}