import { createToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/seo/og-card";

export const alt = "Stack Trace Reader — DataFormatter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createToolOgImage(alt, "Stack Trace Reader", "Parse Java, JS, Python & Go traces in one click");
}