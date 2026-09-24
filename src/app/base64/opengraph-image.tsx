import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "Base64 Tools — images, JSON, hex & binary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "Base64 Tools",
    "Images, JSON, XML, CSV, hex & binary — converted in your browser.",
  );
}