import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "JSON to Java — generate POJO classes from JSON";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "JSON to Java",
    "Private fields, getters & setters from your payload — generated in your browser.",
  );
}