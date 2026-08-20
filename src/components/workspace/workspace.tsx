"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SingleView } from "@/components/workspace/single-view";
import { SplitView } from "@/components/workspace/split-view";
import { WorkspaceToolbar } from "@/components/workspace/workspace-toolbar";
import {
  type StatusKind,
} from "@/components/status/transform-status";
import { useFullscreen } from "@/components/editor/fullscreen";
import { ShareToast } from "@/components/ui/share-toast";
import type { ShareNotice } from "@/components/ui/share-toast";
import { useAutoProcessing } from "@/hooks/useAutoProcessing";
import { usePersistedState } from "@/hooks/usePersistedState";
import { copyToClipboard } from "@/lib/clipboard/copy";
import { downloadText } from "@/lib/download";
import { moveEditorToLineColumn } from "@/lib/editor/go-to-error";
import { createShareLink, isStoredOutputRequired, looksSensitive, SHARE_SCHEMA_VERSION } from "@/lib/share";
import { AUTO_DETECT, TOOL_META, transform } from "@/lib/tools";
import { getTextCounts } from "@/lib/text/counts";
import type { ShareLinkResult } from "@/lib/share";
import type { SharePayload } from "@/lib/share";
import type { Language, ToolMode, ViewMode } from "@/types/tools";
import type { TransformationResult } from "@/types/transformation";

interface StatusData {
  kind: StatusKind;
  text: string;
}

interface WorkspaceProps {
  mode: ToolMode;
  onSelectTool: (mode: ToolMode) => void;
  /** Data restored from the #/share URL fragment, if one is present. */
  restorePayload?: SharePayload | null;
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

const COPY_FAIL_MESSAGE = "Clipboard blocked — copy manually with Ctrl/Cmd+C";
const PASTE_FAIL_MESSAGE = "Clipboard unavailable — paste manually with Ctrl/Cmd+V";
const COPY_FEEDBACK_MS = 1600;

export function Workspace({ mode, onSelectTool, restorePayload }: WorkspaceProps) {
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
  // Transient "✓ Copied" state shown directly on the Copy button.
  const [copied, setCopied] = useState(false);
  // Output restored from a share link — takes precedence over the derived
  // result so the exact shared output is reproduced (e.g. random generators).
  const [restoredOutput, setRestoredOutput] = useState<string | null>(null);
  // Toast surfaced by the Share flow.
  const [shareNotice, setShareNotice] = useState<ShareNotice | null>(null);
  // Tool id the current restored output came from, so a different tool resets it.
  const restoredModeRef = useRef<ToolMode>(mode);

  const userInputRef = useRef("");
  const displayedRef = useRef("");
  const lastProgrammaticRef = useRef<string | null>(null);
  const restoredRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);
  const copiedTimerRef = useRef<number | null>(null);
  const restoredOutputRef = useRef<string | null>(null);

  const showShareNotice = useCallback((notice: ShareNotice) => {
    setShareNotice(notice);
  }, []);

  useEffect(() => {
    restoredOutputRef.current = restoredOutput;
  }, [restoredOutput]);

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

  // A changed tool (or auto toggle) invalidates a previously-restored output;
  // only the tool that produced the shared output may keep showing it.
  useEffect(() => {
    if (mode !== restoredModeRef.current) {
      setRestoredOutput(null);
      restoredModeRef.current = mode;
    }
  }, [mode, autoOn]);

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
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
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
    setRestoredOutput(null);
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

  // Apply state restored from a #/share/<...> URL fragment.
  useEffect(() => {
    if (!restorePayload) {
      return;
    }
    const payload = restorePayload;
    setView(payload.mode);
    setAutoOn(payload.autoDetect);
    setWordWrap(payload.wordWrap);
    restoredModeRef.current = payload.tool;
    // Equivalent of handleUserChange(payload.input), inlined so every state
    // write is guarded — the editor starts from the raw shared input.
    restoredRef.current = false;
    lastProgrammaticRef.current = null;
    if (userInputRef.current !== payload.input) {
      userInputRef.current = payload.input;
      setUserInput(payload.input);
    }
    if (displayedRef.current !== payload.input) {
      displayedRef.current = payload.input;
      setDisplayed(payload.input);
    }
    // Non-deterministic tools (random generators) embed their output verbatim;
    // deterministic tools recompute it from the input, keeping links small.
    const storeOutput = isStoredOutputRequired(payload.tool);
    if (payload.mode === "single") {
      let target = payload.input;
      if (payload.display === "output") {
        if (storeOutput) {
          target = payload.output ?? payload.input;
        } else {
          // Recompute the deterministic output now so the restored view shows
          // it immediately, without a flash of the raw input.
          const computed = transform(payload.tool, payload.autoDetect, payload.input);
          target = computed.success ? computed.output : payload.input;
        }
      }
      // Guarded like applyResultToDisplay: only push state when the content
      // actually changed, so the transform pipeline never fights the restore.
      if (displayedRef.current !== target) {
        lastProgrammaticRef.current = target;
        displayedRef.current = target;
        setDisplayed(target);
      }
      // Freeze the content until the user types — but only when it will not
      // already be refreshed by the transform pipeline (raw-input view, or a
      // verbatim stored random output).
      restoredRef.current = !(payload.display === "output" && !storeOutput);
      if (restoredOutputRef.current !== null) {
        setRestoredOutput(null);
      }
    } else {
      if (storeOutput && restoredOutputRef.current !== payload.output) {
        setRestoredOutput(payload.output ?? "");
      } else if (!storeOutput && restoredOutputRef.current !== null) {
        setRestoredOutput(null);
      }
    }
    // The persisted setters are purposefully excluded: a restore must apply
    // exactly once per incoming payload, not whenever a stored pref changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restorePayload]);

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
      if (ok) {
        setCopied(true);
        if (copiedTimerRef.current !== null) {
          window.clearTimeout(copiedTimerRef.current);
        }
        copiedTimerRef.current = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
      } else {
        showFeedback(COPY_FAIL_MESSAGE);
      }
    },
    [showFeedback],
  );

  // Every kind of share embeds the user's data into a URL, so the feedback below
// always says so explicitly — the URL itself carries the input/output.
function shareDataNotice(message: string, payload: SharePayload): ShareNotice {
  const sensitive = looksSensitive(payload.input, payload.output ?? "");
  const detail = sensitive
    ? "This URL looks like it contains secrets. Anyone with the link can view it — share only with people you trust."
    : "This URL contains your data — anyone with the link can view it. Avoid sharing secrets, JWTs, tokens, or passwords this way.";
  return { tone: "warning", message, detail };
}

function isTooLarge(link: { tooLarge: boolean }): boolean {
  return link.tooLarge;
}

function tooLargeNotice(): ShareNotice {
  return {
    tone: "error",
    message: "This data is too large to reliably share as a URL.",
    detail: "Nothing was truncated — use the Download button to keep it locally.",
  };
}

function copyFailNotice(detail: string): ShareNotice {
  return { tone: "error", message: "Unable to copy link. Copy it manually.", detail };
}

// Build the compressed, self-contained URL for the current workspace state.
// Everything happens locally — the payload lives only in the URL fragment.
const buildShareLink = useCallback(async (): Promise<ShareLinkResult | null> => {
  const input = userInputRef.current;
  const derived = result && result.originalInput === input ? result.output : "";
  // Split view shares what's shown in the output pane (which may be a restored
  // output). Single view shares the transform result and records what content
  // was on screen.
  const output =
    view === "split" && restoredOutputRef.current !== null
      ? restoredOutputRef.current
      : derived;
  // Deterministic tools regenerate their output from the input on restore, so
  // the URL only embeds the input — the biggest link-size win.
  const storeOutput = isStoredOutputRequired(mode);

  const payload: SharePayload = {
    v: SHARE_SCHEMA_VERSION,
    mode: view,
    tool: mode,
    autoDetect: autoOn,
    wordWrap,
    input,
    output: storeOutput ? output : undefined,
    display: view === "single" ? (displayedRef.current === input ? "input" : "output") : "output",
  };

  try {
    return await createShareLink(payload);
  } catch {
    showShareNotice({ tone: "error", message: "Could not build a share link for this data." });
    return null;
  }
}, [view, mode, autoOn, wordWrap, result, showShareNotice]);

const handleCopyShareLink = useCallback(async () => {
  const link = await buildShareLink();
  if (!link) {
    return;
  }
  if (isTooLarge(link)) {
    showShareNotice(tooLargeNotice());
    return;
  }
  const ok = await copyToClipboard(link.url);
  if (ok) {
    showShareNotice(shareDataNotice("Link copied", link.payload));
  } else {
    showShareNotice(copyFailNotice(link.url));
  }
}, [buildShareLink, showShareNotice]);

const handleNativeShare = useCallback(async () => {
  const link = await buildShareLink();
  if (!link) {
    return;
  }
  if (isTooLarge(link)) {
    showShareNotice(tooLargeNotice());
    return;
  }
  try {
    await navigator.share({ title: "DataFormatter share", url: link.url });
    showShareNotice(shareDataNotice("Link shared", link.payload));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return; // user cancelled the share sheet — do nothing
    }
    // Web Share failed (e.g. blocked on insecure origins) — fall back to copy.
    const ok = await copyToClipboard(link.url);
    if (ok) {
      showShareNotice(shareDataNotice("Link copied", link.payload));
    } else {
      showShareNotice(copyFailNotice(link.url));
    }
  }
}, [buildShareLink, showShareNotice]);

const nativeShareAvailable =
  typeof navigator !== "undefined" && typeof navigator.share === "function";

  const clearAll = useCallback(() => {
    restoredRef.current = false;
    userInputRef.current = "";
    displayedRef.current = "";
    lastProgrammaticRef.current = null;
    setRestoredOutput(null);
    setUserInput("");
    setDisplayed("");
    setFeedback(null);
    setCopied(false);
  }, []);

  // Derived values shared by both views — the transformation engine is single-sourced.
  const sameSource = result?.originalInput === userInput;

  const outputText = (() => {
    if (restoredOutput !== null) {
      // Preserve the exact output captured at share time.
      return restoredOutput;
    }
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
            onCopyShareLink={() => void handleCopyShareLink()}
            onNativeShare={
              nativeShareAvailable ? () => void handleNativeShare() : undefined
            }
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
            copied={copied}
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
            output={outputText}
            outputLanguage={outputLanguage}
            outputCharacters={outputCounts.characters}
            outputWords={outputCounts.words}
            outputLines={outputCounts.lines}
            onCopyOutput={() => void copyWithFeedback(outputText)}
            onCopyShareLink={() => void handleCopyShareLink()}
            onNativeShare={
              nativeShareAvailable ? () => void handleNativeShare() : undefined
            }
            onDownload={() => {
              downloadText(
                outputFilename(result, "decoded"),
                outputText,
                outputLanguage === "json" ? "application/json" : "text/plain",
              );
            }}
            feedback={feedback}
            copied={copied}
            isFullscreen={isFullscreen}
            wordWrap={wordWrap}
          />
        )}
      </div>

      {shareNotice && (
        <ShareToast notice={shareNotice} onDismiss={() => setShareNotice(null)} />
      )}
    </div>
  );
}