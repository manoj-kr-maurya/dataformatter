"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SingleView } from "@/components/workspace/single-view";
import { SplitView } from "@/components/workspace/split-view";
import { WorkspaceToolbar } from "@/components/workspace/workspace-toolbar";
import {
  type StatusKind,
} from "@/components/status/transform-status";
import { useFullscreen } from "@/components/editor/fullscreen";
import { useAutoProcessing } from "@/hooks/useAutoProcessing";
import { usePersistedState } from "@/hooks/usePersistedState";
import { copyToClipboard } from "@/lib/clipboard/copy";
import { downloadText } from "@/lib/download";
import { moveEditorToLineColumn } from "@/lib/editor/go-to-error";
import { AUTO_DETECT, TOOL_META } from "@/lib/tools";
import { getTextCounts } from "@/lib/text/counts";
import type { Language, ToolMode, ViewMode } from "@/types/tools";
import type { TransformationResult } from "@/types/transformation";

interface StatusData {
  kind: StatusKind;
  text: string;
}

interface WorkspaceProps {
  mode: ToolMode;
  onSelectTool: (mode: ToolMode) => void;
}

/** Operation-aware download name so files are meaningful, not always output.txt. */
function outputFilename(result: TransformationResult | null, fallback: string): string {
  const transformation = result?.success ? result.transformation : "NONE";
  const detected = result?.success ? result.detectedType : "TEXT";
  switch (transformation) {
    case "JSON_FORMAT":
      return "formatted.json";
    case "JSON_MINIFY":
      return "minified.json";
    case "JSON_VALIDATE":
      return "validated.json";
    case "JSON_TO_BASE64":
    case "BASE64_ENCODE":
      return "encoded.txt";
    case "BASE64_DECODE":
      return detected === "JSON" ? "decoded.json" : "decoded.txt";
    case "BASE64_TO_JSON":
      return "decoded.json";
    case "JWT_DECODE":
      return "decoded-jwt.txt";
    case "JSON_PARSE":
      return "tree.txt";
    default:
      return detected === "JSON" ? `output-${fallback}.json` : `output-${fallback}.txt`;
  }
}

const COPY_OK_MESSAGE = "✓ Copied";
const COPY_FAIL_MESSAGE = "Clipboard blocked — copy manually with Ctrl/Cmd+C";
const PASTE_FAIL_MESSAGE = "Clipboard unavailable — paste manually with Ctrl/Cmd+V";

export function Workspace({ mode, onSelectTool }: WorkspaceProps) {
  const [view, setView] = usePersistedState<ViewMode>("devtools-view-mode", "single");
  const [autoOn, setAutoOn] = usePersistedState<boolean>("devtools-auto-mode", true);
  const [wordWrap, setWordWrap] = usePersistedState<boolean>("devtools-word-wrap", false);
  const { isFullscreen, toggle, overlayClassName } = useFullscreen();

  // Raw text the user entered. Never rewritten by transformations.
  const [userInput, setUserInput] = useState("");
  // Single-view editor content: raw while typing, transformed once stable.
  const [displayed, setDisplayed] = useState("");
  // Transient clipboard feedback shown in the editor action bar.
  const [feedback, setFeedback] = useState<string | null>(null);

  const userInputRef = useRef("");
  const displayedRef = useRef("");
  const lastProgrammaticRef = useRef<string | null>(null);
  const restoredRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);

  const { result, isProcessing } = useAutoProcessing({
    input: userInput,
    mode,
    autoEnabled: autoOn,
  });

  useEffect(() => {
    userInputRef.current = userInput;
  }, [userInput]);

  // Switching tools is an explicit new intent — end any "restore original"
  // hold, otherwise manual-tool output would never reach the editor.
  useEffect(() => {
    restoredRef.current = false;
  }, [mode]);

  const showFeedback = useCallback((text: string) => {
    setFeedback(text);
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const applyResultToDisplay = useCallback((current: TransformationResult | null) => {
    if (!current) {
      return;
    }
    if (current.originalInput !== userInputRef.current) {
      return; // stale — the result no longer matches what the user typed
    }
    if (restoredRef.current) {
      return; // user asked to keep the original input on screen
    }
    const target = current.success ? current.output : current.originalInput;
    if (displayedRef.current !== target) {
      displayedRef.current = target;
      lastProgrammaticRef.current = target;
      setDisplayed(target);
    }
  }, []);

  useEffect(() => {
    applyResultToDisplay(result);
  }, [result, applyResultToDisplay]);

  const handleUserChange = useCallback((value: string) => {
    restoredRef.current = false;
    userInputRef.current = value;
    lastProgrammaticRef.current = null;
    displayedRef.current = value;
    setUserInput(value);
    setDisplayed(value);
  }, []);

  const handleSingleChange = useCallback(
    (value: string) => {
      if (lastProgrammaticRef.current !== null && value === lastProgrammaticRef.current) {
        lastProgrammaticRef.current = null;
        return; // echoed programmatic update — never treat as user input
      }
      handleUserChange(value);
    },
    [handleUserChange],
  );

  const handleRestore = useCallback(() => {
    restoredRef.current = true;
    const raw = userInputRef.current;
    lastProgrammaticRef.current = raw;
    displayedRef.current = raw;
    setDisplayed(raw);
  }, []);

  const handleViewChange = useCallback(
    (next: ViewMode) => {
      if (next === "single") {
        const target =
          result && result.success && result.originalInput === userInputRef.current
            ? result.output
            : userInputRef.current;
        lastProgrammaticRef.current = target;
        displayedRef.current = target;
        setDisplayed(target);
      }
      setView(next);
    },
    [result, setView],
  );

  const onToggleAuto = useCallback(() => {
    setAutoOn((current) => !current);
  }, [setAutoOn]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUserChange(text);
      } else {
        showFeedback("Clipboard is empty");
      }
    } catch {
      showFeedback(PASTE_FAIL_MESSAGE);
    }
  }, [handleUserChange, showFeedback]);

  const copyWithFeedback = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text);
      showFeedback(ok ? COPY_OK_MESSAGE : COPY_FAIL_MESSAGE);
    },
    [showFeedback],
  );

  const clearAll = useCallback(() => {
    restoredRef.current = false;
    userInputRef.current = "";
    displayedRef.current = "";
    lastProgrammaticRef.current = null;
    setUserInput("");
    setDisplayed("");
    setFeedback(null);
  }, []);

  const clearOutput = useCallback(() => {
    restoredRef.current = false;
    displayedRef.current = "";
    lastProgrammaticRef.current = null;
    setDisplayed("");
  }, []);

  // Derived values shared by both views — the transformation engine is single-sourced.
  const sameSource = result?.originalInput === userInput;

  const outputText = (() => {
    if (!result || !sameSource) {
      return "";
    }
    return result.success ? result.output : result.originalInput;
  })();

  const singleLanguage: Language =
    result?.success && result.originalInput === userInput && result.detectedType === "JSON"
      ? "json"
      : "text";

  const outputLanguage: Language =
    result?.success && result.detectedType === "JSON" ? "json" : "text";

  const inputCounts = useMemo(() => getTextCounts(userInput), [userInput]);
  const outputCounts = useMemo(() => getTextCounts(outputText), [outputText]);
  const displayedCounts = useMemo(() => getTextCounts(displayed), [displayed]);

  const errorLocation = useMemo(
    () =>
      result && !result.success && result.errorLine !== undefined && result.errorColumn !== undefined
        ? { line: result.errorLine, column: result.errorColumn }
        : null,
    [result],
  );

  const status: StatusData = (() => {
    if (mode === AUTO_DETECT) {
      if (!autoOn) {
        return { kind: "info", text: "Auto Detect is OFF — pick a manual tool or re-enable it." };
      }
      if (isProcessing) {
        return { kind: "neutral", text: "Analyzing input…" };
      }
      if (!userInput.trim()) {
        return {
          kind: "neutral",
          text: "Paste JSON or Base64 — it will be detected and transformed automatically.",
        };
      }
      if (result && result.success) {
        return { kind: "success", text: result.message };
      }
      if (result) {
        return { kind: "error", text: result.message };
      }
      return { kind: "neutral", text: "Waiting for input…" };
    }

    if (isProcessing) {
      return { kind: "neutral", text: `Applying ${TOOL_META[mode].label}…` };
    }
    if (result) {
      return result.success
        ? { kind: "success", text: result.message }
        : { kind: "error", text: result.message };
    }
    return {
      kind: "info",
      text: `Manual tool: ${TOOL_META[mode].label} — auto-detection is disabled.`,
    };
  })();

  const singleLabel = displayed === userInput ? "Input" : "Output";

  const goToError = useCallback(() => {
    if (errorLocation) {
      moveEditorToLineColumn(errorLocation.line, errorLocation.column);
    }
  }, [errorLocation]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className={isFullscreen ? "fixed inset-x-0 top-0 z-[60]" : ""}>
        <WorkspaceToolbar
          view={view}
          onViewChange={handleViewChange}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggle}
          onSelectTool={onSelectTool}
          autoOn={autoOn}
          onToggleAuto={onToggleAuto}
          wordWrap={wordWrap}
          onToggleWordWrap={() => setWordWrap((current) => !current)}
          status={status}
          errorLocation={errorLocation}
          onGoToError={goToError}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-2 sm:px-4">
        {view === "single" ? (
          <SingleView
            title={singleLabel}
            value={displayed}
            onChange={handleSingleChange}
            language={singleLanguage}
            characters={displayedCounts.characters}
            words={displayedCounts.words}
            lines={displayedCounts.lines}
            canRestore={displayed !== userInput && userInput.trim() !== ""}
            onPaste={pasteFromClipboard}
            onCopy={() => void copyWithFeedback(displayedRef.current)}
            onRestore={handleRestore}
            onClear={clearAll}
            onDownload={() => {
              downloadText(
                outputFilename(result, singleLabel.toLowerCase()),
                displayedRef.current,
                displayedRef.current.trim().length > 0 && displayed.startsWith("{")
                  ? "application/json"
                  : "text/plain",
              );
            }}
            feedback={feedback}
            defaultHint="⌘F find · ⌘↵ copy"
            isFullscreen={isFullscreen}
            overlayClassName={overlayClassName}
            wordWrap={wordWrap}
          />
        ) : (
          <SplitView
            input={userInput}
            onInputChange={handleUserChange}
            inputLanguage="text"
            inputCharacters={inputCounts.characters}
            inputWords={inputCounts.words}
            inputLines={inputCounts.lines}
            onPaste={pasteFromClipboard}
            onClearInput={clearAll}
            onCopyInput={() => void copyWithFeedback(userInput)}
            output={outputText}
            outputLanguage={outputLanguage}
            outputCharacters={outputCounts.characters}
            outputWords={outputCounts.words}
            outputLines={outputCounts.lines}
            onCopyOutput={() => void copyWithFeedback(outputText)}
            onDownload={() => {
              downloadText(
                outputFilename(result, "decoded"),
                outputText,
                outputLanguage === "json" ? "application/json" : "text/plain",
              );
            }}
            onClearOutput={clearOutput}
            feedback={feedback}
            isFullscreen={isFullscreen}
            wordWrap={wordWrap}
          />
        )}
      </div>
    </div>
  );
}