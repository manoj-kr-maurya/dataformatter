"use client";

import { CodeEditor } from "@/components/editor/code-editor";
import { Panel } from "@/components/editor/panel";
import { FullscreenButton, useFullscreen } from "@/components/editor/fullscreen";
import { EditorActions } from "@/components/controls/editor-actions";
import { CopyIcon, DownloadIcon, PasteIcon, TrashIcon } from "@/components/ui/icons";
import type { Language } from "@/types/tools";

interface SplitViewProps {
  input: string;
  onInputChange: (value: string) => void;
  inputLanguage: Language;
  inputCharacters: number;
  inputLines: number;
  inputWords: number;
  onPaste: () => void;
  onClearInput: () => void;

  output: string;
  outputLanguage: Language;
  outputCharacters: number;
  outputLines: number;
  outputWords: number;

  onCopy: () => void;
  onDownload: () => void;
  onClearOutput: () => void;
}

export function SplitView({
  input,
  onInputChange,
  inputLanguage,
  inputCharacters,
  inputLines,
  inputWords,
  onPaste,
  onClearInput,
  output,
  outputLanguage,
  outputCharacters,
  outputLines,
  outputWords,
  onCopy,
  onDownload,
  onClearOutput,
}: SplitViewProps) {
  const { isFullscreen, toggle } = useFullscreen();

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex h-full min-h-0 flex-col gap-2 bg-white dark:bg-zinc-950 lg:flex-row"
          : "flex h-full min-h-0 flex-col gap-2 lg:flex-row"
      }
    >
      <Panel
        title="Input"
        headerExtra={
          <>
            <span className="hidden whitespace-nowrap font-mono text-xs text-zinc-400 sm:inline dark:text-zinc-500">
              {inputCharacters} chars · {inputWords} words · {inputLines} lines
            </span>
            <FullscreenButton isFullscreen={isFullscreen} onClick={toggle} />
          </>
        }
        className={
          isFullscreen
            ? "min-h-0 flex-1 !rounded-none !border-0 !bg-white dark:!bg-zinc-950"
            : "min-h-[30vh] flex-1 lg:min-h-0"
        }
      >
        <div className="code-editor min-h-0 flex-1 overflow-hidden">
          <CodeEditor
            value={input}
            onChange={onInputChange}
            language={inputLanguage}
            ariaLabel="Input editor"
            placeholder="Paste or type data…"
          />
        </div>
<footer className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <EditorActions
            actions={[
              { key: "paste", label: "Paste", icon: <PasteIcon className="h-4 w-4" />, onClick: onPaste },
              {
                key: "clear-input",
                label: "Clear",
                icon: <TrashIcon className="h-4 w-4" />,
                onClick: onClearInput,
                disabled: !input,
              },
              { key: "copy", label: "Copy", icon: <CopyIcon className="h-4 w-4" />, onClick: onCopy, disabled: !input },
            ]}
          />
          <span className="hidden font-mono text-[11px] text-zinc-400 sm:inline dark:text-zinc-500">
            ⌘F find · ⌘↵ copy
          </span>
        </footer>
      </Panel>

      <Panel
        title="Output"
        headerExtra={
          <span className="hidden whitespace-nowrap font-mono text-xs text-zinc-400 sm:inline dark:text-zinc-500">
            {outputCharacters} chars · {outputWords} words · {outputLines} lines
          </span>
        }
        className={
          isFullscreen
            ? "min-h-0 flex-1 !rounded-none !border-0 !bg-white dark:!bg-zinc-950"
            : "min-h-[30vh] flex-1 lg:min-h-0"
        }
      >
        <div className="code-editor min-h-0 flex-1 overflow-hidden">
          <CodeEditor
            value={output}
            language={outputLanguage}
            readOnly
            ariaLabel="Output editor"
            placeholder="Transformed output appears here."
          />
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <EditorActions
            actions={[
              {
                key: "copy",
                label: "Copy",
                icon: <CopyIcon className="h-4 w-4" />,
                onClick: onCopy,
                disabled: !output,
              },
              {
                key: "download",
                label: "Download",
                icon: <DownloadIcon className="h-4 w-4" />,
                onClick: onDownload,
                disabled: !output,
              },
              {
                key: "clear-output",
                label: "Clear",
                icon: <TrashIcon className="h-4 w-4" />,
                onClick: onClearOutput,
                disabled: !output,
              },
            ]}
          />
          <span className="hidden font-mono text-[11px] text-zinc-400 sm:inline dark:text-zinc-500">
            ⌘F find
          </span>
        </footer>
      </Panel>
    </div>
  );
}