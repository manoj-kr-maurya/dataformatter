import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "Encoding & Decoding Tools — Base64, URL, HTML & UTF-8";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "Encoding & Decoding",
    "Base64, Base32, Base58, URL, HTML & UTF-8 in one private tab.",
  );
}