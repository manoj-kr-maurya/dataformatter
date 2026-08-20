"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChevronIcon, CopyIcon, ShareIcon } from "@/components/ui/icons";

export interface ShareMenuProps {
  /** Copies the share URL to the clipboard. */
  onCopyLink: () => void;
  /** Opens the native OS share sheet. Absent when Web Share is unavailable. */
  onNativeShare?: () => void;
  disabled?: boolean;
}

const MENU_WIDTH = 208; // w-52 = 13rem = 208px
const MENU_ROW = 30; // per item + divider spacing
const MENU_PAD = 8; // p-1 * 2 + border
const MENU_GAP = 6;

/**
 * Compact share action: a small trigger that folds out a short menu with the
 * two links we can produce. The menu is rendered through a portal so it is not
 * clipped by the panel's overflow-hidden.
 */
export function ShareMenu({ onCopyLink, onNativeShare, disabled }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function placeMenu() {
      const button = buttonRef.current;
      if (!button) {
        return;
      }
      const rows = (onNativeShare ? 1 : 0) + 1;
      const menuHeight = rows * MENU_ROW + MENU_PAD;
      const rect = button.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
      const roomBelow = window.innerHeight - rect.bottom - 8;
      const top =
        roomBelow >= menuHeight
          ? rect.bottom + MENU_GAP
          : Math.max(8, rect.top - menuHeight - MENU_GAP);
      setPosition({ top, left });
    }
    placeMenu();
    window.addEventListener("resize", placeMenu);
    document.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      document.removeEventListener("scroll", placeMenu, true);
    };
  }, [open, onNativeShare]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function closeOnOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        (rootRef.current && rootRef.current.contains(target))
      ) {
        return;
      }
      setOpen(false);
    }
    function closeOnKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnKey);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnKey);
    };
  }, [open]);

  const select = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={buttonRef}
        variant="secondary"
        size="sm"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Share this workspace as a link"
      >
        <ShareIcon className="h-4 w-4" />
        Share
        <ChevronIcon className="h-3 w-3" />
      </Button>
      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: position.top, left: position.left }}
              className="fixed z-[60] mt-1 w-52 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              {onNativeShare ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={select(onNativeShare)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <ShareIcon className="h-4 w-4" />
                  Share…
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={select(onCopyLink)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <CopyIcon className="h-4 w-4" />
                Copy link
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}