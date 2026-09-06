import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BLOG_POSTS } from "@/lib/blog/registry";

export const dynamic = "force-static";

const CHANNEL_TITLE = "Engineering Behind DataFormatter";
const CHANNEL_DESCRIPTION =
  "Source-accurate write-ups of how the DataFormatter developer tools actually work under the hood.";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc2822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

function buildRss(): string {
  const items = BLOG_POSTS.map((article) => {
    const url = `${SITE_URL}/blog/${article.slug}`;
    return [
      "    <item>",
      `      <title>${escapeXml(article.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${rfc2822(article.publishedAt)}</pubDate>`,
      `      <dc:creator>${escapeXml(SITE_NAME)}</dc:creator>`,
      `      <category>${escapeXml(article.category)}</category>`,
      `      <description>${escapeXml(article.excerpt)}</description>`,
      "    </item>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${escapeXml(CHANNEL_TITLE)}</title>`,
    `    <link>${SITE_URL}/blog</link>`,
    `    <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>`,
    "    <language>en-us</language>",
    `    <lastBuildDate>${rfc2822(BLOG_POSTS[0].updatedAt)}</lastBuildDate>`,
    "    <ttl>60</ttl>",
    items.join("\n"),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

export function GET() {
  return new Response(buildRss(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}