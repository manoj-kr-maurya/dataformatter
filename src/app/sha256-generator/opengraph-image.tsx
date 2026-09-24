import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "SHA-256 Generator — compute a SHA-256 hash online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "SHA-256 Generator",
    "64-character digest for integrity checks — computed locally in your browser.",
  );
}