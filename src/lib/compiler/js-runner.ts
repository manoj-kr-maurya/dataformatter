/**
 * Runs plain JavaScript (or transpiled TypeScript) in a sandboxed Web Worker.
 *
 * Why a worker instead of `eval` on the page: an infinite loop in user code
 * must never freeze the UI — the host terminates the worker after a timeout
 * and reports it. Console output, uncaught errors, and unhandled rejections
 * stream back over postMessage; stdin is exposed through a synchronous
 * `readLine()` global backed by a pre-loaded line queue.
 */

export interface JsRunResult {
  status: "done" | "error" | "timeout";
  /** Crash description for `error`; absent otherwise. */
  message?: string;
}

export type JsConsoleLevel = "log" | "info" | "warn" | "error";

export class JsRunner {
  private worker: Worker | null = null;
  private blobUrl: string | null = null;
  private consoleHandler: ((level: JsConsoleLevel, message: string) => void) | null = null;
  private settle: ((result: JsRunResult) => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Observe program console output between runs. */
  onConsole(handler: (level: JsConsoleLevel, message: string) => void): void {
    this.consoleHandler = handler;
  }

  /**
   * Execute a program. Resolves once it finishes, crashes, or hits the
   * timeout (the worker is killed either way; a fresh one spawns next run).
   */
  async run(code: string, stdin: string, timeoutMs = 10_000): Promise<JsRunResult> {
    this.killWorker();
    const worker = this.spawnWorker();
    return new Promise<JsRunResult>((resolve) => {
      this.settle = resolve;
      this.timer = setTimeout(() => {
        this.finish({ status: "timeout" });
      }, timeoutMs);
      worker.postMessage({
        type: "run",
        code,
        stdinLines: stdin.length > 0 ? stdin.replace(/\r\n/g, "\n").split("\n") : [],
      });
    });
  }

  /** Stop any running program and tear the worker down. */
  dispose(): void {
    this.killWorker();
    this.consoleHandler = null;
  }

  private finish(result: JsRunResult): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.killWorker();
    const resolve = this.settle;
    this.settle = null;
    resolve?.(result);
  }

  private killWorker(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.worker?.terminate();
    this.worker = null;
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }

  private spawnWorker(): Worker {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    this.blobUrl = url;
    const worker = new Worker(url);
    this.worker = worker;
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown>;
      switch (data.type) {
        case "console":
          this.consoleHandler?.(
            (data.level as JsConsoleLevel) ?? "log",
            String(data.message ?? ""),
          );
          break;
        case "done":
          this.finish({ status: "done" });
          break;
        case "error":
          this.finish({ status: "error", message: String(data.message ?? "Unknown error") });
          break;
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      this.finish({ status: "error", message: event.message || "The program crashed." });
    };
    return worker;
  }
}

/**
 * The worker bootstrap. Kept as a single string because Blob workers cannot
 * reference bundled modules. It installs a console bridge, a synchronous
 * `readLine()` over the queued stdin lines, crash reporters, and finally
 * evaluates the program inside an async wrapper (top-level await works).
 */
const WORKER_SOURCE = String.raw`
"use strict";
function fmt(value) {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (typeof value === "function") return "[Function " + (value.name || "anonymous") + "]";
  if (typeof value === "object" && value !== null) {
    try {
      const seen = new WeakSet();
      const json = JSON.stringify(value, function (key, v) {
        if (typeof v === "object" && v !== null) {
          if (seen.has(v)) return "[Circular]";
          seen.add(v);
        }
        if (typeof v === "bigint") return v.toString() + "n";
        return v;
      });
      if (json !== undefined) return json;
    } catch (_) {}
  }
  return String(value);
}
["log", "info", "warn", "error"].forEach(function (level) {
  self.console[level] = function () {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) parts.push(fmt(arguments[i]));
    postMessage({ type: "console", level: level, message: parts.join(" ") });
  };
});
var stdinLines = [];
function readLine() {
  return stdinLines.length > 0 ? stdinLines.shift() : null;
}
self.addEventListener("error", function (event) {
  postMessage({ type: "error", message: (event.error && event.error.stack) || event.message });
});
self.addEventListener("unhandledrejection", function (event) {
  var reason = event.reason;
  postMessage({
    type: "error",
    message: "Unhandled promise rejection: " + ((reason && (reason.stack || reason.message)) || String(reason)),
  });
});
self.onmessage = function (event) {
  var msg = event.data || {};
  if (msg.type !== "run") return;
  stdinLines = Array.isArray(msg.stdinLines) ? msg.stdinLines.slice() : [];
  var fn;
  try {
    fn = new Function(
      "readLine",
      '"use strict";\nreturn (async () => {\n' + msg.code + "\n})();"
    );
  } catch (syntaxError) {
    postMessage({ type: "error", message: (syntaxError && syntaxError.stack) || String(syntaxError) });
    return;
  }
  Promise.resolve()
    .then(function () {
      return fn(readLine);
    })
    .then(function () {
      postMessage({ type: "done" });
    })
    .catch(function (runtimeError) {
      postMessage({
        type: "error",
        message: (runtimeError && runtimeError.stack) || String(runtimeError),
      });
    });
};
`;
