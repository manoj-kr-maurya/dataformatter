import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "Online Dart, JavaScript & TypeScript Compiler";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "Online Compiler",
    "Run Dart, JavaScript & TypeScript in your browser via WebAssembly.",
  );
}