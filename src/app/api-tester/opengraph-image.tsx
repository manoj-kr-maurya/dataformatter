import { createToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/seo/og-card";

export const alt = "API Tester — DataFormatter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createToolOgImage(alt, "API Tester", "Send & debug HTTP requests straight from your browser");
}