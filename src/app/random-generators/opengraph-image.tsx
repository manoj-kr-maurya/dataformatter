import { createToolOgImage } from "@/components/seo/og-card";

export const alt = "Random Generators — UUID, IP, numbers & test data";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return createToolOgImage(
    alt,
    "Random Generators",
    "UUIDs, IPs, primes, dates, names & test data — generated on-device.",
  );
}