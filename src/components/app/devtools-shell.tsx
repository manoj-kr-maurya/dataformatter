"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { StarButton } from "@/components/app/star-button";
import { PrivacyNotice } from "@/components/privacy/privacy-notice";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ToolMenu } from "@/components/workspace/tool-menu";
import { Workspace } from "@/components/workspace/workspace";
import { ShareToast } from "@/components/ui/share-toast";
import type { ShareNotice } from "@/components/ui/share-toast";
import { MenuIcon } from "@/components/ui/icons";
import { SHARE_OPEN_FAILURE_MESSAGE } from "@/lib/share";
import {
  buildHandoffPayload,
  consumeEditorHandoff,
} from "@/lib/editor-handoff";
import { useShareRestore } from "@/hooks/use-share-restore";
import type { SharePayload } from "@/lib/share";
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
  /** Accessible page heading — the only <h1> on the route. */
  heading: string;
}

export function DevToolsShell({ tools, activeHref, heading }: DevToolsShellProps) {
  const { mode: shareMode, setMode, restorePayload: sharePayload, restoreFailed } = useShareRestore(tools);
  const [navOpen, setNavOpen] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  // Editor hand-off from an SEO landing page: same tool + text in this shell.
  const [handoff, setHandoff] = useState<SharePayload | null>(null);

  useEffect(() => {
    void (async () => {
      const received = consumeEditorHandoff();
      if (!received) {
        return;
      }
      const toolValid = received.tool !== null && tools.includes(received.tool as ToolType);
      const tool = (toolValid ? received.tool : "AUTO_DETECT") as ToolMode;
      setMode(tool);
      setHandoff(buildHandoffPayload(tool, received.input));
    })();
    // Runs once on mount; `tools` is stable per route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mode: ToolMode = handoff ? handoff.tool : shareMode;
  const restorePayload = sharePayload ?? handoff;

  // The shell's only toast source is a failed share-URL restore.
  const shareNotice: ShareNotice | null =
    restoreFailed && !noticeDismissed
      ? { tone: "error", message: SHARE_OPEN_FAILURE_MESSAGE }
      : null;

  return (
    <div className="flex h-dvh flex-col">
      <h1 className="sr-only">{heading}</h1>
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="Open tools navigation"
            onClick={() => setNavOpen(true)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          <ToolMenu tools={tools} mode={mode} onSelect={setMode} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden sm:block">
            <PrivacyNotice />
          </div>
          <StarButton />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar
          activeHref={activeHref}
          mode={mode}
          onSelectTool={setMode}
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />
        <Workspace
          mode={mode}
          onSelectTool={setMode}
          restorePayload={restorePayload}
        />
      </div>

      {shareNotice && (
        <ShareToast notice={shareNotice} onDismiss={() => setNoticeDismissed(true)} />
      )}
    </div>
  );
}
