import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FOOTER_LINKS, HEADER_LINKS, SITE_NAME } from "@/lib/seo";
import { LastReviewed } from "@/components/seo/content-blocks";

interface BlogShellProps {
  /** Route of the current page so the header navigation can mark it active. */
  activeHref?: string;
  children: ReactNode;
}

/**
 * Shared shell for the blog — brand header with crawlable nav, a centered
 * article column, and the standard footer. Mirrors ToolLandingPage so the
 * blog feels and crawls like the rest of the site.
 */
export function BlogShell({ activeHref, children }: BlogShellProps) {
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
              aria-current={link.href === activeHref ? "page" : undefined}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                link.href === activeHref
                  ? "bg-violet-500/15 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-3xl">
          <LastReviewed>
            Last reviewed August 2026 · {SITE_NAME} team — every tool on this site processes data
            locally in your browser.
          </LastReviewed>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
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