"use client";

import { useRouter } from "next/navigation";
import { useCallback, type PointerEvent as ReactPointerEvent } from "react";
import { pageHrefForTool } from "@/components/app/sidebar";
import { Workspace } from "@/components/workspace/workspace";
import { useShareRestore } from "@/hooks/use-share-restore";
import { readEditorText, saveEditorHandoff } from "@/lib/editor-handoff";
import { AUTO_DETECT } from "@/lib/tools";
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
 *
 * Clicking into the embedded editor hands off to the full workspace: the
 * current text is snapshotted and the app shell opens with the same tool and
 * content, so visitors get the complete experience the moment they engage.
 */
export function EmbeddedWorkspace({ mode, label }: EmbeddedWorkspaceProps) {
  const router = useRouter();
  const tools: ToolType[] = [mode];
  const { mode: activeMode, setMode, restorePayload } = useShareRestore(tools, {
    initialMode: mode as ToolMode,
    fallbackMode: mode as ToolMode,
  });

  const handleEditorPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      // Only clicks inside an editing surface hand off — toolbar buttons,
      // tabs and copy controls keep working on the SEO page itself.
      if (!target.closest(".cm-editor, textarea")) {
        return;
      }
      // A restored share can leave the embed in Auto Detect; the hand-off
      // must always carry this page's focused tool so the destination opens
      // the exact editor the visitor was engaging with.
      const handoffTool = activeMode === AUTO_DETECT ? (mode as ToolMode) : activeMode;
      saveEditorHandoff({ tool: handoffTool, input: readEditorText(event.currentTarget) });
      // A restored #/share fragment must not survive the navigation, or the
      // destination shell would re-run its share restore and fight the
      // hand-off — drop it from the history entry before pushing.
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, "", pathname + search);
      // Land on the shell that hosts this exact tool (home for JSON/JWT).
      router.push(pageHrefForTool(activeMode));
    },
    [activeMode, mode, router],
  );

  return (
    <div
      role="region"
      aria-label={label}
      onPointerDown={handleEditorPointerDown}
      className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <Workspace mode={activeMode} onSelectTool={setMode} restorePayload={restorePayload} />
    </div>
  );
}
