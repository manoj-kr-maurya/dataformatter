import { EditorView } from "@codemirror/view";

/**
 * Move the cursor to a 1-based line/column in the most recently used editor
 * (focused one if any, otherwise the first on the page) and scroll it into
 * view. Clamps to the document bounds so it never errors on stale locations.
 */
export function moveEditorToLineColumn(line: number, column: number): void {
  const views = Array.from(document.querySelectorAll<HTMLElement>(".cm-editor"))
    .map((el) => EditorView.findFromDOM(el))
    .filter((view): view is EditorView => view !== null);
  const target = views.find((view) => view.hasFocus) ?? views[0];
  if (!target) {
    return;
  }

  const lineCount = target.state.doc.lines;
  const lineObj = target.state.doc.line(Math.min(Math.max(line, 1), lineCount));
  const columnOffset = Math.min(Math.max(column - 1, 0), lineObj.length);
  const anchor = lineObj.from + columnOffset;

  target.dispatch({
    selection: { anchor },
    effects: EditorView.scrollIntoView(anchor, { y: "center" }),
  });
  target.focus();
}