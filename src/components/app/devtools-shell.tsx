"use client";

import { useState } from "react";
import Link from "next/link";
import { PrivacyNotice } from "@/components/privacy/privacy-notice";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ToolMenu } from "@/components/workspace/tool-menu";
import { Workspace } from "@/components/workspace/workspace";
import { AUTO_DETECT } from "@/lib/tools";
import type { ToolMode, ToolType } from "@/types/tools";

interface DevToolsShellProps {
  tools: ToolType[];
  activeHref: "/" | "/encode-decode" | "/base64" | "/json-converter";
}

const NAV_LINKS: Array<{
  href: "/" | "/encode-decode" | "/base64" | "/json-converter";
  label: string;
}> = [
  { href: "/", label: "DevTools Home" },
  { href: "/encode-decode", label: "Encoding Tools" },
  { href: "/base64", label: "Base64 Tools" },
  { href: "/json-converter", label: "JSON Converters" },
];

export function DevToolsShell({ tools, activeHref }: DevToolsShellProps) {
  const [mode, setMode] = useState<ToolMode>(AUTO_DETECT);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <ToolMenu tools={tools} mode={mode} onSelect={setMode} />

        <nav aria-label="Pages" className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => {
            const active = link.href === activeHref;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <ThemeToggle />
      </header>

      <Workspace mode={mode} />

      <footer className="flex shrink-0 items-center justify-center border-t border-zinc-200 bg-zinc-50/60 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <PrivacyNotice />
      </footer>
    </div>
  );
}