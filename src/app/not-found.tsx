import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FOOTER_LINKS } from "@/lib/seo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center px-4 py-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="DataFormatter home">
          <Logo className="h-10 w-10 rounded-lg" />
          <span className="text-base font-semibold tracking-tight">DataFormatter</span>
        </Link>
        <p className="mt-8 text-sm font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          404
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          The page you are looking for doesn&apos;t exist or has moved. All of our tools live a
          click away:
        </p>
        <nav aria-label="Popular tools" className="mt-6 flex flex-wrap gap-2">
          {FOOTER_LINKS.slice(1, 11).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-800 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </main>
      <footer className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <nav
          aria-label="All tools"
          className="mx-auto flex w-full max-w-3xl flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400"
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
      </footer>
    </div>
  );
}
