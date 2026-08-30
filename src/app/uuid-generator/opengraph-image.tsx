import { createToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/seo/og-card";

export const alt = "UUID Generator — DataFormatter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createToolOgImage(alt, "UUID Generator", "Random RFC 4122 v4 identifiers — generated in your browser");
}