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
  ".cm-panel.cm-search": {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "4px 6px",
    padding: "6px 8px",
    position: "relative",
    backgroundColor: "var(--editor-gutter-bg)",
    borderTop: "1px solid var(--editor-active-line)",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontSize: "12px",
    "& input, & button, & label": {
      margin: "0",
    },
    "& br": {
      display: "none",
    },
    "& .cm-textfield": {
      flex: "1 1 140px",
      minWidth: "130px",
      padding: "5px 10px",
      fontSize: "12px",
      fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
      color: "var(--editor-fg)",
      backgroundColor: "var(--editor-bg)",
      border: "1px solid color-mix(in srgb, var(--editor-line-number) 50%, transparent)",
      borderRadius: "6px",
      outline: "none",
      "&:focus": {
        borderColor: "var(--editor-cursor)",
        boxShadow: "0 0 0 2px var(--editor-selection)",
      },
      "&::placeholder": {
        color: "var(--editor-line-number)",
      },
      "&[name='replace']": {
        flex: "1 1 160px",
        maxWidth: "320px",
      },
    },
    "& .cm-button": {
      padding: "4px 10px",
      fontSize: "12px",
      fontWeight: 500,
      lineHeight: "18px",
      borderRadius: "6px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      "&:focus": {
        outline: "none",
        boxShadow: "0 0 0 2px var(--editor-selection)",
      },
    },
    "& label": {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "3px 6px",
      fontSize: "11px",
      lineHeight: "16px",
      color: "var(--editor-line-number)",
      borderRadius: "6px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      userSelect: "none",
      "&:hover": {
        color: "var(--editor-fg)",
        backgroundColor: "var(--editor-active-line)",
      },
    },
    "& input[type='checkbox']": {
      margin: "0",
      accentColor: "var(--editor-cursor)",
    },
    "& [name='close']": {
      position: "static",
      margin: "0 0 0 auto",
      padding: "2px 8px",
      fontSize: "15px",
      lineHeight: "20px",
      color: "var(--editor-line-number)",
      backgroundColor: "transparent",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      "&:hover": {
        color: "var(--editor-fg)",
        backgroundColor: "var(--editor-active-line)",
      },
    },
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