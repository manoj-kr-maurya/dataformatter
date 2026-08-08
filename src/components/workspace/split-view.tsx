"use client";

import { CodeEditor } from "@/components/editor/code-editor";
import { Panel } from "@/components/editor/panel";
import { EditorActions } from "@/components/controls/editor-actions";
import { CopyIcon, DownloadIcon, PasteIcon, TrashIcon } from "@/components/ui/icons";
import type { Language } from "@/types/tools";

interface SplitViewProps {
  input: string;
  onInputChange: (value: string) => void;
  inputLanguage: Language;
  inputCharacters: number;
  inputLines: number;
  onPaste: () => void;
  onClearInput: () => void;

  output: string;
  outputLanguage: Language;
  outputCharacters: number;
  outputLines: number;

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
  onPaste,
  onClearInput,
  output,
  outputLanguage,
  outputCharacters,
  outputLines,
  onCopy,
  onDownload,
  onClearOutput,
}: SplitViewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 lg:flex-row">
      <Panel
        title="Input"
        headerExtra={
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
            {inputCharacters} chars · {inputLines} lines
          </span>
        }
        className="min-h-[30vh] flex-1 lg:min-h-0"
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
<footer className="flex shrink-0 items-center gap-2 border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
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
            ]}
          />
        </footer>
      </Panel>

      <Panel
        title="Output"
        headerExtra={
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
            {outputCharacters} chars · {outputLines} lines
          </span>
        }
        className="min-h-[30vh] flex-1 lg:min-h-0"
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
        <footer className="flex shrink-0 items-center gap-2 border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
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
        </footer>
      </Panel>
    </div>
  );
}