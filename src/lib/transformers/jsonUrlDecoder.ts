import { decodeUrl } from "@/lib/encoding/url";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";

export function jsonUrlDecoder(input: string): TransformationResult {
  const decoded = decodeUrl(input);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid URL encoding.", "UNKNOWN", "TEXT");
  }

  try {
    const parsed = JSON.parse(decoded.value) as unknown;
    return okResult(
      input,
      JSON.stringify(parsed, null, 2),
      "JSON_URL_DECODE",
      "JSON",
      "JSON URL decoded and formatted",
      "JSON",
    );
  } catch {
    return failResult(
      input,
      "Decoded text is not valid JSON. URL-decode requires a JSON payload.",
      "UNKNOWN",
      "JSON",
    );
  }
}