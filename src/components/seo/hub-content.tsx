import type { ReactNode } from "react";
import Link from "next/link";
import {
  BREADCRUMBS,
  HEADER_LINKS,
  SITE_NAME,
} from "@/lib/seo";
import {
  Breadcrumbs,
  BreadcrumbJsonLd,
  CompareTable,
  Faq,
  FaqJsonLd,
  LastReviewed,
} from "@/components/seo/content-blocks";
import type { FaqEntry } from "@/lib/seo";

interface HubContentProps {
  /** Canonical path registered in the SEO registry. */
  path: string;
  /** Unique hub introduction: when to use this category, how members differ. */
  intro: ReactNode;
  /** Member directory table headers (e.g. ["Tool", "What it does"]). */
  tableHeaders: ReadonlyArray<string>;
  /** Directory rows; first cell names the tool, later cells may link out. */
  tableRows: ReadonlyArray<ReadonlyArray<ReactNode>>;
  /** Accessible caption describing the directory table. */
  tableCaption: string;
  /** Hub-level FAQs, mirrored into FAQPage structured data. */
  faqs: ReadonlyArray<FaqEntry>;
}

/**
 * Server-rendered content sections appended BELOW a category hub's live
 * workspace: breadcrumb trail with structured data, unique introduction, a
 * member-tool directory that doubles as the hub's internal-linking vehicle,
 * hub-level FAQ and an E-E-A-T trust line. The workspace remains the primary
 * experience at the top of the viewport; this block gives crawlers (and
 * skimmers) the substantive, page-specific text the bare shells lacked.
 */
export function HubContent({
  path,
  intro,
  tableHeaders,
  tableRows,
  tableCaption,
  faqs,
}: HubContentProps) {
  return (
    <div className="border-t border-zinc-200 bg-zinc-50 pb-10 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
      <BreadcrumbJsonLd path={path} />
      <FaqJsonLd items={faqs} />
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6">
        {/* Mobile-friendly crawlable nav: the desktop rail lives in the app shell above. */}
        <nav aria-label="Tools" className="mb-4 flex flex-wrap gap-1.5 md:hidden">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                link.href === path
                  ? "border-violet-300 bg-violet-500/10 text-violet-700 dark:border-violet-500/40 dark:text-violet-300"
                  : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Breadcrumbs items={BREADCRUMBS[path] ?? [{ name: "Home", href: "/" }]} />

        {intro}

        <section className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Which tool should you use?
          </h2>
          <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
            Every member tool is one click away inside the workspace above. This directory maps
            each job to the right starting point.
          </p>
          <CompareTable headers={tableHeaders} rows={tableRows} caption={tableCaption} />
        </section>

        <Faq items={faqs} />

        <LastReviewed>
          Last reviewed August 2026 · {SITE_NAME} team — every tool on this site processes data
          locally in your browser.
        </LastReviewed>
      </div>
    </div>
  );
}
