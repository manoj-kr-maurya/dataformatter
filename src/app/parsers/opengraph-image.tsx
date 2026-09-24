import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "Online Parsers — URL, JSON, XML & YAML";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "Parsers",
    "Break URLs, JSON, XML & YAML into readable structure locally.",
  );
}