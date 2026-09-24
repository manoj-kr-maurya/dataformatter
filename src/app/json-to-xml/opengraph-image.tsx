import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "JSON to XML converter — generate well-formed XML from JSON";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "JSON to XML",
    "Keys become elements, arrays repeat — converting locally, nothing uploaded.",
  );
}