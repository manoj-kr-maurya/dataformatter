import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { base64ToBytes, imagePayload, sniffImageType } from "@/lib/base64/binary";

export function jpgToBase64(input: string): TransformationResult {
  const payload = imagePayload(input);

  if (!payload) {
    return failResult(
      input,
      "There is no JPG data to convert. Paste a JPG as a data URI or raw Base64.",
      "UNKNOWN",
      "TEXT",
    );
  }

  const decoded = base64ToBytes(payload);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid JPG data.", "BASE64", "TEXT");
  }
  if (sniffImageType(decoded.bytes) !== "jpeg") {
    return failResult(input, "Invalid JPG. The data does not contain a JPG image.", "BASE64", "TEXT");
  }

  return okResult(input, payload, "JPG_TO_BASE64", "BASE64", "JPG converted to Base64", "TEXT");
}