import { createToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/seo/og-card";

export const alt = "JSON to Schema — DataFormatter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createToolOgImage(alt, "JSON to Schema", "JSON Schema, Zod, Pydantic & OpenAPI from your samples");
}