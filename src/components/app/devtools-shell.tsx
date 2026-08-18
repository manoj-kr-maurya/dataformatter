"use client";

import { useState } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { StarButton } from "@/components/app/star-button";
import { PrivacyNotice } from "@/components/privacy/privacy-notice";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ToolMenu } from "@/components/workspace/tool-menu";
import { Workspace } from "@/components/workspace/workspace";
import { AUTO_DETECT } from "@/lib/tools";
import type { ToolMode, ToolType } from "@/types/tools";

interface DevToolsShellProps {
  tools: ToolType[];
  activeHref:
    | "/"
    | "/encode-decode"
    | "/base64"
    | "/json-converter"
    | "/parsers"
    | "/random-generators"
    | "/string-functions"
    | "/cryptography-tools";
}

export function DevToolsShell({ tools, activeHref }: DevToolsShellProps) {
  const [mode, setMode] = useState<ToolMode>(AUTO_DETECT);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex min-w-0 items-center">
          <ToolMenu tools={tools} mode={mode} onSelect={setMode} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <StarButton />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar activeHref={activeHref} onSelectTool={setMode} />
        <Workspace mode={mode} onSelectTool={setMode} />
      </div>

      <footer className="flex h-7 shrink-0 items-center justify-center border-t border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40">
        <PrivacyNotice />
      </footer>
    </div>
  );
}