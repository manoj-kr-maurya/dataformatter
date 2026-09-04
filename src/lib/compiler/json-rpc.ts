import { DartPadRpcError } from "@/lib/compiler/errors";

/**
 * Minimal JSON-RPC 2.0 peer speaking the "JSON-RPC 2.0 over MessagePort"
 * dialect used by the DartPad worker and sandbox (see
 * pkg/dartpad/doc/worker-protocol.md in dart-lang/sdk).
 *
 * Messages travel as:
 *   { payload: string(JSON-RPC message), port?: MessagePort, bytes?: Uint8Array }
 *
 * `port`/`bytes` ride outside the JSON envelope via structured clone and are
 * re-inserted into `params` (requests) / `result` (responses) on receipt.
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
  id?: number | string;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
  id: number | string;
}

export interface Envelope {
  payload: string;
  port?: MessagePort;
  bytes?: Uint8Array;
}

/** Anything with postMessage + onmessage — MessagePort in practice, fakes in tests. */
export interface PostablePort {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<Envelope>) => void) | null;
}

type MethodHandler = (params: Record<string, unknown>) => Promise<unknown> | unknown;

interface Pending {
  resolve: (value: unknown) => void;
  reject: (error: DartPadRpcError) => void;
}

let nextPeerId = 0;

export class JsonRpcPeer {
  private readonly port: PostablePort;
  private readonly handlers = new Map<string, MethodHandler>();
  private readonly pending = new Map<number | string, Pending>();
  private nextId = 1;
  /** Prevents a late response from colliding with a recycled peer's ids. */
  readonly instanceId = ++nextPeerId;

  constructor(port: PostablePort) {
    this.port = port;
    this.port.onmessage = (event: MessageEvent<Envelope>) => this.handleEnvelope(event.data);
  }

  sendRequest<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      const message: JsonRpcRequest = { jsonrpc: "2.0", method, params: params ?? {}, id };
      this.postMessage(message);
    });
  }

  sendNotification(method: string, params?: Record<string, unknown>): void {
    const message: JsonRpcRequest = { jsonrpc: "2.0", method, params: params ?? {} };
    this.postMessage(message);
  }

  handle(method: string, handler: MethodHandler): void {
    this.handlers.set(method, handler);
  }

  close(): void {
    for (const pending of this.pending.values()) {
      pending.reject(new DartPadRpcError(-32000, "Connection closed."));
    }
    this.pending.clear();
    this.handlers.clear();
    if (this.port) {
      this.port.onmessage = null;
    }
  }

  private postMessage(message: JsonRpcRequest | JsonRpcResponse): void {
    // Hoist structured-clone-only values out of the JSON body.
    let port: MessagePort | undefined;
    let bytes: Uint8Array | undefined;
    const bag = (message as { params?: Record<string, unknown> }).params ??
      (message as { result?: unknown }).result;
    if (bag && typeof bag === "object") {
      const record = bag as Record<string, unknown>;
      if (record.port instanceof MessagePort) {
        port = record.port;
        delete record.port;
      }
      if (record.bytes instanceof Uint8Array) {
        bytes = record.bytes;
        delete record.bytes;
      }
    }
    const envelope: Envelope = { payload: JSON.stringify(message), port, bytes };
    if (port || bytes) {
      const transfer: Transferable[] = [];
      if (port) {
        transfer.push(port);
      }
      this.port.postMessage(envelope, transfer);
      return;
    }
    this.port.postMessage(envelope);
  }

  private handleEnvelope(data: Envelope | null | undefined): void {
    if (!data || typeof data.payload !== "string") {
      return;
    }
    let message: JsonRpcRequest | JsonRpcResponse;
    try {
      message = JSON.parse(data.payload) as JsonRpcRequest | JsonRpcResponse;
    } catch {
      return;
    }
    if ("method" in message) {
      this.handleIncomingRequest(message, data);
      return;
    }
    this.handleResponse(message);
  }

  private async handleIncomingRequest(
    message: JsonRpcRequest,
    data: Envelope,
  ): Promise<void> {
    const handler = this.handlers.get(message.method);
    const params = (message.params ?? {}) as Record<string, unknown>;

    // Re-insert structured-clone values that rode outside the JSON.
    if (data.port) {
      params.port = data.port;
    }
    if (data.bytes) {
      params.bytes = data.bytes;
    }

    if (message.id === undefined) {
      // Notification — best effort, errors are not reported back.
      try {
        await handler?.(params);
      } catch {
        // Swallowed by design; notifications carry no response channel.
      }
      return;
    }

    if (!handler) {
      this.respond(message.id, undefined, {
        code: -32601,
        message: `Method not found: ${message.method}`,
      });
      return;
    }

    try {
      const result = await handler(params);
      this.respond(message.id, result ?? {});
    } catch (error) {
      const code =
        error instanceof DartPadRpcError ? error.code : -32000;
      const text =
        error instanceof Error ? error.message : String(error);
      this.respond(message.id, undefined, { code, message: text });
    }
  }

  private respond(
    id: number | string,
    result: unknown,
    error?: { code: number; message: string },
  ): void {
    const response: JsonRpcResponse = { jsonrpc: "2.0", id };
    if (error) {
      response.error = error;
    } else {
      response.result = result ?? {};
    }
    this.postMessage(response);
  }

  private handleResponse(message: JsonRpcResponse): void {
    const id = typeof message.id === "number" ? message.id : Number(message.id);
    const pending = this.pending.get(id);
    if (!pending) {
      return;
    }
    this.pending.delete(id);
    if (message.error) {
      pending.reject(
        new DartPadRpcError(message.error.code, message.error.message, message.error.data),
      );
      return;
    }
    pending.resolve(message.result);
  }
}
