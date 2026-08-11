"use client";

import { CodeEditor } from "@/components/editor/code-editor";
import { Panel } from "@/components/editor/panel";
import { FullscreenButton, useFullscreen } from "@/components/editor/fullscreen";
import { EditorActions } from "@/components/controls/editor-actions";
import {
  CopyIcon,
  DownloadIcon,
  PasteIcon,
  RestoreIcon,
  TrashIcon,
} from "@/components/ui/icons";
import type { Language } from "@/types/tools";

interface SingleViewProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  characters: number;
  lines: number;
  words: number;
  canRestore: boolean;
  onPaste: () => void;
  onCopy: () => void;
  onRestore: () => void;
  onClear: () => void;
  onDownload: () => void;
}

export function SingleView({
  value,
  onChange,
  language,
  characters,
  lines,
  words,
  canRestore,
  onPaste,
  onCopy,
  onRestore,
  onClear,
  onDownload,
}: SingleViewProps) {
  const { isFullscreen, toggle, overlayClassName } = useFullscreen();

  return (
    <div className={isFullscreen ? `${overlayClassName} min-h-0` : "h-full min-h-0"}>
      <Panel
        title="Input / Output"
        headerExtra={
          <>
            <span className="hidden whitespace-nowrap font-mono text-xs text-zinc-400 sm:inline dark:text-zinc-500">
              {characters} chars · {words} words · {lines} lines
            </span>
            <FullscreenButton isFullscreen={isFullscreen} onClick={toggle} />
          </>
        }
        className={isFullscreen ? "h-full !rounded-none !border-0 !bg-white dark:!bg-zinc-950" : "h-full"}
      >
        <div className="code-editor min-h-0 flex-1 overflow-hidden">
          <CodeEditor
            value={value}
            onChange={onChange}
            language={language}
            ariaLabel="Input / Output editor"
            placeholder="Paste or type JSON, Base64, or plain text…"
          />
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <EditorActions
          actions={[
            { key: "paste", label: "Paste", icon: <PasteIcon className="h-4 w-4" />, onClick: onPaste },
            {
              key: "restore",
              label: "Restore Original",
              icon: <RestoreIcon className="h-4 w-4" />,
              onClick: onRestore,
              disabled: !canRestore,
              title: canRestore ? "Show the original input you typed" : "Nothing to restore",
            },
            {
              key: "copy",
              label: "Copy",
              icon: <CopyIcon className="h-4 w-4" />,
              onClick: onCopy,
              disabled: !value,
            },
            {
              key: "download",
              label: "Download",
              icon: <DownloadIcon className="h-4 w-4" />,
              onClick: onDownload,
              disabled: !value,
            },
            {
              key: "clear",
              label: "Clear",
              icon: <TrashIcon className="h-4 w-4" />,
              onClick: onClear,
              disabled: !value,
              title: "Clear the editor",
            },
          ]}
        />
        <span className="hidden font-mono text-[11px] text-zinc-400 sm:inline dark:text-zinc-500">
          ⌘F find · ⌘↵ copy
        </span>
      </footer>
    </Panel>
    </div>
  );
}