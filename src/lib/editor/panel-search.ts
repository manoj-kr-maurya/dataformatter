import { openSearchPanel } from "@codemirror/search";
import { EditorView } from "@codemirror/view";

/**
 * Open CodeMirror's search panel in the most recently used editor — the
 * focused one if any, otherwise the first editor on the page. Used by the
 * toolbar's Search button so it surfaces the same ⌘F search.
 */
export function openEditorSearch(): void {
  const views = Array.from(document.querySelectorAll<HTMLElement>(".cm-editor"))
    .map((el) => EditorView.findFromDOM(el))
    .filter((view): view is EditorView => view !== null);
  const target = views.find((view) => view.hasFocus) ?? views[0];
  if (target) {
    openSearchPanel(target);
  }
}