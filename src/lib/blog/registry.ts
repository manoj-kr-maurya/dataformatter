import type { Metadata } from "next";
import { SEO_PAGES, SITE_NAME, SITE_URL } from "@/lib/seo";
import { BLOG_CATEGORIES, type BlogArticle, type BlogArticleInput, type BlogBlock } from "@/lib/blog/types";
import howJsonFormatterWorks from "@/content/blog/how-json-formatter-works";
import howJsonDiffWorks from "@/content/blog/how-json-diff-works";
import signedVsUnsignedIntegers from "@/content/blog/signed-vs-unsigned-integers";
import twosComplementExplained from "@/content/blog/twos-complement-explained";
import crc32Explained from "@/content/blog/crc32-explained";
import whatMakesAnApiChangeBreaking from "@/content/blog/what-makes-an-api-change-breaking";
import howToReadAStackTrace from "@/content/blog/how-to-read-a-stack-trace";
import httpHeadersDevelopersShouldKnow from "@/content/blog/http-headers-developers-should-know";
import openapi30vs31 from "@/content/blog/openapi-3-0-vs-3-1";
import runningCodeInTheBrowser from "@/content/blog/running-code-in-the-browser";
import howToDecodeAJwt from "@/content/blog/how-to-decode-a-jwt";
import base64VsBase64url from "@/content/blog/base64-vs-base64url";
import unexpectedTokenInJson from "@/content/blog/unexpected-token-in-json";

const ARTICLE_INPUTS: readonly BlogArticleInput[] = [
  howJsonFormatterWorks,
  howJsonDiffWorks,
  signedVsUnsignedIntegers,
  twosComplementExplained,
  crc32Explained,
  whatMakesAnApiChangeBreaking,
  howToReadAStackTrace,
  httpHeadersDevelopersShouldKnow,
  openapi30vs31,
  runningCodeInTheBrowser,
  howToDecodeAJwt,
  base64VsBase64url,
  unexpectedTokenInJson,
];

const WORDS_PER_MINUTE = 200;

function wordsIn(blocks: readonly BlogBlock[]): number {
  let words = 0;
  const count = (text: string): number => (text.trim() ? text.trim().split(/\s+/).length : 0);
  for (const block of blocks) {
    switch (block.type) {
      case "p":
      case "h2":
      case "h3":
      case "note":
        words += count(block.text);
        break;
      case "ul":
      case "ol":
        words += block.items.reduce((sum, item) => sum + count(item), 0);
        break;
      case "glossary":
        words += block.terms.reduce((sum, term) => sum + count(term.term) + count(term.definition), 0);
        break;
      case "table":
        words += block.rows.reduce(
          (sum, row) => sum + row.reduce((rowSum, cell) => rowSum + count(cell), 0),
          0,
        );
        break;
      case "faq":
        words += block.items.reduce((sum, item) => sum + count(item.q) + count(item.a), 0);
        break;
      case "example":
        words += count(block.input) + count(block.output);
        break;
      case "code":
        break;
    }
  }
  return words;
}

function defineArticle(input: BlogArticleInput): BlogArticle {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new Error(`Blog article slug "${input.slug}" must be lowercase kebab-case.`);
  }
  if (input.title.length < 10 || input.title.length + ` | ${SITE_NAME}`.length > 100) {
    throw new Error(`Blog article "${input.slug}" has an out-of-range title length (${input.title.length}).`);
  }
  if (input.description.length < 50 || input.description.length > 400) {
    throw new Error(`Blog article "${input.slug}" has an out-of-range description length (${input.description.length}).`);
  }
  if (!(BLOG_CATEGORIES as readonly string[]).includes(input.category)) {
    throw new Error(`Blog article "${input.slug}" has an invalid category "${input.category}".`);
  }
  if (!input.excerpt.trim() || input.excerpt.trim().length < 20) {
    throw new Error(`Blog article "${input.slug}" needs a longer excerpt.`);
  }
  const published = Date.parse(input.publishedAt);
  if (!Number.isFinite(published)) {
    throw new Error(`Blog article "${input.slug}" has an invalid publishedAt "${input.publishedAt}".`);
  }
  const updated = input.updatedAt ? Date.parse(input.updatedAt) : published;
  if (!Number.isFinite(updated)) {
    throw new Error(`Blog article "${input.slug}" has an invalid updatedAt "${input.updatedAt}".`);
  }
  if (updated < published) {
    throw new Error(`Blog article "${input.slug}" has updatedAt before publishedAt.`);
  }
  for (const toolPath of input.relatedToolPaths) {
    if (!SEO_PAGES.has(toolPath)) {
      throw new Error(`Blog article "${input.slug}" links to unregistered tool path "${toolPath}".`);
    }
  }
  const minutes = Math.max(1, Math.round(wordsIn(input.blocks) / WORDS_PER_MINUTE));
  return {
    ...input,
    updatedAt: input.updatedAt ?? input.publishedAt,
    readingTime: minutes,
  };
}

export const BLOG_POSTS: readonly BlogArticle[] = ARTICLE_INPUTS.map(defineArticle);

export const BLOG_BY_SLUG: ReadonlyMap<string, BlogArticle> = new Map(
  BLOG_POSTS.map((article) => [article.slug, article]),
);

// Cross-article references validate against the complete registry.
for (const article of BLOG_POSTS) {
  for (const slug of article.relatedSlugs) {
    if (!BLOG_BY_SLUG.has(slug)) {
      throw new Error(
        `Blog article "${article.slug}" references unknown related article "${slug}".`,
      );
    }
    if (slug === article.slug) {
      throw new Error(`Blog article "${article.slug}" lists itself as a related article.`);
    }
  }
}

/** Every indexable blog URL, starting with the hub itself. */
export const BLOG_PATHS: readonly string[] = [
  "/blog",
  ...BLOG_POSTS.map((article) => `/blog/${article.slug}`),
];

export function getBlogPost(slug: string): BlogArticle | undefined {
  return BLOG_BY_SLUG.get(slug);
}

export function getRelatedArticles(article: BlogArticle): BlogArticle[] {
  return article.relatedSlugs
    .map((slug) => BLOG_BY_SLUG.get(slug))
    .filter((item): item is BlogArticle => item !== undefined);
}

export function formatBlogDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function blogCategoryCounts(): Record<BlogArticle["category"], number> {
  const counts = {} as Record<BlogArticle["category"], number>;
  for (const article of BLOG_POSTS) {
    counts[article.category] = (counts[article.category] ?? 0) + 1;
  }
  return counts;
}

/** RSS feed for the blog — discoverable from both the hub and every article. */
const BLOG_FEED_PATH = "/blog/rss.xml";

/** Static metadata for the hub (/blog) or a single article. Mirrors
 *  {@link buildMetadata} for tool pages: self-canonical, never sets robots. */
export function buildBlogMetadata(slug?: string): Metadata {
  if (!slug) {
    const title = "Blog – Engineering Deep-Dives from DataFormatter";
    const description =
      "How DataFormatter's developer tools actually work under the hood: JSON formatting and diffing, integer math and CRC-32, API compatibility, stack traces, HTTP headers, OpenAPI and in-browser compilation.";
    return {
      title,
      description,
      alternates: { canonical: "/blog", types: { "application/rss+xml": BLOG_FEED_PATH } },
      openGraph: {
        title: `${title} | ${SITE_NAME}`,
        description,
        url: "/blog",
        siteName: SITE_NAME,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | ${SITE_NAME}`,
        description,
      },
    };
  }
  const article = getBlogPost(slug);
  if (!article) {
    throw new Error(`buildBlogMetadata: unknown article "${slug}"`);
  }
  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: `/blog/${article.slug}`,
      types: { "application/rss+xml": BLOG_FEED_PATH },
    },
    openGraph: {
      title: `${article.title} | ${SITE_NAME}`,
      description: article.description,
      url: `/blog/${article.slug}`,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [SITE_NAME],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | ${SITE_NAME}`,
      description: article.description,
    },
  };
}

/** BreadcrumbList structured data for blog pages: Home → Blog (→ article). */
export function blogBreadcrumbJsonLd(article?: BlogArticle) {
  const items: ReadonlyArray<{ name: string; href: string }> = article
    ? [
        { name: "Home", href: "/" },
        { name: "Blog", href: "/blog" },
        { name: article.title, href: `/blog/${article.slug}` },
      ]
    : [
        { name: "Home", href: "/" },
        { name: "Blog", href: "/blog" },
      ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

/** BlogPosting structured data for a single article. */
export function blogPostingJsonLd(article: BlogArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}/blog/${article.slug}`,
    mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    keywords: article.category,
    articleSection: article.category,
  };
}

/** FAQPage structured data collected from an article's FAQ blocks. */
export function blogFaqJsonLd(article: BlogArticle) {
  const items = article.blocks.flatMap((block) => (block.type === "faq" ? block.items : []));
  if (items.length === 0) {
    return null;
  }
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** ItemList structured data for the /blog hub, mirroring the visible cards. */
export function blogItemListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "DataFormatter engineering articles",
    itemListElement: BLOG_POSTS.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: article.title,
      url: `${SITE_URL}/blog/${article.slug}`,
      description: article.excerpt,
    })),
  };
}