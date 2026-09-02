import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "Production Error Workspace & Incident Debugging Tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "Error Workspace",
    "Correlate a stack trace, logs and the failing request into one prioritized report.",
  );
}