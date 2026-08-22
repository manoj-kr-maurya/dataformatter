import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FOOTER_LINKS, HEADER_LINKS, RELATED_LINKS, SEO_PAGES, SITE_NAME } from "@/lib/seo";

interface ToolLandingPageProps {
  /** Canonical path registered in the SEO registry. */
  path: string;
  /** One-to-two sentence intro rendered directly under the H1. */
  summary: string;
  /** The embedded tool experience plus tool-specific content sections. */
  children: ReactNode;
}

/**
 * Shared layout for tool landing pages: brand header with crawlable nav,
 * a single H1, the live tool at the top of the page (primary experience),
 * tool-specific content sections, related-tool links and a full footer.
 * Everything renders server-side so all content is in the initial HTML.
 */
export function ToolLandingPage({ path, summary, children }: ToolLandingPageProps) {
  const page = SEO_PAGES.get(path);
  if (!page) {
    throw new Error(`ToolLandingPage: unregistered path "${path}"`);
  }
  const related = RELATED_LINKS[path] ?? [];

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/90 px-4 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
          <Logo className="h-8 w-8 rounded-lg" />
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {SITE_NAME}
          </span>
        </Link>
        <nav aria-label="Tools" className="hidden gap-1 md:flex">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === path ? "page" : undefined}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                link.href === path
                  ? "bg-violet-500/15 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {page.h1}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {summary}
        </p>
        {children}

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
      </main>

      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {SITE_NAME} — free online developer data tools that run entirely in your browser. Your
            data stays private: nothing you paste is ever uploaded to a server.
          </p>
          <nav
            aria-label="All tools"
            className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
