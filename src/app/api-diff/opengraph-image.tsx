import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "API Breaking Change Detector & API Diff Tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "API Diff",
    "Find breaking changes between two API versions before you ship — locally.",
  );
}