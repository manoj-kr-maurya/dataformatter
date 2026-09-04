import type { ReactNode } from "react";
import Link from "next/link";
import {
  BREADCRUMBS,
  GEO_ANSWERS,
  RELATED_LINKS,
  SEO_PAGES,
  SITE_NAME,
  serializeJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";
import type { FaqEntry } from "@/lib/seo";
import {
  Breadcrumbs,
  BreadcrumbJsonLd,
  Faq,
  FaqJsonLd,
  GeoBlock,
  LastReviewed,
} from "@/components/seo/content-blocks";

interface ToolSeoContentProps {
  /** Canonical path registered in the SEO registry. */
  path: string;
  /** One-to-two sentence definitional intro rendered under the H1. */
  summary: string;
  faqs: ReadonlyArray<FaqEntry>;
  /** Tool-specific content sections (rendered before the FAQ). */
  children: ReactNode;
}

/**
 * Server-rendered SEO/GEO content block for the full-page workbench tools
 * (/compiler, /api-client, /api-tester). These pages keep their existing
 * full-screen client workbench untouched; this block is appended below it and
 * supplies the crawlable, AI-readable structure they were missing: a visible
 * H1, a definition, a GEO answer block, content sections, FAQ (visible + JSON-LD),
 * related-tool links and a trust line. All URLs are existing routes only.
 */
export function ToolSeoContent({ path, summary, faqs, children }: ToolSeoContentProps) {
  const page = SEO_PAGES.get(path);
  if (!page) {
    throw new Error(`ToolSeoContent: unregistered path "${path}"`);
  }
  const related = RELATED_LINKS[path] ?? [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(softwareApplicationJsonLd(page)) }}
      />
      <BreadcrumbJsonLd path={path} />

      <div className="border-t border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
        <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          <Breadcrumbs items={BREADCRUMBS[path] ?? [{ name: "Home", href: "/" }]} />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {page.h1}
          </h1>
          <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {summary}
          </p>
          {GEO_ANSWERS[path] && <GeoBlock answers={GEO_ANSWERS[path]} />}

          {children}

          <FaqJsonLd items={faqs} />
          <Faq items={faqs} />

          {related.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Related tools
              </h2>
              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {related.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <LastReviewed>
            Last reviewed August 2026 · {SITE_NAME} team — this tool processes data locally in
            your browser.
          </LastReviewed>
        </main>
      </div>
    </>
  );
}
