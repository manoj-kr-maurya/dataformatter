"use client";

import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import type { Language } from "@/types/tools";
import { editorTheme, jsonHighlightStyle } from "@/components/editor/codemirror-theme";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: Language;
  readOnly?: boolean;
  placeholder?: string;
  ariaLabel: string;
}

const baseExtensions = [jsonHighlightStyle];

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  placeholder,
  ariaLabel,
}: CodeEditorProps) {
  const extensions = language === "json" ? [json(), ...baseExtensions] : baseExtensions;

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={editorTheme}
      readOnly={readOnly}
      editable={!readOnly}
      placeholder={placeholder ?? ""}
      basicSetup={{
        lineNumbers: true,
        foldGutter: language === "json",
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
        highlightSelectionMatches: false,
      }}
      aria-label={ariaLabel}
    />
  );
}