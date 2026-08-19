"use client";

import { useMemo, useState, type DragEvent } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { search } from "@codemirror/search";
import { codeFolding, foldService } from "@codemirror/language";
import { keymap, EditorView } from "@codemirror/view";
import { Prec, type Extension } from "@codemirror/state";
import type { Language } from "@/types/tools";
import { editorTheme, jsonHighlightStyle } from "@/components/editor/codemirror-theme";
import { copyToClipboard } from "@/lib/clipboard/copy";
import { openGoToLine } from "@/lib/editor/go-to-line";

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

/**
 * Instant fold ranges for JSON objects/arrays. Unlike the syntax-tree-based
 * fold service (which only produces arrows once the document finishes parsing),
 * this scans braces directly so the collapse arrows appear the moment the
 * JSON lands in the editor.
 */
const jsonFoldService: Extension = foldService.of((state, lineStart) => {
  const line = state.doc.lineAt(lineStart);
  const match = /[\[{]/.exec(line.text);
  if (!match || match.index === undefined) {
    return null;
  }
  const open = match[0];
  const close = open === "{" ? "}" : "]";
  const from = line.from + match.index;
  let depth = 1;
  let inString = false;
  let escaped = false;
  const text = state.doc.sliceString(from + 1);
  const max = Math.min(text.length, 100_000);
  for (let i = 0; i < max; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        return { from, to: from + 1 + i + 1 };
      }
    }
  }
  return null;
});

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
          {
            // Go to line (Cmd/Ctrl + Shift + L).
            key: "Mod-Shift-L",
            run: () => {
              openGoToLine();
              return true;
            },
          },
        ]),
      ),
    ];
    if (language === "json") {
      // codeFolding() provides the fold state behind the fold gutter; the
      // custom foldService makes collapse arrows render instantly instead of
      // waiting for the syntax-tree parse to finish.
      list.push(json(), codeFolding(), jsonFoldService);
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