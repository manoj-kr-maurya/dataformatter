import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "JSON Converters — to XML, YAML, CSV, Java & Excel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "JSON Converters",
    "Java classes, XML, YAML, CSV, Excel & HTML from one JSON document.",
  );
}