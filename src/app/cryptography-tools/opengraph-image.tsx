import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "Cryptography Tools — SHA & MD5 hash generators";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "Cryptography Tools",
    "MD5, SHA-1, SHA-2 & SHA-3 digests computed locally, never uploaded.",
  );
}