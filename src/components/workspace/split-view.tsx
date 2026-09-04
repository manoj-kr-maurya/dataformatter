"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import { Panel } from "@/components/editor/panel";
import { EditorActions } from "@/components/controls/editor-actions";
import { ShareMenu } from "@/components/ui/share-menu";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  PasteIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { usePersistedState } from "@/hooks/usePersistedState";
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

  onCopyOutput: () => void;
  onDownload: () => void;
  onCopyShareLink: () => void;
  onNativeShare?: () => void;

  feedback: string | null;
  copied: boolean;

  isFullscreen: boolean;
  wordWrap: boolean;
}

const MIN_RATIO = 0.15;
const MAX_RATIO = 0.85;

function clampRatio(value: number): number {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, value));
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
  onCopyOutput,
  onDownload,
  onCopyShareLink,
  onNativeShare,
  feedback,
  copied,
  isFullscreen,
  wordWrap,
}: SplitViewProps) {
  const [ratio, setRatio] = usePersistedState<number>("devtools-split-ratio", 0.5);
  const [isRow, setIsRow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsRow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!draggingRef.current || !containerRef.current) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    setRatio(clampRatio((event.clientX - rect.left) / rect.width));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: ReactKeyboardEvent) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setRatio((current) => clampRatio(current - 0.05));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setRatio((current) => clampRatio(current + 0.05));
    }
  }

  const panelStyle = (part: "input" | "output") => {
    const safeRatio = clampRatio(ratio);
    return isRow
      ? { flexGrow: part === "input" ? safeRatio : 1 - safeRatio, flexBasis: "0%" }
      : undefined;
  };

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex h-full min-h-0 flex-col gap-2 bg-white pt-10 dark:bg-zinc-950 lg:flex-row"
          : "flex h-full min-h-0 flex-col gap-2 lg:flex-row"
      }
    >
      <Panel
        title="Input"
        headerExtra={
          <span className="hidden whitespace-nowrap font-mono text-xs text-zinc-400 sm:inline dark:text-zinc-500">
            {inputCharacters} chars · {inputWords} words · {inputLines} lines
          </span>
        }
        style={panelStyle("input")}
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
            wordWrap={wordWrap}
            ariaLabel="Input editor"
            placeholder="Paste or type data…"
          />
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
                key: "clear-input",
                label: "Clear",
                icon: <TrashIcon className="h-4 w-4" />,
                onClick: onClearInput,
                disabled: !input,
              },
            ]}
          />
          <span className="hidden font-mono text-[11px] text-zinc-400 sm:inline dark:text-zinc-500">
            ⌘F find · ⌘↵ copy
          </span>
        </footer>
      </Panel>

      {isRow && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          tabIndex={0}
          title="Drag to resize panels"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
          className="group my-0 flex w-1.5 shrink-0 cursor-col-resize touch-none items-center justify-center self-stretch rounded-full outline-none focus-visible:bg-violet-200 dark:focus-visible:bg-violet-500/30"
        >
          <span className="h-8 w-1 rounded-full bg-zinc-200 transition-colors group-hover:bg-violet-400/50 group-focus-visible:bg-violet-400 dark:bg-zinc-800" />
        </div>
      )}

      <Panel
        title="Output"
        headerExtra={
          <span className="hidden whitespace-nowrap font-mono text-xs text-zinc-400 sm:inline dark:text-zinc-500">
            {outputCharacters} chars · {outputWords} words · {outputLines} lines
          </span>
        }
        style={panelStyle("output")}
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
            wordWrap={wordWrap}
            ariaLabel="Output editor"
            placeholder="Transformed output appears here."
          />
        </div>
        <footer className="flex h-11 shrink-0 items-center justify-between gap-2 border-t border-zinc-200 px-2.5 dark:border-zinc-800">
          <div className="flex min-w-0 items-center gap-1.5">
            <EditorActions
              actions={[
                {
                  key: "copy-output",
                  label: copied ? "✓ Copied" : "Copy",
                  icon: copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />,
                  onClick: onCopyOutput,
                  disabled: !output,
                  variant: copied ? "success" : "secondary",
                },
                {
                  key: "download",
                  label: "Download",
                  icon: <DownloadIcon className="h-4 w-4" />,
                  onClick: onDownload,
                  disabled: !output,
                },
              ]}
            />
            <ShareMenu
              onCopyLink={onCopyShareLink}
              onNativeShare={onNativeShare}
              disabled={!output}
            />
          </div>
          <span
            title={feedback ?? "⌘F find"}
            className={`hidden truncate font-mono text-[11px] sm:inline ${
              feedback ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {feedback ?? "⌘F find"}
          </span>
        </footer>
      </Panel>
    </div>
  );
}