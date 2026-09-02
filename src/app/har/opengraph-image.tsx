import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "HAR Analyzer & Network Debugger";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "HAR Debugger",
    "Analyze failed, slow and duplicate network requests from a HAR capture — locally.",
  );
}