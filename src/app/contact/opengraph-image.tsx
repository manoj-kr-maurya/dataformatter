import { createToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/seo/og-card";

export const alt = "Contact DataFormatter — report bugs and request features";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createToolOgImage(alt, "Contact DataFormatter", "Bugs, ideas and feedback — straight to the issue tracker");
}
