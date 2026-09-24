import type { MetadataRoute } from "next";
import { PAGE_LAST_MODIFIED, SEO_PAGE_PATHS, SITE_URL } from "@/lib/seo";
import { BLOG_POSTS } from "@/lib/blog/registry";

/**
 * Derived from the central SEO registry (src/lib/seo.ts) and the blog registry
 * (src/lib/blog/registry.ts) so the sitemap can never drift from the pages'
 * canonical metadata. Share URLs (#/share/… fragments carrying user data) are
 * application state, not SEO pages — they are deliberately absent and must
 * never be added here.
 *
 * Each <lastmod> is a real, content-accurate date: pages use PAGE_LAST_MODIFIED
 * (the last commit that touched the page, registered in src/lib/seo.ts), and
 * blog articles use their `updatedAt`. chagefrequency and priority are omitted
 * deliberately — Google has deprecated them and crawlers ignore both.
 */
function lastModifiedFor(path: string): Date {
  const date = PAGE_LAST_MODIFIED[path];
  if (!date) {
    throw new Error(`sitemap: no last-modified date registered for "${path}"`);
  }
  return new Date(`${date}T00:00:00Z`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = SEO_PAGE_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "/" : path}`,
    lastModified: lastModifiedFor(path),
  }));

  // The blog hub changes whenever any article's content changes, so its
  // lastmod is the newest article update — never the build date.
  const blogHubLastModified = BLOG_POSTS.reduce<string>(
    (latest, article) => (article.updatedAt > latest ? article.updatedAt : latest),
    BLOG_POSTS[0]?.updatedAt ?? "2026-01-01",
  );

  const hub: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(`${blogHubLastModified}T00:00:00Z`),
    },
  ];

  const articles: MetadataRoute.Sitemap = BLOG_POSTS.map((article) => ({
    url: `${SITE_URL}/blog/${article.slug}`,
    lastModified: new Date(`${article.updatedAt}T00:00:00Z`),
  }));

  return [...pages, ...hub, ...articles];
}