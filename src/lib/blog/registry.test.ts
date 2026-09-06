import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { GET as rssGet } from "@/app/blog/rss.xml/route";
import { FOOTER_LINKS, SITE_NAME, SEO_PAGES } from "@/lib/seo";
import { BLOG_CATEGORIES } from "@/lib/blog/types";
import type { BlogCategory } from "@/lib/blog/types";
import {
  BLOG_BY_SLUG,
  BLOG_PATHS,
  BLOG_POSTS,
  blogBreadcrumbJsonLd,
  blogCategoryCounts,
  blogFaqJsonLd,
  blogItemListJsonLd,
  blogPostingJsonLd,
  buildBlogMetadata,
  formatBlogDate,
  getBlogPost,
} from "@/lib/blog/registry";

const posts = [...BLOG_POSTS];

describe("blog registry", () => {
  it("registers at least one article per category and keeps slugs unique", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(posts.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
    for (const category of BLOG_CATEGORIES) {
      expect(posts.some((p) => p.category === category), category).toBe(true);
    }
    for (const post of posts) {
      expect(BLOG_CATEGORIES.includes(post.category as BlogCategory)).toBe(true);
    }
  });

  it("exposes the hub first and every article as a lowercase blog path", () => {
    expect(BLOG_PATHS[0]).toBe("/blog");
    expect(BLOG_PATHS).toHaveLength(posts.length + 1);
    for (const post of posts) {
      expect(BLOG_PATHS).toContain(`/blog/${post.slug}`);
    }
  });

  it("keeps every article unique against the rest of the site and itself", () => {
    const titles = posts.map((p) => p.title);
    const descriptions = posts.map((p) => p.description);
    const h1s = posts.map((p) => p.h1);
    expect(new Set(titles).size).toBe(posts.length);
    expect(new Set(descriptions).size).toBe(posts.length);
    expect(new Set(h1s).size).toBe(posts.length);

    const existingTitles = new Set(Array.from(SEO_PAGES.values()).map((p) => p.title));
    const existingDescriptions = new Set(Array.from(SEO_PAGES.values()).map((p) => p.description));
    for (const post of posts) {
      expect(existingTitles.has(post.title), post.slug).toBe(false);
      expect(existingDescriptions.has(post.description), post.slug).toBe(false);
      expect(existingTitles.has(post.h1), post.slug).toBe(false);
    }
  });

  it("has sane copy lengths, valid dates and a computed reading time", () => {
    for (const post of posts) {
      expect(post.title.length + ` | ${SITE_NAME}`.length, post.slug).toBeLessThanOrEqual(100);
      expect(post.title.length, post.slug).toBeGreaterThan(10);
      expect(post.description.length, post.slug).toBeGreaterThanOrEqual(50);
      expect(post.description.length, post.slug).toBeLessThanOrEqual(400);
      expect(post.excerpt.trim().length, post.slug).toBeGreaterThanOrEqual(20);
      expect(post.geo.what.length, post.slug).toBeGreaterThan(40);
      expect(post.geo.who.length, post.slug).toBeGreaterThan(20);
      expect(post.geo.different.length, post.slug).toBeGreaterThan(20);

      const published = Date.parse(`${post.publishedAt}T00:00:00Z`);
      const updated = Date.parse(`${post.updatedAt}T00:00:00Z`);
      expect(Number.isFinite(published), post.slug).toBe(true);
      expect(Number.isFinite(updated), post.slug).toBe(true);
      expect(updated >= published, post.slug).toBe(true);
      expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(post.readingTime, post.slug).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(post.readingTime), post.slug).toBe(true);
      expect(post.blocks.length, post.slug).toBeGreaterThan(0);
      // Every article answers its core question — required for FAQ structured data.
      expect(post.blocks.some((block) => block.type === "faq"), post.slug).toBe(true);
    }
  });

  it("resolves every related article and links only to registered tools", () => {
    for (const post of posts) {
      for (const slug of post.relatedSlugs) {
        expect(BLOG_BY_SLUG.has(slug), `${post.slug} → ${slug}`).toBe(true);
        expect(slug, post.slug).not.toBe(post.slug);
      }
      for (const path of post.relatedToolPaths) {
        expect(SEO_PAGES.has(path), `${post.slug} tool link ${path}`).toBe(true);
      }
    }
  });

  it("looks up posts by slug and derives accurate category counts", () => {
    expect(getBlogPost("how-json-formatter-works")?.slug).toBe("how-json-formatter-works");
    expect(getBlogPost("does-not-exist")).toBeUndefined();
    const counts = blogCategoryCounts();
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(posts.length);
    for (const post of posts) {
      expect(counts[post.category]).toBeGreaterThanOrEqual(1);
    }
  });

  it("formats dates consistently in the visible blog style", () => {
    expect(formatBlogDate("2026-07-21")).toBe("Jul 21, 2026");
  });
});

describe("blog metadata and structured data", () => {
  it("builds a self-canonical hub metadata object without robots overrides", () => {
    const meta = buildBlogMetadata();
    expect(meta.alternates?.canonical).toBe("/blog");
    expect(meta.alternates?.types?.["application/rss+xml"]).toBe("/blog/rss.xml");
    expect(meta.title).toContain("Engineering");
    expect(meta.description).toBeTruthy();
    expect((meta.openGraph as { url: string }).url).toBe("/blog");
    expect((meta.openGraph as { type: string }).type).toBe("website");
    expect(meta).not.toHaveProperty("robots");
  });

  it("builds complete, self-canonical metadata per article", () => {
    for (const post of posts) {
      const meta = buildBlogMetadata(post.slug);
      expect(meta.alternates?.canonical).toBe(`/blog/${post.slug}`);
      expect(meta.alternates?.types?.["application/rss+xml"]).toBe("/blog/rss.xml");
      expect(meta.title).toBe(post.title);
      expect(meta.description).toBe(post.description);
      const og = meta.openGraph as {
        url: string;
        type: string;
        publishedTime: string;
        modifiedTime: string;
        authors: string[];
      };
      expect(og.url).toBe(`/blog/${post.slug}`);
      expect(og.type).toBe("article");
      expect(og.publishedTime).toBe(post.publishedAt);
      expect(og.modifiedTime).toBe(post.updatedAt);
      expect(og.authors).toContain(SITE_NAME);
      expect(meta).not.toHaveProperty("robots");
    }
  });

  it("rejects unknown article slugs", () => {
    expect(() => buildBlogMetadata("nope")).toThrow();
  });

  it("builds BreadcrumbList markup with absolute URLs and 1-based positions", () => {
    const post = posts[0];
    const trail = blogBreadcrumbJsonLd(post);
    expect(trail["@type"]).toBe("BreadcrumbList");
    expect(trail.itemListElement).toHaveLength(3);
    expect(trail.itemListElement[0].item).toBe("https://www.dataformatter.in/");
    expect(trail.itemListElement[1].item).toBe("https://www.dataformatter.in/blog");
    expect(trail.itemListElement[2].item).toBe(`https://www.dataformatter.in/blog/${post.slug}`);
    trail.itemListElement.forEach((entry: { position: number }, i: number) => {
      expect(entry.position).toBe(i + 1);
    });

    const hubTrail = blogBreadcrumbJsonLd();
    expect(hubTrail.itemListElement).toHaveLength(2);
    expect(hubTrail.itemListElement[1].name).toBe("Blog");
  });

  it("marks every article up as a BlogPosting by the site organization", () => {
    for (const post of posts) {
      const json = blogPostingJsonLd(post);
      expect(json["@type"]).toBe("BlogPosting");
      expect(json.headline).toBe(post.title);
      expect(json.datePublished).toBe(post.publishedAt);
      expect(json.dateModified).toBe(post.updatedAt);
      expect(json.url).toBe(`https://www.dataformatter.in/blog/${post.slug}`);
      expect(json.author).toEqual({ "@type": "Organization", name: SITE_NAME, url: "https://www.dataformatter.in" });
      expect(json.publisher["@type"]).toBe("Organization");
    }
  });

  it("collects FAQPage data from the visible FAQ blocks", () => {
    for (const post of posts) {
      const items = post.blocks.flatMap((block) => (block.type === "faq" ? block.items : []));
      expect(items.length, post.slug).toBeGreaterThan(0);
      const json = blogFaqJsonLd(post);
      expect(json).not.toBeNull();
      expect(json!["@type"]).toBe("FAQPage");
      expect(json!.mainEntity).toHaveLength(items.length);
      expect(json!.mainEntity[0].name).toBe(items[0].q);
      expect(json!.mainEntity[0].acceptedAnswer.text).toBe(items[0].a);
    }
  });

  it("lists every article in registry order for the hub ItemList", () => {
    const json = blogItemListJsonLd();
    expect(json["@type"]).toBe("ItemList");
    expect(json.itemListElement).toHaveLength(posts.length);
    posts.forEach((post, index) => {
      const entry = json.itemListElement[index];
      expect(entry.position).toBe(index + 1);
      expect(entry.url).toBe(`https://www.dataformatter.in/blog/${post.slug}`);
      expect(entry.name).toBe(post.title);
    });
  });
});



describe("blog sitemap + navigation integration", () => {
  it("lists the blog hub and every article in the site sitemap", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://www.dataformatter.in/blog");
    for (const post of posts) {
      const entry = entries.find((e) => e.url === `https://www.dataformatter.in/blog/${post.slug}`);
      expect(entry, post.slug).toBeDefined();
      const lastModified = new Date(`${post.updatedAt}T00:00:00Z`);
      expect((entry!.lastModified as Date).toISOString()).toBe(lastModified.toISOString());
    }
  });

  it("keeps the blog reachable from the shared footer on every page", () => {
    expect(FOOTER_LINKS).toContainEqual({ href: "/blog", label: "Blog" });
  });
});

describe("blog RSS feed", () => {
  it("serves a valid RSS 2.0 document listing every article", async () => {
    const res = rssGet();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^application\/rss\+xml/);

    const body = await res.text();
    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain("</rss>");
    expect(body).toContain("<channel>");
    expect(body).toContain("</channel>");
    expect(body).toContain(`<link>https://www.dataformatter.in/blog</link>`);
    expect(body).toContain(`<dc:creator>DataFormatter</dc:creator>`);

    for (const post of posts) {
      const url = `https://www.dataformatter.in/blog/${post.slug}`;
      expect(body, post.slug).toContain(`<link>${url}</link>`);
      expect(body, post.slug).toContain(`<guid isPermaLink="true">${url}</guid>`);
      expect(body, post.slug).toContain(`<pubDate>`);
      expect(body, post.slug).toContain(
        `<category>${post.category.replace(/&/g, "&amp;")}</category>`,
      );
    }
  });

  it("escapes every ampersand in article copy so the XML stays well-formed", async () => {
    const body = await rssGet().text();
    // Every "&" in the document must start a known entity (amp/lt/gt/quot/apos).
    const bare = body.match(/&(?!(amp|lt|gt|quot|apos);)/g);
    expect(bare).toBeNull();
  });
});