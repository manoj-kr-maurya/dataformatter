import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "API Client — test REST requests from your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "API Client",
    "Build requests, import cURL, inspect responses — no proxy, no signup.",
  );
}