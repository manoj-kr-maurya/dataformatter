"use client";

import { useCallback, useEffect, useState, type ButtonHTMLAttributes } from "react";
import { MaximizeIcon, MinimizeIcon } from "@/components/ui/icons";

export function useFullscreen(): {
  isFullscreen: boolean;
  toggle: () => void;
  overlayClassName: string;
} {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(() => setIsFullscreen((value) => !value), []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  return {
    isFullscreen,
    toggle,
    overlayClassName: isFullscreen
      ? "fixed inset-0 z-50 bg-white dark:bg-zinc-950"
      : "",
  };
}

interface FullscreenButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isFullscreen: boolean;
}

export function FullscreenButton({ isFullscreen, ...props }: FullscreenButtonProps) {
  return (
    <button
      type="button"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      {...props}
    >
      {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
    </button>
  );
}