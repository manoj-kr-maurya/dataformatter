import { createToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/seo/og-card";

export const alt = "OpenAPI Viewer & Workbench — DataFormatter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createToolOgImage(
    alt,
    "OpenAPI Viewer & Workbench",
    "Explore, validate & generate code from OpenAPI 3.0/3.1 documents",
  );
}