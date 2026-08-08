"use client";

import { AUTO_DETECT, MANUAL_TOOL_ORDER, TOOL_META } from "@/lib/tools";
import type { ToolMode } from "@/types/tools";

interface ToolTabsProps {
  mode: ToolMode;
  onSelect: (mode: ToolMode) => void;
  autoEnabled: boolean;
}

export function ToolTabs({ mode, onSelect, autoEnabled }: ToolTabsProps) {
  const autoActive = mode === AUTO_DETECT;

  return (
    <nav
      role="tablist"
      aria-label="Tools"
      className="scrollbar-thin overflow-x-auto"
    >
      <div className="flex w-fit items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <button
          type="button"
          role="tab"
          aria-selected={autoActive}
          onClick={() => onSelect(AUTO_DETECT)}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
            autoActive
              ? "bg-violet-600 text-white shadow-sm"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          }`}
        >
          Auto Detect{autoActive && !autoEnabled ? " (OFF)" : ""}
        </button>
        <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-700/80" />
        {MANUAL_TOOL_ORDER.map((id) => {
          const meta = TOOL_META[id];
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              title={meta.description}
              onClick={() => onSelect(id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
                active
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}