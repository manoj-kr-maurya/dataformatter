import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "String Functions — case, reverse, count & more";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "String Functions",
    "20+ text utilities — case, reverse, sort, count — all in one tab.",
  );
}