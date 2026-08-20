"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FullscreenButton } from "@/components/editor/fullscreen";
import { AutoDetectToggle } from "@/components/workspace/auto-detect-toggle";
import { ViewToggle } from "@/components/workspace/view-toggle";
import {
  AlertIcon,
  BadgeCheckIcon,
  CompressIcon,
  GearIcon,
  MoreIcon,
  SearchIcon,
  SortIcon,
  TreeIcon,
  WandIcon,
  WrapIcon,
} from "@/components/ui/icons";
import { openEditorSearch } from "@/lib/editor/panel-search";
import { openGoToLine } from "@/lib/editor/go-to-line";
import {
  TransformStatus,
  type TransformStatusData,
} from "@/components/status/transform-status";
import type { ToolMode, ViewMode } from "@/types/tools";

interface WorkspaceToolbarProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSelectTool: (mode: ToolMode) => void;
  autoOn: boolean;
  onToggleAuto: () => void;
  wordWrap: boolean;
  onToggleWordWrap: () => void;
  status: TransformStatusData;
  errorLocation: { line: number; column: number } | null;
  onGoToError: () => void;
}

function ActionButton({
  label,
  icon,
  onClick,
  title,
  className = "inline-flex",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${className} h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`}
    >
      {icon}
      {label}
    </button>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  title,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      title={title}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {icon}
    </button>
  );
}

function MoreMenuItem({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {icon}
      {label}
    </button>
  );
}

type OpenMenu = "more" | "settings" | null;

export function WorkspaceToolbar({
  view,
  onViewChange,
  isFullscreen,
  onToggleFullscreen,
  onSelectTool,
  autoOn,
  onToggleAuto,
  wordWrap,
  onToggleWordWrap,
  status,
  errorLocation,
  onGoToError,
}: WorkspaceToolbarProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const menuClass =
    "absolute top-full z-50 mt-1 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900";

  const runTool = (mode: ToolMode) => {
    onSelectTool(mode);
    setOpenMenu(null);
  };

  return (
    <div
      ref={wrapperRef}
      className="flex shrink-0 items-center gap-2 border-b border-zinc-200 bg-zinc-50/80 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <div className="flex min-w-0 items-center gap-1">
        <AutoDetectToggle enabled={autoOn} onChange={onToggleAuto} />
        <ActionButton
          label="Format"
          icon={<WandIcon className="h-3.5 w-3.5" />}
          onClick={() => onSelectTool("JSON_FORMAT")}
          title="Prettify JSON with 2-space indentation"
        />
        <ActionButton
          label="Minify"
          icon={<CompressIcon className="h-3.5 w-3.5" />}
          onClick={() => onSelectTool("JSON_MINIFY")}
          title="Compress JSON to one line"
          className="hidden sm:inline-flex"
        />
        <ActionButton
          label="Validate"
          icon={<BadgeCheckIcon className="h-3.5 w-3.5" />}
          onClick={() => onSelectTool("JSON_VALIDATE")}
          title="Check JSON validity without changing the input"
          className="hidden md:inline-flex"
        />
        <ActionButton
          label="Tree View"
          icon={<TreeIcon className="h-3.5 w-3.5" />}
          onClick={() => onSelectTool("JSON_PARSE")}
          title="Render JSON as a typed tree"
          className="hidden md:inline-flex"
        />
        <ActionButton
          label="Sort Keys"
          icon={<SortIcon className="h-3.5 w-3.5" />}
          onClick={() => onSelectTool("SORT_KEYS")}
          title="Sort JSON object keys alphabetically (recursive)"
          className="hidden md:inline-flex"
        />

        <div className="relative">
          <IconButton
            label="More actions"
            icon={<MoreIcon className="h-4 w-4" />}
            onClick={() => setOpenMenu(openMenu === "more" ? null : "more")}
            title="More actions"
          />
          {openMenu === "more" && (
            <div role="menu" aria-label="More actions" className={menuClass}>
              <MoreMenuItem
                label="Format"
                icon={<WandIcon className="h-3.5 w-3.5" />}
                onClick={() => runTool("JSON_FORMAT")}
              />
              <MoreMenuItem
                label="Minify"
                icon={<CompressIcon className="h-3.5 w-3.5" />}
                onClick={() => runTool("JSON_MINIFY")}
              />
              <MoreMenuItem
                label="Validate"
                icon={<BadgeCheckIcon className="h-3.5 w-3.5" />}
                onClick={() => runTool("JSON_VALIDATE")}
              />
              <MoreMenuItem
                label="Tree View"
                icon={<TreeIcon className="h-3.5 w-3.5" />}
                onClick={() => runTool("JSON_PARSE")}
              />
              <MoreMenuItem
                label="Sort Keys"
                icon={<SortIcon className="h-3.5 w-3.5" />}
                onClick={() => runTool("SORT_KEYS")}
              />
              <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
              <MoreMenuItem
                label="Go to line"
                icon={<TreeIcon className="h-3.5 w-3.5" />}
                onClick={() => {
                  openGoToLine();
                  setOpenMenu(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-center px-2 md:flex">
        <TransformStatus status={status} />
        {errorLocation && (
          <button
            type="button"
            onClick={onGoToError}
            className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 px-2 py-0.5 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <AlertIcon className="h-3 w-3" />
            Go to error
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          label="Search in editor"
          icon={<SearchIcon className="h-4 w-4" />}
          onClick={openEditorSearch}
          title="Search in editor (⌘F)"
        />
        <div className="relative">
          <IconButton
            label="Editor settings"
            icon={<GearIcon className="h-4 w-4" />}
            onClick={() => setOpenMenu(openMenu === "settings" ? null : "settings")}
            title="Editor settings"
          />
          {openMenu === "settings" && (
            <div role="menu" aria-label="Editor settings" className={`${menuClass} right-0`}>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={wordWrap}
                onClick={() => {
                  onToggleWordWrap();
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <span className="flex items-center gap-2">
                  <WrapIcon className="h-3.5 w-3.5" />
                  Word Wrap
                </span>
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${
                    wordWrap ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
        <FullscreenButton isFullscreen={isFullscreen} onClick={onToggleFullscreen} />
        <div className="ml-1.5">
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
      </div>
    </div>
  );
}