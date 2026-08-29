/**
 * Stack trace parser — detects the language, extracts the exception line and
 * frames, and derives a clean call chain. Deterministic, fully client-side.
 * Frameworks make traces noisy, so this is intentionally lossy: the goal is a
 * readable summary, not a byte-perfect reconstruction.
 */

export interface StackFrame {
  function: string;
  file: string;
  line: number | null;
}

export interface StackParse {
  language: string;
  exceptionType: string | null;
  message: string | null;
  location: { file: string; line: number | null } | null;
  frames: StackFrame[];
  /** Simplified top-down call chain (function names, trimmed). */
  chain: string[];
}

interface Engine {
  detect: (text: string) => boolean;
  parse: (text: string) => StackParse;
}

function locationOf(frames: StackFrame[]): { file: string; line: number | null } | null {
  for (const frame of frames) {
    if (frame.file) return { file: frame.file, line: frame.line };
  }
  return null;
}

const engines: Engine[] = [
  {
    // Node.js / V8: the first line is `at ...`, not an exception banner.
    detect: (text) => {
      const first = text.trim().split(/\r?\n/)[0].trim();
      return /^at\s+/.test(first) && /\(.*:\d+:\d+\)\s*$/.test(first);
    },
    parse: (text) => {
      const frames: StackFrame[] = [];
      let message: string | null = null;
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        const match = line.match(/^\s*at\s+(.*?)\s*\(([^)]+)\)\s*$/);
        if (match) {
          const [fn, loc] = [match[1], match[2]];
          if (loc.includes("node:internal")) {
            frames.push({ function: fn, file: loc, line: null });
            continue;
          }
          const fileMatch = loc.match(/^(.*?)(?::(\d+))?(?::\d+)?$/);
          frames.push({
            function: fn,
            file: fileMatch?.[1] ?? loc,
            line: fileMatch?.[2] ? parseInt(fileMatch[2], 10) : null,
          });
        } else if (/^Error:/.test(line)) {
          message = line.replace(/^Error:\s*/, "");
        } else {
          const colon = line.indexOf(":");
          if (colon > 0 && /^[A-Za-z_]/.test(line) && !message) {
            message = line.slice(0, colon) + (line.slice(colon + 1) ? `: ${line.slice(colon + 1).trim()}` : "");
          }
        }
      }
      const first = frames[0];
      return {
        language: "javascript",
        exceptionType: message ? message.split(":")[0] : null,
        message,
        location: first ? { file: first.file, line: first.line } : null,
        frames,
        chain: dedupe(frames.slice(0, 10).map((f) => f.function)),
      };
    },
  },
  {
    // Java / C# / Dart: an exception banner line followed by ` at ...` frames.
    detect: (text) => /^\s*(?:[\w.$]+\s*\.\s*)?[\w.$]+(?:Exception|Error|Throwable)\b/.test(text) && /\bat\s+[\w.$<>().]+[.(]/.test(text),
    parse: (text) => {
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const exceptionLine = lines.find((l) => /^\s*(?:[\w.$]+\s*\.\s*)?[\w.$]+(?:Exception|Error|Throwable)\b/.test(l));
      const exceptionMatch = exceptionLine?.match(/([\w.$]+Exception|[\w.$]+Error|[\w.$]+Throwable)/);
      const message = exceptionLine?.replace(/^\s*[\w.$]+(?:Exception|Error|Throwable)[^:]*:\s*/, "").trim() || null;
      const frames: StackFrame[] = [];
      for (const line of lines) {
        const open = line.lastIndexOf(" at ");
        if (open === -1) continue;
        const right = line.slice(open + 4);
        const paren = right.lastIndexOf("(");
        if (paren === -1) continue;
        const fn = right.slice(0, paren).trim();
        const inside = right.slice(paren + 1);
        const fileMatch = inside.match(/([\w./~-]+\.(?:java|kt|cs|dart)):(\d+)/);
        frames.push({
          function: fn,
          file: fileMatch?.[1] ?? "",
          line: fileMatch ? parseInt(fileMatch[2], 10) : null,
        });
      }
      const chain = frames.map((f) => f.function.split(".").pop() ?? f.function).filter(Boolean).slice(0, 12);
      return {
        language: "java",
        exceptionType: exceptionMatch?.[1] ?? null,
        message,
        location: locationOf(frames),
        frames,
        chain: dedupe(chain),
      };
    },
  },
  {
    detect: (text) => /Traceback \(most recent call last\)/.test(text),
    parse: (text) => {
      const frames: StackFrame[] = [];
      let inTraceback = false;
      let message: string | null = null;
      let exceptionType: string | null = null;
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trimEnd();
        if (line.includes("Traceback (most recent call last)")) {
          inTraceback = true;
          continue;
        }
        if (inTraceback && /^\s*File\s+"/.test(line)) {
          const file = line.match(/File\s+"(.*?)"/)?.[1] ?? "";
          const lineNo = line.match(/line\s+(\d+)/)?.[1] ?? null;
          const fn = line.match(/in\s+(.*)$/)?.[1] ?? "";
          frames.push({ function: fn, file, line: lineNo ? parseInt(lineNo, 10) : null });
          continue;
        }
        if (inTraceback && /^\s*(?:[A-Z]\w+\.?)*[A-Z]\w+(Error|Exception)/.test(line)) {
          const loc = line.match(/^([\w.]+):\s*(.*)$/);
          exceptionType = loc?.[1] ?? line.trim();
          message = loc?.[2] ?? null;
          inTraceback = false;
        }
      }
      return {
        language: "python",
        exceptionType,
        message,
        location: locationOf(frames),
        frames,
        chain: dedupe(frames.map((f) => f.function || f.file).slice(0, 10)),
      };
    },
  },
  {
    detect: (text) => /goroutine\s+\d+\s+\[\w+\].*\/.*\.go:\d+/.test(text) || /panic:\s+/.test(text),
    parse: (text) => {
      const frames: StackFrame[] = [];
      let message: string | null = null;
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (/^panic:\s+/.test(line)) {
          message = line.replace(/^panic:\s*/, "");
          continue;
        }
        const goFrame = line.match(/^([\w./~-]+\.go):(\d+)(?:\s+\+\d+)?\s+(.*)$/);
        if (goFrame) {
          frames.push({ function: goFrame[3], file: goFrame[1], line: parseInt(goFrame[2], 10) });
        }
      }
      return {
        language: "go",
        exceptionType: message ? message.split(":")[0] : "panic",
        message,
        location: locationOf(frames),
        frames,
        chain: dedupe(frames.map((f) => f.function || f.file).slice(0, 10)),
      };
    },
  },
];

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}

export function parseStackTrace(text: string): StackParse {
  const trimmed = text.trim();
  const engine = engines.find((e) => e.detect(trimmed));
  if (engine) {
    return engine.parse(trimmed);
  }
  // Fallback fingerprinting for traces without a recognized banner.
  const javaLike = /at\s+[\w.]+\([\w/.]+\.\w+:\d+\)/.test(trimmed);
  const labels = javaLike ? "java" : /\.go:\d+/.test(trimmed) ? "go" : "unknown";
  return { language: labels, exceptionType: null, message: null, location: null, frames: [], chain: [] };
}