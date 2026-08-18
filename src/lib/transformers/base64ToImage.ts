import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { base64ToBytes, sniffImageType, splitImageDataUri } from "@/lib/base64/binary";

export function base64ToImage(input: string): TransformationResult {
  const parts = splitImageDataUri(input.trim());
  const payload = parts ? parts.payload : input.trim();

  const decoded = base64ToBytes(payload);
  if (!decoded.ok) {
    return failResult(input, decoded.error ?? "Invalid Base64.", "BASE64", "BASE64");
  }

  let mime = parts && parts.mime.startsWith("image/") ? parts.mime : "";
  if (!mime) {
    const type = sniffImageType(decoded.bytes);
    mime = type === "jpeg" ? "image/jpeg" : "image/png";
  }

  return okResult(
    input,
    `data:${mime};base64,${payload}`,
    "BASE64_TO_IMAGE",
    "TEXT",
    "Base64 converted to an image data URI",
    "BASE64",
  );
}