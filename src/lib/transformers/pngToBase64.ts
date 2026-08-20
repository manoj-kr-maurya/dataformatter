import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { base64ToBytes, imagePayload, sniffImageType } from "@/lib/base64/binary";

export function pngToBase64(input: string): TransformationResult {
  const payload = imagePayload(input);

  if (!payload) {
    return failResult(
      input,
      "There is no PNG data to convert. Paste a PNG as a data URI or raw Base64.",
      "UNKNOWN",
      "TEXT",
    );
  }

  const decoded = base64ToBytes(payload);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid PNG data.", "BASE64", "TEXT");
  }
  if (sniffImageType(decoded.bytes) !== "png") {
    return failResult(input, "Invalid PNG. The data does not contain a PNG image.", "BASE64", "TEXT");
  }

  return okResult(input, payload, "PNG_TO_BASE64", "BASE64", "PNG converted to Base64", "TEXT");
}