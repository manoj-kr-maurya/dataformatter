"use client";

import { useEffect, useRef, useState } from "react";
import { restoreFromShareUrl } from "@/lib/share";
import type { SharePayload } from "@/lib/share";
import { AUTO_DETECT } from "@/lib/tools";
import type { ToolMode, ToolType } from "@/types/tools";

interface UseShareRestoreResult {
  mode: ToolMode;
  setMode: (mode: ToolMode) => void;
  /** Workspace state restored from the #/share URL fragment, if any. */
  restorePayload: SharePayload | null;
  /** True when a share fragment was present but could not be restored. */
  restoreFailed: boolean;
}

export interface UseShareRestoreOptions {
  /** Mode to show before/without a share fragment (default AUTO_DETECT). */
  initialMode?: ToolMode;
  /** Mode used when a share points at a tool outside `tools` (default AUTO_DETECT). */
  fallbackMode?: ToolMode;
}

/**
 * Restores a shared workspace exactly once per page load, from the #/share
 * URL fragment — the payload never touches a server. Shared by the app shell
 * and embedded tool workspaces so every route restores shares identically.
 */
export function useShareRestore(
  tools: readonly ToolType[],
  options: UseShareRestoreOptions = {},
): UseShareRestoreResult {
  const { initialMode = AUTO_DETECT, fallbackMode = AUTO_DETECT } = options;
  const [mode, setMode] = useState<ToolMode>(initialMode);
  const [restorePayload, setRestorePayload] = useState<SharePayload | null>(null);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const restoreHandledRef = useRef(false);

  useEffect(() => {
    if (restoreHandledRef.current) {
      return;
    }
    restoreHandledRef.current = true;
    void (async () => {
      const result = await restoreFromShareUrl(window.location.hash ?? "");
      if (result.status === "ok") {
        const tool = result.payload.tool;
        if (tool === AUTO_DETECT || tools.includes(tool as ToolType)) {
          setMode(tool);
        } else {
          setMode(fallbackMode);
        }
        setRestorePayload(result.payload);
      } else if (result.status === "error") {
        setRestoreFailed(true);
      }
    })();
    // `tools` is stable per-route; intentionally run restore exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mode, setMode, restorePayload, restoreFailed };
}
