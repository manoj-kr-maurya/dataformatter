import type { SharePayload } from "@/lib/share";
import type { ToolMode } from "@/types/tools";

/**
 * Hand-off between an embedded SEO-page editor and the full app workspace:
 * clicking into the embedded editor snapshots its text here, navigates to the
 * app shell, and the shell restores the exact same tool + content.
 */
const HANDOFF_KEY = "df-editor-handoff";

export interface EditorHandoff {
  /** Tool id string from the source page, validated by the receiver. */
  tool: string | null;
  /** Snapshot of the editor content at click time. */
  input: string;
}

export function saveEditorHandoff(handoff: EditorHandoff): void {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    // Storage unavailable — navigation still happens, just without carry-over.
  }
}

export function consumeEditorHandoff(): EditorHandoff | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) {
      return null;
    }
    sessionStorage.removeItem(HANDOFF_KEY);
    const parsed = JSON.parse(raw) as Partial<EditorHandoff> | null;
    if (!parsed || typeof parsed.input !== "string") {
      return null;
    }
    return {
      tool: typeof parsed.tool === "string" ? parsed.tool : null,
      input: parsed.input,
    };
  } catch {
    return null;
  }
}

/**
 * Best-effort snapshot of the visible editor text: plain textareas expose
 * `.value`, CodeMirror exposes one `.cm-line` element per visual line.
 */
export function readEditorText(root: HTMLElement): string {
  const textarea = root.querySelector("textarea");
  if (textarea instanceof HTMLTextAreaElement) {
    return textarea.value;
  }
  const lines = root.querySelectorAll(".cm-line");
  if (lines.length > 0) {
    return Array.from(lines, (line) => line.textContent ?? "").join("\n");
  }
  return "";
}

/**
 * Build the payload the receiving workspace restores — identical shape to a
 * decoded share link, so the existing restore path applies it unchanged.
 */
export function buildHandoffPayload(tool: ToolMode, input: string): SharePayload {
  return {
    v: 1,
    mode: "single",
    tool,
    autoDetect: true,
    wordWrap: false,
    input,
    display: "input",
  };
}
