import type { ReactNode } from "react";
import Link from "next/link";

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

export function Faq({ items }: { items: Array<{ q: string; a: string }> }) {
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