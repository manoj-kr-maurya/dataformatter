"use client";

import { Workspace } from "@/components/workspace/workspace";
import { useShareRestore } from "@/hooks/use-share-restore";
import type { ToolMode, ToolType } from "@/types/tools";

interface EmbeddedWorkspaceProps {
  /** The focused tool this landing page is about. */
  mode: ToolType;
  /** Accessible label describing the embedded editor region. */
  label?: string;
}

/**
 * The real DataFormatter workspace (toolbar + editors + share), scoped to a
 * single tool and sized to sit inside a content landing page. Share links
 * created here restore here: the #/share fragment is decoded exactly like on
 * the main app shell.
 */
export function EmbeddedWorkspace({ mode, label }: EmbeddedWorkspaceProps) {
  const tools: ToolType[] = [mode];
  const { mode: activeMode, setMode, restorePayload } = useShareRestore(tools, {
    initialMode: mode as ToolMode,
    fallbackMode: mode as ToolMode,
  });

  return (
    <div
      role="region"
      aria-label={label}
      className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <Workspace mode={activeMode} onSelectTool={setMode} restorePayload={restorePayload} />
    </div>
  );
}
