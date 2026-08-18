"use client";

import { useMemo, useState, type DragEvent } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { search } from "@codemirror/search";
import { keymap, EditorView } from "@codemirror/view";
import { Prec, type Extension } from "@codemirror/state";
import type { Language } from "@/types/tools";
import { editorTheme, jsonHighlightStyle } from "@/components/editor/codemirror-theme";
import { copyToClipboard } from "@/lib/clipboard/copy";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: Language;
  readOnly?: boolean;
  placeholder?: string;
  ariaLabel: string;
  maxFileBytes?: number;
  wordWrap?: boolean;
}

const baseExtensions = [jsonHighlightStyle];

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  placeholder,
  ariaLabel,
  maxFileBytes = 5 * 1024 * 1024,
  wordWrap = false,
}: CodeEditorProps) {
  const [dragging, setDragging] = useState(false);

  const extensions = useMemo<Extension[]>(() => {
    const list: Extension[] = [
      search(),
      Prec.highest(
        keymap.of([
          {
            // Copy the whole editor with Cmd/Ctrl + Enter, overriding the
            // default insertBlankLine binding.
            key: "Mod-Enter",
            run: (view) => {
              void copyToClipboard(view.state.doc.toString());
              return true;
            },
          },
        ]),
      ),
    ];
    if (language === "json") {
      list.push(json());
    }
    if (wordWrap) {
      list.push(EditorView.lineWrapping);
    }
    list.push(...baseExtensions);
    return list;
  }, [language, wordWrap]);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    const hasFiles = Array.from(event.dataTransfer.types ?? []).includes("Files");
    if (!hasFiles) {
      return; // plain-text drags stay with CodeMirror's own handling
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDragging(false);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) {
      return; // not a file drop — leave it to CodeMirror
    }
    event.preventDefault();
    setDragging(false);

    const file = files[0];
    if (file.size > maxFileBytes) {
      return;
    }
    if (file.type.startsWith("image/")) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.readAsDataURL(file);
      });
      onChange?.(dataUrl);
      return;
    }
    const text = await file.text();
    onChange?.(text);
  }

  return (
    <div
      className={`h-full overflow-hidden ${
        dragging ? "ring-2 ring-violet-500 ring-inset" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
          highlightSelectionMatches: true,
        }}
        aria-label={ariaLabel}
      />
    </div>
  );
}