"use client";

import { useEffect } from "react";

export type ShareNoticeTone = "success" | "error" | "warning";

export interface ShareNotice {
  tone: ShareNoticeTone;
  message: string;
  /** Optional extra line, e.g. the share URL shown when copying failed. */
  detail?: string;
}

interface ShareToastProps {
  notice: ShareNotice;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. Defaults to 4000. */
  autoDismissMs?: number;
}

const toneClasses: Record<ShareNoticeTone, string> = {
  success: "text-emerald-700 dark:text-emerald-300",
  error: "text-red-700 dark:text-red-300",
  warning: "text-amber-700 dark:text-amber-300",
};

export function ShareToast({ notice, onDismiss, autoDismissMs = 4000 }: ShareToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [notice, onDismiss, autoDismissMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-3 z-[70] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2"
    >
      <div className="slide-down rounded-xl border border-zinc-200 bg-white p-3.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <p className={`text-sm font-semibold ${toneClasses[notice.tone]}`}>{notice.message}</p>
        {notice.detail ? (
          <p className="mt-1 text-xs break-all text-zinc-500 dark:text-zinc-400">{notice.detail}</p>
        ) : null}
      </div>
    </div>
  );
}