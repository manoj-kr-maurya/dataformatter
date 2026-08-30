import { createToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/seo/og-card";

export const alt = "JSON Diff — DataFormatter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createToolOgImage(alt, "JSON Diff", "Compare two JSON documents side by side — locally");
}