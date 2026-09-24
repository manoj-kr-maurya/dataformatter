import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "MD5 Generator — compute an MD5 checksum online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "MD5 Generator",
    "32-character digest of any text — computed locally, never uploaded.",
  );
}