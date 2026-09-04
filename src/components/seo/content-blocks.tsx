import type { ReactNode } from "react";
import Link from "next/link";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import type { FaqEntry, GeoDatum } from "@/lib/seo";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <div className="mt-2 space-y-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

/** Visible breadcrumb navigation — mirrors the BreadcrumbList structured data
 *  that ToolLandingPage/hub layouts inject, so markup always matches content. */
export function Breadcrumbs({
  items,
}: {
  items: ReadonlyArray<{ name: string; href: string }>;
}) {
  if (items.length <= 1) {
    return null;
  }
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">
                  ›
                </span>
              )}
              {last ? (
                <span aria-current="page" className="font-medium text-zinc-700 dark:text-zinc-300">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** BreadcrumbList structured data for the page's visible trail. */
export function BreadcrumbJsonLd({ path }: { path: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd(path)) }}
    />
  );
}

/** E-E-A-T trust line: a lightweight review date shown near the footer. */
export function LastReviewed({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 border-t border-zinc-200 pt-3 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
      {children}
    </p>
  );
}

/**
 * GEO (Generative Engine Optimization) answer block: a concise, answer-first
 * "About this tool" section that lets AI systems and featured-snippet engines
 * state what a tool is, who it is for and how DataFormatter's version differs.
 * Copy comes from the central {@link GEO_ANSWERS} registry — never templated.
 */
export function GeoBlock({ answers }: { answers: GeoDatum }) {
  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        About this tool
      </h2>
      <dl className="mt-2 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <div>
          <dt className="font-semibold text-zinc-800 dark:text-zinc-200">What is it?</dt>
          <dd>{answers.what}</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-800 dark:text-zinc-200">Who is it for?</dt>
          <dd>{answers.who}</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-800 dark:text-zinc-200">
            What makes DataFormatter&apos;s tool different?
          </dt>
          <dd>{answers.different}</dd>
        </div>
      </dl>
    </section>
  );
}

/** Numbered quick-start rendered directly under the live editor, using the
 *  tool's real UI labels so the copy matches what visitors can see. */
export function QuickStart({ steps }: { steps: ReadonlyArray<string> }) {
  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Quick start
      </h2>
      <ol className="mt-2 space-y-1.5">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-700 dark:text-violet-300"
            >
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Scenario cards giving each page its own angle — never templated across
 *  tools; every landing supplies its own real-world situations. */
export function UseCases({ cases }: { cases: ReadonlyArray<{ title: string; body: string }> }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cases.map((useCase) => (
        <div
          key={useCase.title}
          className="rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40"
        >
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{useCase.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{useCase.body}</p>
        </div>
      ))}
    </div>
  );
}

export interface TroubleshootingItem {
  /** The literal error message or symptom, as developers would search it. */
  error: string;
  cause: string;
  fix: string;
}

/** Error/troubleshooting pairs targeting long-tail searches where developers
 *  paste error strings verbatim into Google. */
export function Troubleshooting({ items }: { items: ReadonlyArray<TroubleshootingItem> }) {
  return (
    <div className="mt-3 space-y-3">
      {items.map((item) => (
        <div
          key={item.error}
          className="rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40"
        >
          <code className="block break-words font-mono text-xs font-semibold text-violet-700 dark:text-violet-300">
            {item.error}
          </code>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <strong className="text-zinc-700 dark:text-zinc-300">Why:</strong> {item.cause}
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <strong className="text-zinc-700 dark:text-zinc-300">Fix:</strong> {item.fix}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Small comparison table (e.g. "Formatter vs Validator vs Minifier"). Cells
 * accept ReactNode so rows can carry contextual internal links.
 */
export function CompareTable({
  headers,
  rows,
  caption,
}: {
  headers: ReadonlyArray<string>;
  rows: ReadonlyArray<ReadonlyArray<ReactNode>>;
  caption?: string;
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full border-collapse text-left text-sm">
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/60">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-3 py-2 align-top leading-relaxed text-zinc-600 dark:text-zinc-400"
                >
                  {cellIndex === 0 ? (
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{cell}</span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Short definition paragraphs tuned for featured-snippet extraction
 *  (40–55 words, definitional first sentence). */
export function Glossary({ terms }: { terms: ReadonlyArray<{ term: string; definition: string }> }) {
  return (
    <dl className="mt-3 space-y-3">
      {terms.map((entry) => (
        <div key={entry.term}>
          <dt className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{entry.term}</dt>
          <dd className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{entry.definition}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Practical tips referencing features that genuinely exist in the editor. */
export function ProTips({ tips }: { tips: ReadonlyArray<string> }) {
  return (
    <ul className="mt-3 space-y-2">
      {tips.map((tip) => (
        <li key={tip} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <span aria-hidden="true" className="mt-0.5 text-violet-500">
            ◆
          </span>
          {tip}
        </li>
      ))}
    </ul>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-zinc-600 dark:text-zinc-400">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** A small before/after example rendered as real, crawlable content. */
export function Example({
  inputLabel,
  input,
  outputLabel,
  output,
}: {
  inputLabel?: string;
  input: string;
  outputLabel?: string;
  output: string;
}) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {(
        [
          [inputLabel ?? "Input", input] as const,
          [outputLabel ?? "Output", output] as const,
        ]
      ).map(([label, value]) => (
        <figure key={label} className="min-w-0">
          <figcaption className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {label}
          </figcaption>
          <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200">
            <code>{value}</code>
          </pre>
        </figure>
      ))}
    </div>
  );
}

export function Faq({ items }: { items: ReadonlyArray<FaqEntry> }) {
  return (
    <Section title="Frequently asked questions">
      <div className="space-y-2">
        {items.map(({ q, a }) => (
          <details
            key={q}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/40"
          >
            <summary className="cursor-pointer text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {q}
            </summary>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/**
 * FAQPage structured data for the page's visible FAQ list — generated from
 * the exact same items so markup always matches on-page content.
 */
export function FaqJsonLd({ items }: { items: ReadonlyArray<FaqEntry> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd(items)) }}
    />
  );
}

export function Cta({ href = "/", label }: { href?: string; label: string }) {
  return (
    <p className="mt-8">
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
      >
        {label}
      </Link>
    </p>
  );
}
