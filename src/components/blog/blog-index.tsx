"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BLOG_CATEGORIES } from "@/lib/blog/types";
import type { BlogArticle } from "@/lib/blog/types";
import { formatBlogDate } from "@/lib/blog/registry";

const ALL = "All";

/** Client-side article grid with a category filter (no thin category pages). */
export function BlogIndex({ articles }: { articles: readonly BlogArticle[] }) {
  const [active, setActive] = useState(ALL);

  const counts = useMemo(() => {
    const map: Record<string, number> = { [ALL]: articles.length };
    for (const article of articles) {
      map[article.category] = (map[article.category] ?? 0) + 1;
    }
    return map;
  }, [articles]);

  const visible = active === ALL ? articles : articles.filter((a) => a.category === active);
  const filters = ([ALL, ...BLOG_CATEGORIES] as string[]).filter(
    (category) => (counts[category] ?? 0) > 0,
  );

  return (
    <section className="mt-6" aria-label="Articles">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {filters.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            aria-pressed={active === category}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active === category
                ? "bg-violet-600 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            {category} ({counts[category]})
          </button>
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3">
        {visible.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/blog/${article.slug}`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-violet-400 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-violet-500"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-semibold text-violet-700 dark:text-violet-300">
                  {article.category}
                </span>
                <span>{formatBlogDate(article.publishedAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{article.readingTime} min read</span>
              </div>
              <h2 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {article.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {article.excerpt}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}