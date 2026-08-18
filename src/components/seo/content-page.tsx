import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const TOOL_LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "DevTools Home" },
  { href: "/encode-decode", label: "Encoding Tools" },
  { href: "/base64", label: "Base64 Tools" },
  { href: "/json-converter", label: "JSON Converters" },
  { href: "/parsers", label: "Parsers" },
  { href: "/random-generators", label: "Random Tools" },
  { href: "/string-functions", label: "String Functions" },
  { href: "/cryptography-tools", label: "Cryptography" },
  { href: "/json-formatter", label: "JSON Formatter" },
  { href: "/base64-encoder", label: "Base64 Encoder" },
  { href: "/base64-decoder", label: "Base64 Decoder" },
  { href: "/jwt-decoder", label: "JWT Decoder" },
];

interface ContentPageProps {
  pageTitle: string;
  summary: string;
  children: ReactNode;
}

export function ContentPage({ pageTitle, summary, children }: ContentPageProps) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/90 px-4 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <Link href="/" className="flex items-center gap-2.5" aria-label="DataFormatter home">
          <Logo className="h-8 w-8 rounded-lg" />
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            DevTools
          </span>
        </Link>
        <nav aria-label="Tools" className="hidden gap-1 sm:flex">
          {TOOL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {pageTitle}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {summary}
        </p>
        {children}
      </main>

      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <p>
            DataFormatter — free online JSON, Base64 &amp; JWT developer tools.{" "}
            <Link href="/" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
              Open the free tool
            </Link>
            .
          </p>
          <nav aria-label="Tools" className="flex flex-wrap gap-3">
            {TOOL_LINKS.map((link) => (
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