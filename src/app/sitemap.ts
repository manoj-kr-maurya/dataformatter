import type { MetadataRoute } from "next";
import { SEO_PAGE_PATHS, SITE_URL } from "@/lib/seo";
import { BLOG_POSTS } from "@/lib/blog/registry";

/**
 * Derived from the central SEO registry (src/lib/seo.ts) and the blog registry
 * (src/lib/blog/registry.ts) so the sitemap can never drift from the pages'
 * canonical metadata. Share URLs (#/share/… fragments carrying user data) are
 * application state, not SEO pages — they are deliberately absent and must
 * never be added here.
 */
const PRIORITY: Record<string, number> = {
  "/": 1,
  "/blog": 0.8,
};

const BLOG_ARTICLE_PRIORITY = 0.6;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = SEO_PAGE_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "/" : path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: PRIORITY[path] ?? 0.9,
  }));

  const hub: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const articles: MetadataRoute.Sitemap = BLOG_POSTS.map((article) => ({
    url: `${SITE_URL}/blog/${article.slug}`,
    lastModified: new Date(`${article.updatedAt}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: BLOG_ARTICLE_PRIORITY,
  }));

  return [...pages, ...hub, ...articles];
}