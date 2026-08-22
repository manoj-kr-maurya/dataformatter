import type { ReactNode } from "react";
import Link from "next/link";
import { faqJsonLd, serializeJsonLd } from "@/lib/seo";
import type { FaqEntry } from "@/lib/seo";

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
