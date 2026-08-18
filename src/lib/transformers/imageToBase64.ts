import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { base64ToBytes, sniffImageType, splitImageDataUri } from "@/lib/base64/binary";

export function imageToBase64(input: string): TransformationResult {
  const parts = splitImageDataUri(input.trim());
  const payload = parts ? parts.payload : input.trim();

  if (!payload) {
    return failResult(
      input,
      "There is no image data to convert. Paste an image as a data URI or raw Base64.",
      "UNKNOWN",
      "TEXT",
    );
  }

  const decoded = base64ToBytes(payload);
  if (!decoded.ok) {
    return failResult(
      input,
      decoded.error ?? "Invalid image data.",
      "BASE64",
      parts ? "BASE64" : "TEXT",
    );
  }

  if (!parts && sniffImageType(decoded.bytes) === null) {
    return failResult(input, "Invalid image. The data does not contain a PNG or JPG image.", "BASE64", "TEXT");
  }

  return okResult(
    input,
    payload,
    "IMAGE_TO_BASE64",
    "BASE64",
    "Image converted to Base64",
    "TEXT",
  );
}