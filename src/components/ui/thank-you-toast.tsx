"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";

const STORAGE_KEY = "devtools-thanks-shown";
const SHOW_DELAY_MS = 6000;
const AUTO_DISMISS_MS = 10000;

export function ThankYouToast() {
  const [visible, setVisible] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Storage unavailable — still show the toast once this session.
    }
    if (alreadySeen) {
      return;
    }
    const showTimer = window.setTimeout(() => {
      setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform));
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const hideTimer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(hideTimer);
  }, [visible]);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore — the toast just won't auto-open after a reload.
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-3 z-[70] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2"
    >
      <div className="slide-down flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
          <CheckIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Thanks for using DataFormatter!
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Everything runs locally in your browser — your data never leaves your
            device.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-violet-500" />
            {isMac ? "Press ⌘D to bookmark this tool" : "Press Ctrl+D to bookmark this tool"}
          </p>
        </div>

        <Button variant="primary" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}