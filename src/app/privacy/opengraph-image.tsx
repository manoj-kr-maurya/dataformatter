import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "DataFormatter Privacy Policy — your data stays in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "Privacy Policy",
    "No analytics, no cookies, no accounts — everything runs locally.",
  );
}