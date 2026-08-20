import { EditorView } from "@codemirror/view";

let panel: HTMLDivElement | null = null;

/** Jump the focused/active editor to the start of a 1-based line. */
export function jumpToLine(view: EditorView, lineNumber: number): void {
  const lineCount = view.state.doc.lines;
  const line = Math.min(Math.max(lineNumber, 1), lineCount);
  const pos = view.state.doc.line(line).from;
  view.dispatch({
    selection: { anchor: pos },
    effects: EditorView.scrollIntoView(pos),
  });
  view.focus();
}

function closeGoToLine(view: EditorView): void {
  if (panel) {
    panel.remove();
    panel = null;
    view.focus();
  }
}

/**
 * Open a small "go to line" prompt over the focused editor (or the first one).
 * Enter jumps to the line, Escape dismisses. Uses inline styles so it cannot
 * be purged by Tailwind.
 */
export function openGoToLine(): void {
  const views = Array.from(document.querySelectorAll<HTMLElement>(".cm-editor"))
    .map((el) => EditorView.findFromDOM(el))
    .filter((view): view is EditorView => view !== null);
  const target = views.find((view) => view.hasFocus) ?? views[0];
  if (!target) {
    return;
  }

  closeGoToLine(target);
  const host = target.dom.closest(".cm-editor") ?? document.body;

  panel = document.createElement("div");
  const style = panel.style;
  style.position = "absolute";
  style.top = "8px";
  style.right = "8px";
  style.zIndex = "50";
  style.display = "flex";
  style.alignItems = "center";
  style.gap = "8px";
  style.padding = "8px 10px";
  style.borderRadius = "8px";
  style.border = "1px solid rgb(228 228 231)";
  style.background = "rgb(255 255 255)";
  style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.12)";
  style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  style.fontSize = "12px";
  style.color = "rgb(63 63 70)";

  const label = document.createElement("span");
  label.textContent = "Go to line";
  style.color = "rgb(113 113 122)";

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.setAttribute("aria-label", "Line number");
  input.style.width = "72px";
  input.style.padding = "4px 6px";
  input.style.border = "1px solid rgb(212 212 216)";
  input.style.borderRadius = "6px";
  input.style.background = "rgb(255 255 255)";
  input.style.outline = "none";

  const hint = document.createElement("span");
  hint.textContent = `/ ${target.state.doc.lines} lines`;
  hint.style.color = "rgb(113 113 122)";

  const go = () => {
    const value = Number.parseInt(input.value, 10);
    if (Number.isFinite(value)) {
      jumpToLine(target, value);
    }
    closeGoToLine(target);
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      go();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeGoToLine(target);
    }
  });

  panel.append(label, input, hint);
  host.appendChild(panel);
  input.focus();
  input.select();
}