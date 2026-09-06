import type { FaqEntry, GeoDatum } from "@/lib/seo";

/**
 * Blog content model for the DataFormatter engineering blog.
 *
 * Articles are plain, serializable data objects (no JSX, no components) so the
 * registry and unit tests can read them without a renderer, and a generic
 * block renderer maps every block type to a crawlable component at request
 * time. This keeps the blog dependency-free and statically renderable.
 */

export const BLOG_CATEGORIES = [
  "Data Formats",
  "API Engineering",
  "Debugging",
  "Algorithms & Computer Science",
  "Browser Engineering",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; label?: string; code: string }
  | { type: "example"; inputLabel?: string; input: string; outputLabel?: string; output: string }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
  | { type: "glossary"; terms: Array<{ term: string; definition: string }> }
  | { type: "note"; title: string; text: string }
  | { type: "faq"; items: FaqEntry[] };

/**
 * Everything an author provides for one article. `readingTime` and
 * `updatedAt` are derived (word count / publishing date) — see
 * {@link defineArticle} in the registry.
 */
export interface BlogArticleInput {
  /** URL slug of the article ("two-s-complement-explained"). */
  slug: string;
  /** Unique <title>. The layout template appends " | DataFormatter". */
  title: string;
  /** Unique meta description. */
  description: string;
  /** The single <h1> rendered on the article page. */
  h1: string;
  category: BlogCategory;
  /** Short card copy. */
  excerpt: string;
  /** Answer-first GEO answers for the article's core question. */
  geo: GeoDatum;
  /** ISO-8601 date (YYYY-MM-DD). */
  publishedAt: string;
  /** ISO-8601 date; defaults to publishedAt when omitted. */
  updatedAt?: string;
  /** Canonical tool routes referenced by the article (must exist in SEO_PAGES). */
  relatedToolPaths: string[];
  /** Slugs of related articles (must exist in the registry). */
  relatedSlugs: string[];
  blocks: BlogBlock[];
}

/** A fully assembled, validated article as exposed by the registry. */
export interface BlogArticle extends BlogArticleInput {
  updatedAt: string;
  readingTime: number;
}