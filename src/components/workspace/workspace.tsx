"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AutoDetectToggle } from "@/components/workspace/auto-detect-toggle";
import { SingleView } from "@/components/workspace/single-view";
import { SplitView } from "@/components/workspace/split-view";
import { ViewToggle } from "@/components/workspace/view-toggle";
import {
  TransformStatus,
  type StatusKind,
} from "@/components/status/transform-status";
import { useAutoProcessing } from "@/hooks/useAutoProcessing";
import { usePersistedState } from "@/hooks/usePersistedState";
import { copyToClipboard } from "@/lib/clipboard/copy";
import { downloadText } from "@/lib/download";
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
}

function outputFilename(detectedType: TransformationResult["detectedType"]): string {
  return detectedType === "JSON" ? "devtools-output.json" : "devtools-output.txt";
}

export function Workspace({ mode }: WorkspaceProps) {
  const [view, setView] = usePersistedState<ViewMode>("devtools-view-mode", "single");
  const [autoOn, setAutoOn] = usePersistedState<boolean>("devtools-auto-mode", true);

  // Raw text the user entered. Never rewritten by transformations.
  const [userInput, setUserInput] = useState("");
  // Single-view editor content: raw while typing, transformed once stable.
  const [displayed, setDisplayed] = useState("");

  const userInputRef = useRef("");
  const displayedRef = useRef("");
  const lastProgrammaticRef = useRef<string | null>(null);
  const restoredRef = useRef(false);

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

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUserChange(text);
      }
    } catch {
      // Clipboard access denied — the user can use the keyboard shortcut.
    }
  }, [handleUserChange]);

  const clearAll = useCallback(() => {
    restoredRef.current = false;
    userInputRef.current = "";
    displayedRef.current = "";
    lastProgrammaticRef.current = null;
    setUserInput("");
    setDisplayed("");
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

  const inputCounts = getTextCounts(userInput);
  const outputCounts = getTextCounts(outputText);
  const displayedCounts = getTextCounts(displayed);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 py-2 sm:px-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <AutoDetectToggle enabled={autoOn} onChange={setAutoOn} />
        <ViewToggle view={view} onChange={handleViewChange} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {view === "single" ? (
          <SingleView
            value={displayed}
            onChange={handleSingleChange}
            language={singleLanguage}
            characters={displayedCounts.characters}
            words={displayedCounts.words}
            lines={displayedCounts.lines}
            canRestore={displayed !== userInput && userInput.trim() !== ""}
            onPaste={pasteFromClipboard}
            onCopy={() => void copyToClipboard(displayedRef.current)}
            onRestore={handleRestore}
            onClear={clearAll}
            onDownload={() => {
              const detected = result?.success ? result.detectedType : "TEXT";
              downloadText(outputFilename(detected), displayedRef.current);
            }}
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
            output={outputText}
            outputLanguage={outputLanguage}
            outputCharacters={outputCounts.characters}
            outputWords={outputCounts.words}
            outputLines={outputCounts.lines}
            onCopy={() => void copyToClipboard(outputText)}
            onDownload={() => {
              const detected = result?.success ? result.detectedType : "TEXT";
              downloadText(outputFilename(detected), outputText);
            }}
            onClearOutput={clearOutput}
          />
        )}
      </div>

      <div className="shrink-0">
        <TransformStatus status={status} />
      </div>
    </div>
  );
}