// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorView } from "@codemirror/view";
import { Workspace } from "@/components/workspace/workspace";

const RAW_B64 = "eyJmb28iOiJiYXIifQ==";
const PRETTY = "{\n  \"foo\": \"bar\"\n}";
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

function editors(container?: HTMLElement): EditorView[] {
  const root = container ?? document.body;
  return Array.from(root.querySelectorAll<HTMLElement>(".cm-editor"))
    .map((el) => EditorView.findFromDOM(el))
    .filter((view): view is EditorView => view !== null);
}

function setText(view: EditorView, text: string): void {
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
}

function editorDoc(view: EditorView): string {
  return view.state.doc.toString();
}

async function waitForEditor(container: HTMLElement): Promise<EditorView> {
  await waitFor(() => {
    expect(editors(container).length).toBeGreaterThan(0);
  });
  return editors(container)[0];
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Workspace — single view (default)", () => {
  it("auto-detects Base64 JSON and pretty-prints it in place", async () => {
    const { container } = render(<Workspace />);

    const view = await waitForEditor(container);
    setText(view, RAW_B64);

    await waitFor(
      () => {
        expect(editorDoc(view)).toBe(PRETTY);
      },
      { timeout: 2500 },
    );

    expect(screen.getByRole("status")).toHaveTextContent("Base64 decoded and JSON pretty-printed");
  });

  it("Restore Original returns the editor to the raw pasted text", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace />);

    const view = await waitForEditor(container);
    setText(view, RAW_B64);
    await waitFor(
      () => expect(editorDoc(view)).toBe(PRETTY),
      { timeout: 2500 },
    );

    await user.click(screen.getByRole("button", { name: /Restore Original/i }));
    expect(editorDoc(view)).toBe(RAW_B64);

    const restoreButton = screen.getByRole("button", { name: /Restore Original/i });
    expect(restoreButton).toBeDisabled();
  });

  it("keeps the original text when an unknown value is pasted", async () => {
    const { container } = render(<Workspace />);
    const view = await waitForEditor(container);
    setText(view, "just some text");
    await waitFor(
      () => {
        expect(screen.getByRole("status")).toHaveTextContent("Unable to automatically detect");
      },
      { timeout: 2500 },
    );
    expect(editorDoc(view)).toBe("just some text");
  });

it("decodes a pasted JWT into formatted header and payload", async () => {
    const { container } = render(<Workspace />);
    const view = await waitForEditor(container);
    setText(view, JWT);

    await waitFor(
      () => {
        expect(editorDoc(view)).toContain("HEADER\n");
        expect(editorDoc(view)).toContain('"alg": "HS256"');
        expect(editorDoc(view)).toContain("\"name\": \"John Doe\"");
      },
      { timeout: 2500 },
    );
    expect(screen.getByRole("status")).toHaveTextContent("JWT decoded — header and payload shown");
  });

  it("decodes a JWT pasted with a Bearer prefix", async () => {
    const { container } = render(<Workspace />);
    const view = await waitForEditor(container);
    setText(view, `Bearer ${JWT}`);

    await waitFor(
      () => {
        expect(editorDoc(view)).toContain("\"name\": \"John Doe\"");
      },
      { timeout: 2500 },
    );
    expect(screen.getByRole("status")).toHaveTextContent("JWT decoded — header and payload shown");
  });

  it("decodes a JWT embedded in surrounding text", async () => {
    const { container } = render(<Workspace />);
    const view = await waitForEditor(container);
    setText(view, `abcd ${JWT} please verify`);

    await waitFor(
      () => {
        expect(editorDoc(view)).toContain("\"name\": \"John Doe\"");
      },
      { timeout: 2500 },
    );
    expect(screen.getByRole("status")).toHaveTextContent("JWT decoded — header and payload shown");
  });
});

describe("Workspace — split view", () => {
  it("renders input and output panes and applies transforms", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace />);

    const view = await waitForEditor(container);
    setText(view, RAW_B64);
    await waitFor(
      () => expect(editorDoc(view)).toBe(PRETTY),
      { timeout: 2500 },
    );

    await user.click(screen.getByRole("button", { name: /Split/i }));

    let split: EditorView[];
    await waitFor(() => {
      split = editors();
      expect(split.length).toBe(2);
    });
    split = editors();
    const [inputView, outputView] = split;
    expect(editorDoc(inputView)).toBe(RAW_B64);
    expect(editorDoc(outputView)).toBe(PRETTY);
  });

  it("persists the Split preference across re-renders", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace />);
    await waitForEditor(container);
    await user.click(screen.getByRole("button", { name: /Split/i }));

    expect(JSON.parse(localStorage.getItem("devtools-view-mode") ?? "null")).toBe("split");

    cleanup();
    const second = render(<Workspace />);
    await waitFor(() => expect(editors(second.container).length).toBe(2));
  });
});

describe("Workspace — manual tools and Auto Detect toggle", () => {
  it("runs a manual tool even when typing, without auto-detection", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace />);

    const view = await waitForEditor(container);
    setText(view, '{\n  "a": 1,\n  "b": [1, 2]\n}');

    await user.click(screen.getByRole("tab", { name: /JSON Minify/i }));

    await waitFor(
      () => {
        expect(editorDoc(view)).toBe('{"a":1,"b":[1,2]}');
      },
      { timeout: 2500 },
    );
    expect(screen.getByRole("status")).toHaveTextContent("JSON minified");
  });

  it("Base64 Encode works with Auto Detect turned OFF", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace />);

    const view = await waitForEditor(container);

    // Turn auto-detection off first, then pick the Base64 Encode tool.
    await user.click(screen.getByRole("switch", { name: /Auto Detect/i }));
    await user.click(screen.getByRole("tab", { name: /Base64 Encode/i }));

    setText(view, "hello");

    await waitFor(
      () => {
        expect(editorDoc(view)).toBe("aGVsbG8=");
      },
      { timeout: 2500 },
    );
    expect(screen.getByRole("status")).toHaveTextContent("Base64 encoded");
  });

  it("Base64 Encode still applies after a Restore Original click, while Auto-detect is off", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace />);

    const view = await waitForEditor(container);

    // 1. Paste JSON, wait for the auto-pretty-print, then restore the original raw text.
    setText(view, '{"a":1}');
    await waitFor(
      () => expect(editorDoc(view)).toBe('{\n  "a": 1\n}'),
      { timeout: 2500 },
    );
    await user.click(screen.getByRole("button", { name: /Restore Original/i }));
    expect(editorDoc(view)).toBe('{"a":1}');

    // 2. Turn auto-detect off and pick Base64 Encode — the tool output must show,
    //    not be swallowed by the earlier "restore" flag.
    await user.click(screen.getByRole("switch", { name: /Auto Detect/i }));
    await user.click(screen.getByRole("tab", { name: /Base64 Encode/i }));

    await waitFor(
      () => {
        expect(editorDoc(view)).toBe("eyJhIjoxfQ==");
      },
      { timeout: 2500 },
    );
  });

  it("turning Auto Detect off stops auto-processing and keeps raw input", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace />);

    const view = await waitForEditor(container);
    setText(view, RAW_B64);

    await user.click(screen.getByRole("switch", { name: /Auto Detect/i }));

    await waitFor(
      () => {
        expect(screen.getByRole("status")).toHaveTextContent("Auto Detect is OFF");
      },
      { timeout: 2500 },
    );
    // The raw input remains untouched — the pipeline reported nothing to show.
    expect(editorDoc(view)).toBe(RAW_B64);
    expect(localStorage.getItem("devtools-auto-mode")).toBe("false");
  });
});