import type { MetadataRoute } from "next";
import { SEO_PAGE_PATHS, SITE_URL } from "@/lib/seo";

/**
 * Derived from the central SEO registry (src/lib/seo.ts) so the sitemap can
 * never drift from the pages' canonical metadata. Share URLs (#/share/…
 * fragments carrying user data) are application state, not SEO pages — they
 * are deliberately absent and must never be added here.
 */
const PRIORITY: Record<string, number> = {
  "/": 1,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return SEO_PAGE_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "/" : path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: PRIORITY[path] ?? 0.9,
  }));
}
