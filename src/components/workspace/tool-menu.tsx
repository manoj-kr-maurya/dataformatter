"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronIcon, MenuIcon } from "@/components/ui/icons";
import { AUTO_DETECT, TOOL_GROUPS, TOOL_META } from "@/lib/tools";
import type { ToolMode, ToolType } from "@/types/tools";

interface ToolMenuProps {
  mode: ToolMode;
  onSelect: (mode: ToolMode) => void;
  tools: ToolType[];
}

const SUBMENU_WIDTH = 256;

export function ToolMenu({ mode, onSelect, tools }: ToolMenuProps) {
  const [open, setOpen] = useState(false);
  const [branch, setBranch] = useState<string | null>(null);
  const [flip, setFlip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setBranch(null);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Decide which way the fly-outs open: right by default, flipped left when
  // the menu sits close to the right edge of the viewport.
  useEffect(() => {
    if (!open || !panelRef.current) {
      return;
    }
    const rect = panelRef.current.getBoundingClientRect();
    setFlip(rect.right + SUBMENU_WIDTH > window.innerWidth);
  }, [open]);

  const groups = useMemo(
    () =>
      TOOL_GROUPS.map((group) => ({
        ...group,
        tools: tools.filter((tool) => group.tools.includes(tool)),
      })).filter((group) => group.tools.length > 0),
    [tools],
  );

  const activeLabel = mode === AUTO_DETECT ? "Auto Detect" : TOOL_META[mode].label;

  const select = (next: ToolMode) => {
    onSelect(next);
    close();
  };

  const openBranch = (label: string) => {
    setBranch(label);
  };

  return (
    <div ref={wrapperRef} className="relative flex items-center gap-2">
      <button
        type="button"
        aria-label="Select tool"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
          }
        }}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <MenuIcon className="h-4 w-4" />
      </button>

      <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {activeLabel}
      </span>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Tools"
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <button
            type="button"
            role="menuitem"
            aria-current={mode === AUTO_DETECT ? "true" : undefined}
            onClick={() => select(AUTO_DETECT)}
            className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
              mode === AUTO_DETECT
                ? "bg-violet-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            <span>Auto Detect</span>
            {mode === AUTO_DETECT && <CheckIcon className="h-3.5 w-3.5" />}
          </button>

          {groups.map((group) => {
            const active = branch === group.label;
            return (
              <div
                key={group.label}
                className="relative"
                onMouseEnter={() => setBranch(group.label)}
              >
                <button
                  type="button"
                  role="menuitem"
                  aria-haspopup="menu"
                  aria-expanded={active}
                  onClick={() => openBranch(group.label)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
                    active
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  <span className="truncate">{group.label}</span>
                  <ChevronIcon
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                      active ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {active && (
                  <div
                    role="menu"
                    className={`absolute top-0 z-10 mt-1 w-64 max-h-[70vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 ${
                      flip ? "right-full" : "left-full"
                    }`}
                  >
                    {group.tools.map((id) => {
                      const meta = TOOL_META[id];
                      const isActive = mode === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="menuitem"
                          aria-current={isActive ? "true" : undefined}
                          title={meta.description}
                          onClick={() => select(id)}
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
                            isActive
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                          }`}
                        >
                          <span className="truncate">{meta.label}</span>
                          {isActive && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}