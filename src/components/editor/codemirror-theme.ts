import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

export const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--editor-fg)",
    fontSize: "13px",
    fontFamily:
      "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    height: "100%",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    lineHeight: "1.65",
  },
  ".cm-content": {
    caretColor: "var(--editor-cursor)",
    padding: "10px 0",
  },
  ".cm-gutters": {
    backgroundColor: "var(--editor-gutter-bg)",
    color: "var(--editor-line-number)",
    border: "none",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--editor-active-line)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px 0 12px",
    minWidth: "2.4rem",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--editor-active-line)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--editor-selection) !important",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--editor-cursor)",
  },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
    {
      backgroundColor: "var(--editor-selection) !important",
    },
});

export const jsonHighlightStyle = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.propertyName, color: "var(--json-property)" },
    { tag: tags.string, color: "var(--json-string)" },
    { tag: tags.number, color: "var(--json-number)" },
    { tag: [tags.bool, tags.null], color: "var(--json-boolean)" },
    { tag: [tags.brace, tags.squareBracket], color: "var(--editor-fg)" },
    { tag: tags.separator, color: "var(--editor-line-number)" },
  ]),
);