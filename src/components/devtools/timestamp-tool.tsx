"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sidebar } from "@/components/app/sidebar";
import { CompressIcon, MenuIcon, ShieldIcon } from "@/components/ui/icons";
import { TimestampWorkbench } from "@/components/devtools/timestamp-workbench";

/**
 * Full-page shell for the Timestamp Converter, matching the other
 * full-screen workbench tools (JSON to Code, Regex, …): a slim sticky
 * header with the tools nav, a sidebar and a scrollable main column that
 * hosts the actual converter. The crawlable H1/GEO content lives below in
 * ToolSeoContent so the page keeps the same shared look as its siblings.
 */
export function TimestampTool() {
  const [navExpanded, setNavExpanded] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="Open tools navigation"
            onClick={() => setNavDrawerOpen(true)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={navExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={navExpanded}
            onClick={() => setNavExpanded((prev) => !prev)}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <CompressIcon className="h-4 w-4" />
          </button>
          <Link
            href="/"
            aria-label="DataFormatter home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            <Logo className="h-7 w-7 rounded-md [&>svg]:h-4 [&>svg]:w-4" />
          </Link>
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Timestamp Converter &amp; Time Debugger
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 sm:inline-flex dark:bg-emerald-500/10 dark:text-emerald-300">
            <ShieldIcon className="h-3 w-3" />
            Local-only · nothing is uploaded
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        {navExpanded && (
          <Sidebar
            activeHref="/timestamp"
            mode="AUTO_DETECT"
            onSelectTool={() => void 0}
            open={navDrawerOpen}
            onClose={() => setNavDrawerOpen(false)}
            standalone
          />
        )}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <TimestampWorkbench />
        </main>
      </div>
    </div>
  );
}