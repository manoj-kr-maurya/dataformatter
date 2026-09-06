import Link from "next/link";
import { BlogShell } from "@/components/blog/blog-shell";
import { ArticleBlocks, slugifyHeading } from "@/components/blog/article-renderer";
import { Breadcrumbs, LastReviewed } from "@/components/seo/content-blocks";
import { SEO_PAGES, SITE_NAME, serializeJsonLd } from "@/lib/seo";
import {
  blogBreadcrumbJsonLd,
  blogFaqJsonLd,
  blogPostingJsonLd,
  formatBlogDate,
  getRelatedArticles,
} from "@/lib/blog/registry";
import type { BlogArticle } from "@/lib/blog/types";

/** Answer-first GEO summary for an article — a compact What/Who/Different box. */
function GeoSummary({ article }: { article: BlogArticle }) {
  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        In brief
      </h2>
      <dl className="mt-2 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <div>
          <dt className="font-semibold text-zinc-800 dark:text-zinc-200">What is it?</dt>
          <dd>{article.geo.what}</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-800 dark:text-zinc-200">Who is it for?</dt>
          <dd>{article.geo.who}</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-800 dark:text-zinc-200">
            How DataFormatter&apos;s tool is different
          </dt>
          <dd>{article.geo.different}</dd>
        </div>
      </dl>
    </section>
  );
}

export function BlogArticlePage({ article }: { article: BlogArticle }) {
  const related = getRelatedArticles(article);
  const headings = article.blocks.filter((block) => block.type === "h2");
  const faqJson = blogFaqJsonLd(article);

  return (
    <BlogShell>
      {/* BlogPosting + BreadcrumbList structured data for the article. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPostingJsonLd(article)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogBreadcrumbJsonLd(article)) }}
      />
      {faqJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJson) }}
        />
      )}

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: article.title, href: `/blog/${article.slug}` },
        ]}
      />

      <article>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 font-semibold text-violet-700 dark:text-violet-300">
            {article.category}
          </span>
          <span>{formatBlogDate(article.publishedAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readingTime} min read</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {article.h1}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {article.excerpt}
        </p>

        <GeoSummary article={article} />

        {headings.length > 1 && (
          <nav
            aria-label="On this page"
            className="mt-4 rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              On this page
            </p>
            <ul className="mt-1.5 space-y-1">
              {headings.map((heading) => (
                <li key={heading.text}>
                  <a
                    href={`#${slugifyHeading(heading.text)}`}
                    className="text-sm text-zinc-600 hover:text-violet-700 hover:underline dark:text-zinc-400 dark:hover:text-violet-300"
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-6">
          <ArticleBlocks blocks={article.blocks} />
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Related articles
          </h2>
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/blog/${item.slug}`}
                  className="block rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {article.relatedToolPaths.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Try it yourself
          </h2>
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {article.relatedToolPaths.map((path) => {
              const page = SEO_PAGES.get(path);
              if (!page) {
                throw new Error(`Blog article "${article.slug}" links to unknown tool path "${path}"`);
              }
              return (
                <li key={path}>
                  <Link
                    href={path}
                    className="block rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
                  >
                    {page.h1}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <LastReviewed>
        Last reviewed {formatBlogDate(article.updatedAt)} · {SITE_NAME} team — this article
        describes how the DataFormatter tool actually works, verified against its source.
      </LastReviewed>
    </BlogShell>
  );
}