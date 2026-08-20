"use client";

import { CodeEditor } from "@/components/editor/code-editor";
import { Panel } from "@/components/editor/panel";
import { EditorActions } from "@/components/controls/editor-actions";
import { ShareMenu } from "@/components/ui/share-menu";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  PasteIcon,
  RestoreIcon,
  TrashIcon,
} from "@/components/ui/icons";
import type { Language } from "@/types/tools";

interface SingleViewProps {
  title: string;
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
  onCopyShareLink: () => void;
  onNativeShare?: () => void;
  onDownload: () => void;
  feedback: string | null;
  copied: boolean;
  defaultHint: string;
  isFullscreen: boolean;
  overlayClassName: string;
  wordWrap: boolean;
}

const SAMPLE_JSON = '{"name":"Ada","tags":["a","b"]}';
const SAMPLE_BASE64 = "aGVsbG8="; // "hello"
const PLACEHOLDER = "Paste or type JSON, Base64, or plain text…";

export function SingleView({
  title,
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
  onCopyShareLink,
  onNativeShare,
  onDownload,
  feedback,
  copied,
  defaultHint,
  isFullscreen,
  overlayClassName,
  wordWrap,
}: SingleViewProps) {
  return (
    <div className={isFullscreen ? `${overlayClassName} pt-10 min-h-0` : "h-full min-h-0"}>
      <Panel
        title={title}
        headerExtra={
          <>
            {value === "" && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange(SAMPLE_JSON)}
                  className="inline-flex h-6 items-center rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  Try JSON
                </button>
                <button
                  type="button"
                  onClick={() => onChange(SAMPLE_BASE64)}
                  className="inline-flex h-6 items-center rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  Try Base64
                </button>
              </div>
            )}
            <span className="hidden whitespace-nowrap font-mono text-xs text-zinc-400 sm:inline dark:text-zinc-500">
              {characters} chars · {words} words · {lines} lines
            </span>
          </>
        }
        className={isFullscreen ? "h-full !rounded-none !border-0 !bg-white dark:!bg-zinc-950" : "h-full"}
      >
        <div className="code-editor relative min-h-0 flex-1 overflow-hidden">
          <CodeEditor
            value={value}
            onChange={onChange}
            language={language}
            wordWrap={wordWrap}
            ariaLabel={`${title} editor`}
            placeholder={value ? PLACEHOLDER : ""}
          />
          {value === "" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                {PLACEHOLDER}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Paste or click a sample above — it will be detected automatically.
              </p>
            </div>
          )}
        </div>
        <footer className="flex h-11 shrink-0 items-center justify-between gap-2 border-t border-zinc-200 px-2.5 dark:border-zinc-800">
          <EditorActions
            actions={[
              {
                key: "paste",
                label: "Paste",
                icon: <PasteIcon className="h-4 w-4" />,
                onClick: onPaste,
                variant: "primary",
              },
              {
                key: "restore",
                label: "Restore Original",
                icon: <RestoreIcon className="h-4 w-4" />,
                onClick: onRestore,
                disabled: !canRestore,
                title: canRestore ? "Show the original input you typed" : "Nothing to restore",
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
          <div className="flex min-w-0 items-center gap-1.5">
            <EditorActions
              actions={[
                {
                  key: "copy",
                  label: copied ? "✓ Copied" : "Copy",
                  icon: copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />,
                  onClick: onCopy,
                  disabled: !value,
                  variant: copied ? "success" : "secondary",
                },
                {
                  key: "download",
                  label: "Download",
                  icon: <DownloadIcon className="h-4 w-4" />,
                  onClick: onDownload,
                  disabled: !value,
                },
              ]}
            />
            <ShareMenu
              onCopyLink={onCopyShareLink}
              onNativeShare={onNativeShare}
              disabled={!value}
            />
            <span
              title={feedback ?? defaultHint}
              className={`hidden truncate whitespace-nowrap font-mono text-[11px] sm:inline ${
                feedback ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {feedback ?? defaultHint}
            </span>
          </div>
        </footer>
      </Panel>
    </div>
  );
}