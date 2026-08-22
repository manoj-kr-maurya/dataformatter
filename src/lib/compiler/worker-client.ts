import { JsonRpcPeer } from "@/lib/compiler/json-rpc";
import { DartPadRpcError, DARTPAD_ERROR_CODES } from "@/lib/compiler/errors";

/**
 * TypeScript port of the parts of `package:dartpad`'s WorkerClient that the
 * compiler playground needs: workspaces, files, pub, the hot-reload compiler
 * and a thin LSP channel for live diagnostics.
 */

export interface CompileResult {
  /** Compiled JavaScript, or null when compilation failed. */
  code: string | null;
  /** Library URIs included in this compilation; entry library is among them. */
  compiledLibraryUris: string[];
  log: string;
}

export interface PubResult {
  log: string;
}

export interface Diagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  line: number;
  column: number;
}

/** LSP JSON-RPC messages travel as plain objects inside the tunnel param. */
export type LspMessage = Record<string, unknown>;

interface PublishDiagnosticsParams {
  uri?: string;
  diagnostics?: Array<{
    severity?: number;
    message?: string;
    range?: { start?: { line?: number; character?: number } };
  }>;
}

export class DartPadWorkerClient {
  private readonly peer: JsonRpcPeer;
  private readonly lspListeners = new Set<(message: LspMessage) => void>();

  constructor(peer: JsonRpcPeer) {
    this.peer = peer;
    // The worker pushes LSP traffic as notifications on the shared session.
    this.peer.handle("workspace/languageServer/message", (params) => {
      const message = params["message"];
      if (message && typeof message === "object") {
        for (const listener of this.lspListeners) {
          listener(message as LspMessage);
        }
      }
      return {};
    });
    this.peer.handle("workspace/languageServer/exited", () => ({}));
    this.peer.handle("workspace/watcher/events", () => ({}));
  }

  close(): void {
    this.peer.close();
    this.lspListeners.clear();
  }

  async createWorkspace(): Promise<Workspace> {
    const result = await this.peer.sendRequest<Record<string, unknown>>("createWorkspace");
    return new Workspace(
      this.peer,
      Number(result["workspaceId"]),
      String(result["workspaceFolder"] ?? ""),
      (listener) => this.lspListeners.add(listener),
      (listener) => this.lspListeners.delete(listener),
    );
  }

  /** Wrap a request so RPC errors surface with their wire code attached. */
  request<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    return this.peer.sendRequest<T>(method, params);
  }
}

export class Workspace {
  constructor(
    private readonly peer: JsonRpcPeer,
    readonly id: number,
    readonly workspaceFolder: string,
    private readonly addLspListener: (listener: (message: LspMessage) => void) => void,
    private readonly removeLspListener: (listener: (message: LspMessage) => void) => void,
  ) {}

  writeFileFromText(uri: string, text: string): Promise<void> {
    return this.request("workspace/writeFileFromText", { uri, text });
  }

  readFileAsText(uri: string): Promise<string> {
    return this.request<Record<string, unknown>>("workspace/readFileAsText", { uri }).then(
      (result) => String(result["text"] ?? ""),
    );
  }

  pub(command: string, args: string[] = [], uri = ""): Promise<PubResult> {
    return this.request<Record<string, unknown>>("workspace/pub", { uri, command, args }).then(
      (result) => ({ log: String(result["log"] ?? "") }),
    );
  }

  dispose(): Promise<void> {
    return this.request("workspace/dispose");
  }

  async startHotReloadCompiler(entrypoint: string): Promise<HotReloadCompiler> {
    const result = await this.request<Record<string, unknown>>(
      "workspace/startHotReloadCompiler",
      { uri: entrypoint },
    );
    return new HotReloadCompiler(this, Number(result["hotReloadCompilerId"]));
  }

  async startLanguageServer(options: LanguageServerOptions = {}): Promise<LanguageServer> {
    const result = await this.request<Record<string, unknown>>("workspace/startLanguageServer");
    const server = new LanguageServer(this, Number(result["languageServerId"]), options);
    this.addLspListener(server.handleIncoming);
    return server;
  }

  /** Compile once via a throwaway hot-reload compiler. */
  async compile(entrypoint: string): Promise<CompileResult> {
    const compiler = await this.startHotReloadCompiler(entrypoint);
    try {
      return await compiler.compile();
    } finally {
      await compiler.close().catch(() => undefined);
    }
  }

  /** Attach workspaceId to every request (mirrors package:dartpad). */
  request<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    return this.peer.sendRequest<T>(method, { ...params, workspaceId: this.id });
  }
}

export class HotReloadCompiler {
  constructor(
    private readonly workspace: Workspace,
    readonly id: number,
  ) {}

  compile(): Promise<CompileResult> {
    return this.workspace
      .request<Record<string, unknown>>("workspace/hotReloadCompiler/compile", {
        hotReloadCompilerId: this.id,
      })
      .then((result) => ({
        code: result["code"] === null ? null : String(result["code"] ?? ""),
        compiledLibraryUris: Array.isArray(result["compiledLibraryUris"])
          ? (result["compiledLibraryUris"] as unknown[]).map(String)
          : [],
        log: String(result["log"] ?? ""),
      }));
  }

  async close(): Promise<void> {
    try {
      await this.workspace.request("workspace/hotReloadCompiler/close", {
        hotReloadCompilerId: this.id,
      });
    } catch (error) {
      if (!(error instanceof DartPadRpcError && error.code === DARTPAD_ERROR_CODES.HOT_RELOAD_COMPILER_NOT_FOUND)) {
        throw error;
      }
    }
  }
}

export interface LanguageServerOptions {
  onDiagnostics?: (diagnostics: Diagnostic[], uri: string) => void;
}

export class LanguageServer {
  private nextRequestId = 1;
  private readonly responseWaiters = new Map<number, (message: LspMessage) => void>();
  handleIncoming: (message: LspMessage) => void = () => undefined;

  constructor(
    private readonly workspace: Workspace,
    readonly id: number,
    private readonly options: LanguageServerOptions = {},
  ) {
    this.handleIncoming = (message) => this.processIncoming(message);
  }

  /**
   * Initialize the server over the tunneled LSP channel and open `uri`.
   * Resolves once the server confirms initialization.
   */
  async open(uri: string, text: string): Promise<void> {
    await this.call("initialize", {
      processId: null,
      rootUri: this.workspace.workspaceFolder,
      capabilities: {},
      workspaceFolders: [
        { uri: this.workspace.workspaceFolder, name: "workspace" },
      ],
    });
    this.notify("initialized", {});
    this.didOpen(uri, text);
  }

  didOpen(uri: string, text: string): void {
    this.notify("textDocument/didOpen", {
      textDocument: { uri, languageId: "dart", version: 1, text },
    });
  }

  didChange(uri: string, text: string, version: number): void {
    this.notify("textDocument/didChange", {
      textDocument: { uri, version },
      contentChanges: [{ text }],
    });
  }

  async stop(): Promise<void> {
    try {
      await this.workspace.request("workspace/languageServer/stop", {
        languageServerId: this.id,
      });
    } catch {
      // Already gone — fine.
    }
  }

  /** Issue an LSP request over the tunnel and await its matching response. */
  private call(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = this.nextRequestId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.responseWaiters.delete(id);
        reject(new Error(`LSP ${method} timed out`));
      }, 30_000);
      this.responseWaiters.set(id, () => {
        clearTimeout(timer);
        resolve(undefined);
      });
      this.notify(method, params, id);
    });
  }

  private notify(method: string, params: Record<string, unknown>, requestId?: number): void {
    const message: Record<string, unknown> = { jsonrpc: "2.0", method, params };
    if (requestId !== undefined) {
      message.id = requestId;
    }
    this.workspace
      .request("workspace/languageServer/message", {
        languageServerId: this.id,
        message,
      })
      .catch(() => undefined);
  }

  private processIncoming(message: LspMessage): void {
    // A tunnelled message carrying an id but no method is a response to one
    // of our outstanding LSP requests.
    if (message["id"] !== undefined && message["method"] === undefined) {
      const waiter = this.responseWaiters.get(Number(message["id"]));
      if (waiter) {
        this.responseWaiters.delete(Number(message["id"]));
        waiter(message);
      }
      return;
    }
    if (message["method"] === "textDocument/publishDiagnostics") {
      const params = (message["params"] ?? {}) as PublishDiagnosticsParams;
      const diagnostics: Diagnostic[] = (params.diagnostics ?? []).map((d) => ({
        severity:
          d.severity === 1 ? "error" : d.severity === 2 ? "warning" : "info",
        message: String(d.message ?? ""),
        line: (d.range?.start?.line ?? 0) + 1,
        column: (d.range?.start?.character ?? 0) + 1,
      }));
      this.options.onDiagnostics?.(diagnostics, String(params.uri ?? ""));
    }
  }
}
