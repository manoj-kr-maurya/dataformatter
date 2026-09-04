import {
  createDartPadSession,
  type DartPadSession,
} from "@/lib/compiler/dartpad";
import type { ConsoleMessage } from "@/lib/compiler/sandbox";
import type { Diagnostic } from "@/lib/compiler/worker-client";
import { describeDartPadError } from "@/lib/compiler/errors";

/**
 * Framework-agnostic orchestrator for the Dart playground:
 * boots the engine lazily, keeps one persistent incremental compiler,
 * feeds compiled code + a stdin bridge into the sandbox, and emits events
 * the UI layer renders.
 */

export type EnginePhase = "cold" | "booting" | "ready";

export type RunState =
  | "idle"
  | "compiling"
  | "running"
  | "done"
  | "compile-error"
  | "runtime-error";

export type WorkbenchEvent =
  | { kind: "phase"; phase: EnginePhase }
  | { kind: "runState"; state: RunState }
  | { kind: "console"; message: ConsoleMessage }
  | { kind: "diagnostics"; diagnostics: Diagnostic[] }
  | { kind: "notice"; message: string };

export const DEFAULT_PUBSPEC = "name: playground\nenvironment:\n  sdk: ^3.0.0\n";

const MAIN_ENTRY = "main.dart";

/** Quiescence window after the last console message before we mark done. */
const DONE_QUIESCENCE_MS = 400;

export class CompilerEngine {
  private session: DartPadSession | null = null;
  private bootPromise: Promise<void> | null = null;

  private compilerHandle: Awaited<
    ReturnType<DartPadSession["workspace"]["startHotReloadCompiler"]>
  > | null = null;

  private phaseValue: EnginePhase = "cold";
  private runStateValue: RunState = "idle";

  private lastPubspecHash = "";
  private needsPubGet = true;
  /** Whether the current sandbox instance has a DDC module loaded — a fresh
   *  iframe starts clean, but re-runs must go through hotRestart. */
  private moduleLoaded = false;

  private lspServer: Awaited<
    ReturnType<DartPadSession["workspace"]["startLanguageServer"]>
  > | null = null;
  private lspOpen = false;
  private lspVersion = 1;
  private lspTimer: ReturnType<typeof setTimeout> | null = null;
  private entryLibraryUri: string | null = null;
  private doneTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly listeners = new Set<(event: WorkbenchEvent) => void>();

  subscribe(listener: (event: WorkbenchEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get phase(): EnginePhase {
    return this.phaseValue;
  }

  get runState(): RunState {
    return this.runStateValue;
  }

  private emit(event: WorkbenchEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private setPhase(phase: EnginePhase): void {
    if (this.phaseValue === phase) {
      return;
    }
    this.phaseValue = phase;
    this.emit({ kind: "phase", phase });
  }

  private setRunState(state: RunState): void {
    this.runStateValue = state;
    this.emit({ kind: "runState", state });
  }

  /**
   * Start loading the engine without running anything. Safe to call many
   * times — concurrent callers share one boot promise.
   */
  preload(): Promise<void> {
    return this.ensureBooted();
  }

  private ensureBooted(): Promise<void> {
    if (this.session) {
      return Promise.resolve();
    }
    if (!this.bootPromise) {
      this.bootPromise = this.boot();
    }
    return this.bootPromise;
  }

  private async boot(): Promise<void> {
    this.setPhase("booting");
    try {
      const session = await createDartPadSession();
      session.sandbox.onConsole((message) => {
        this.emit({ kind: "console", message });
        this.scheduleDone();
      });
      session.sandbox.onRuntimeError((message) => {
        this.handleRuntimeError(message);
      });

      // Live analyzer diagnostics, best effort — a slow/failed LSP must not
      // block compilation.
      try {
        const server = await session.workspace.startLanguageServer({
          onDiagnostics: (diagnostics) => {
            this.emit({ kind: "diagnostics", diagnostics });
          },
        });
        await server.open(this.mainFileUri(session), "");
        this.lspServer = server;
        this.lspOpen = true;
      } catch {
        this.lspOpen = false;
      }

      this.session = session;
      this.setPhase("ready");
    } catch (error) {
      this.setPhase("cold");
      throw new Error(describeDartPadError(error));
    }
  }

  /**
   * Compile + execute the current program. Emits runState transitions and
   * console output; throws an Error with a friendly message on failure.
   */
  async run(code: string, stdin: string): Promise<void> {
    const session = await this.requireBootedSession();

    this.clearDoneTimer();
    this.setRunState("compiling");

    try {
      // 1. Materialize files in the workspace.
      const pubspec = DEFAULT_PUBSPEC;
      await session.workspace.writeFileFromText(MAIN_ENTRY, code);
      if (hash(pubspec) !== this.lastPubspecHash) {
        await session.workspace.writeFileFromText("pubspec.yaml", pubspec);
        this.lastPubspecHash = hash(pubspec);
        this.needsPubGet = true;
      }

      // 2. Resolve dependencies when needed (no deps → instant).
      if (this.needsPubGet) {
        try {
          await session.workspace.pub("get");
          this.needsPubGet = false;
        } catch (error) {
          this.needsPubGet = true;
          throw new Error(`Resolving dependencies failed.\n${describeDartPadError(error)}`);
        }
      }

      // 3. Compile — incremental via one persistent hot-reload compiler.
      if (!this.compilerHandle) {
        this.compilerHandle = await session.workspace.startHotReloadCompiler(MAIN_ENTRY);
      }
      let compiled;
      try {
        compiled = await this.compilerHandle.compile();
      } catch (error) {
        throw new CompileError(trimLog(describeDartPadError(error)));
      }
      if (compiled.log.trim().length > 0) {
        this.emit({
          kind: "console",
          message: { level: "info", message: trimLog(compiled.log) },
        });
      }
      if (compiled.code === null || compiled.code.length === 0) {
        throw new CompileError("");
      }

      this.entryLibraryUri =
        compiled.compiledLibraryUris.find((uri) => uri.endsWith("/main.dart")) ??
        compiled.compiledLibraryUris[0] ??
        `${session.workspace.workspaceFolder}${MAIN_ENTRY}`;

      // 4. Execute in the sandbox with a fresh stdin bridge prologue.
      const bridgedCode = `${STDIN_BRIDGE_JS}\n${stdinBridgeFor(stdin)}\n${compiled.code}`;
      try {
        if (this.moduleLoaded) {
          // DDC only permits re-defining an already-loaded library during a
          // hot restart — pass the fresh code through the restart hook.
          await session.sandbox.hotRestart(bridgedCode);
        } else {
          await session.sandbox.loadModule(bridgedCode);
          this.moduleLoaded = true;
        }
        await session.sandbox.runMain(this.entryLibraryUri);
      } catch (error) {
        throw new RuntimeError(describeDartPadError(error));
      }

      // 5. Sync the analyzer with the exact source that ran.
      this.pushAnalyzerUpdate(session, code);

      this.setRunState("running");
      this.scheduleDone();
    } catch (error) {
      this.pushAnalyzerUpdate(session, code);
      if (error instanceof CompileError) {
        this.setRunState("compile-error");
        if (error.message.length > 0) {
          this.emit({ kind: "notice", message: error.message });
        }
        this.emit({
          kind: "console",
          message: { level: "error", message: "Compilation failed — fix the errors and run again." },
        });
      } else {
        this.setRunState("runtime-error");
        this.emit({ kind: "notice", message: describeDartPadError(error) });
      }
    }
  }

  /** Tear the sandbox down and rebuild it — kills runaway loops, resets state. */
  async reset(): Promise<void> {
    this.clearDoneTimer();
    this.setRunState("idle");
    const session = this.session;
    if (!session) {
      return;
    }
    session.sandbox.dispose();
    session.sandbox = await session.rebuildSandbox();
    this.moduleLoaded = false;
    session.sandbox.onConsole((message) => {
      this.emit({ kind: "console", message });
      this.scheduleDone();
    });
    session.sandbox.onRuntimeError((message) => {
      this.handleRuntimeError(message);
    });
    this.emit({ kind: "console", message: { level: "log", message: "— reset —" } });
  }

  async dispose(): Promise<void> {
    this.clearDoneTimer();
    if (this.lspTimer) {
      clearTimeout(this.lspTimer);
      this.lspTimer = null;
    }
    if (this.lspServer) {
      await this.lspServer.stop().catch(() => undefined);
      this.lspServer = null;
    }
    this.lspOpen = false;
    if (this.compilerHandle) {
      await this.compilerHandle.close().catch(() => undefined);
      this.compilerHandle = null;
    }
    if (this.session) {
      await this.session.dispose();
      this.session = null;
    }
    this.setPhase("cold");
    this.setRunState("idle");
  }

  /** Debounced didChange push to the live analyzer (no-op until open). */
  private pushAnalyzerUpdate(session: DartPadSession, code: string): void {
    if (!this.lspOpen || !this.lspServer) {
      return;
    }
    if (this.lspTimer) {
      clearTimeout(this.lspTimer);
    }
    this.lspTimer = setTimeout(() => {
      this.lspVersion += 1;
      this.lspServer?.didChange(this.mainFileUri(session), code, this.lspVersion);
    }, 500);
  }

  private mainFileUri(session: DartPadSession): string {
    return `${session.workspace.workspaceFolder}${MAIN_ENTRY}`;
  }

  private requireBootedSession(): Promise<DartPadSession> {
    return this.ensureBooted().then(() => {
      if (!this.session) {
        throw new Error("The Dart engine is not available.");
      }
      return this.session;
    });
  }

  private scheduleDone(): void {
    if (this.runStateValue !== "running") {
      return;
    }
    this.clearDoneTimer();
    this.doneTimer = setTimeout(() => {
      if (this.runStateValue === "running") {
        this.setRunState("done");
      }
    }, DONE_QUIESCENCE_MS);
  }

  /**
   * An uncaught sandbox failure (window.onerror / unhandled rejection).
   * Only meaningful while a run is active or just quiesced — stray errors
   * outside a run are logged but do not change run state.
   */
  private handleRuntimeError(message: string): void {
    this.emit({ kind: "console", message: { level: "error", message } });
    const state = this.runStateValue;
    if (state !== "running" && state !== "done" && state !== "runtime-error") {
      return;
    }
    this.clearDoneTimer();
    this.setRunState("runtime-error");
    this.emit({
      kind: "notice",
      message: message.length > 0 ? trimLog(message) : "The program crashed with an unhandled exception.",
    });
  }

  private clearDoneTimer(): void {
    if (this.doneTimer) {
      clearTimeout(this.doneTimer);
      this.doneTimer = null;
    }
  }
}

class CompileError extends Error {}
class RuntimeError extends Error {}

function hash(value: string): string {
  // Cheap non-crypto change detector — contents never leave the browser.
  let h = 5381;
  for (let i = 0; i < value.length; i++) {
    h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  }
  return String(h);
}

function trimLog(log: string): string {
  const lines = log.split("\n");
  return lines.length > 40 ? lines.slice(-40).join("\n") : log;
}

/**
 * JS injected ahead of every compiled module: exposes STDIN box contents to
 * user code as synchronous line reads.
 *
 * In Dart, declare:
 * ```dart
 * import 'dart:js_interop';
 * @JS('dartpadReadLine')
 * external String? dartpadReadLine();
 * ```
 */
const STDIN_BRIDGE_JS = [
  "self.dartpadReadLine = self.dartpadReadLine || function () {",
  "  var lines = self.__dartpadStdinLines || [];",
  "  self.__dartpadStdinCursor = self.__dartpadStdinCursor || 0;",
  "  if (self.__dartpadStdinCursor >= lines.length) return null;",
  "  return lines[self.__dartpadStdinCursor++];",
  "};",
].join("\n");

/** Reset + seed the stdin bridge for this run's input. */
export function stdinBridgeFor(stdinText: string): string {
  // A single trailing newline terminates the last line — it does not open a
  // new empty one.
  const normalized = stdinText.endsWith("\n") ? stdinText.slice(0, -1) : stdinText;
  const lines = JSON.stringify(normalized.length === 0 ? [] : normalized.split("\n"));
  return `self.__dartpadStdinLines = ${lines}; self.__dartpadStdinCursor = 0;`;
}
