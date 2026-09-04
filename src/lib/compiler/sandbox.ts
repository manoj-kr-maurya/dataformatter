import { JsonRpcPeer } from "@/lib/compiler/json-rpc";

/**
 * Client for the sandboxed iframe that runs DDC-compiled Dart (as JS).
 * Mirrors `package:dartpad`'s Sandbox class: the iframe loads `sandbox.js`,
 * announces itself with `{action:'connect', port}`, and then speaks
 * JSON-RPC 2.0 over that port while pushing console output as notifications.
 */

export type ConsoleLevel = "log" | "info" | "warn" | "error";

export interface ConsoleMessage {
  level: ConsoleLevel;
  message: string;
}

export class SandboxClient {
  private readonly peer: JsonRpcPeer;
  private readonly iframe: HTMLIFrameElement;
  private disposed = false;

  private constructor(peer: JsonRpcPeer, iframe: HTMLIFrameElement) {
    this.peer = peer;
    this.iframe = iframe;
  }

  onConsole(handler: (message: ConsoleMessage) => void): void {
    this.peer.handle("console", (params) => {
      const level = String(params["level"] ?? "log");
      handler({
        level: level === "error" || level === "warn" ? level : level === "info" ? "info" : "log",
        message: String(params["message"] ?? ""),
      });
      return {};
    });
  }

  /** Uncaught sandbox failures (window.onerror / unhandled rejections) —
   *  these mean the program crashed rather than merely printed to stderr. */
  onRuntimeError(handler: (message: string) => void): void {
    const report = (params: Record<string, unknown>) => {
      handler(String(params["message"] ?? ""));
      return {};
    };
    this.peer.handle("error", report);
    this.peer.handle("unhandledRejection", report);
  }

  loadModule(code: string, moduleName = "main"): Promise<void> {
    return this.peer.sendRequest("loadModule", { code, moduleName });
  }

  runMain(libraryUri: string): Promise<void> {
    return this.peer.sendRequest("runMain", { libraryUri });
  }

  hotRestart(code?: string, moduleName = "main"): Promise<number> {
    const params: Record<string, unknown> = { moduleName };
    if (code !== undefined) {
      params.code = code;
    }
    return this.peer
      .sendRequest<Record<string, unknown>>("hotRestart", params)
      .then((result) => Number(result["generation"] ?? 0));
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.iframe.remove();
    this.peer.close();
  }

  /**
   * Inject the sandbox iframe into `container` and wait for its connect
   * handshake. `assetBaseUrl` must serve sandbox.js / ddc_module_loader.js /
   * dart_sdk.js.
   */
  static async create(
    container: HTMLElement,
    assetBaseUrl: URL,
  ): Promise<SandboxClient> {
    if (!assetBaseUrl.pathname.endsWith("/")) {
      assetBaseUrl.pathname = `${assetBaseUrl.pathname}/`;
    }

    const iframe = document.createElement("iframe");
    // Matches package:dartpad — allow-same-origin is required for source maps.
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    iframe.className = "hidden";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.srcdoc = [
      "<!DOCTYPE html>",
      "<html>",
      "<head>",
      '<meta charset="utf-8">',
      `<script src="${escapeHtml(new URL("sandbox.js", assetBaseUrl).toString())}" defer></script>`,
      "<style>body { margin: 0; overflow: hidden; background: transparent; }</style>",
      "</head>",
      "<body></body>",
      "</html>",
    ].join("\n");

    container.appendChild(iframe);

    return new Promise<SandboxClient>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        iframe.remove();
        reject(new Error("The Dart code runner took too long to start."));
      }, 120_000);

      function onMessage(event: MessageEvent): void {
        const data = event.data as { action?: string; port?: MessagePort; message?: string } | null;
        if (!data || typeof data !== "object") {
          return;
        }
        if (data.action === "connect" && data.port instanceof MessagePort) {
          cleanup();
          resolve(new SandboxClient(new JsonRpcPeer(data.port), iframe));
        } else if (data.action === "error") {
          cleanup();
          iframe.remove();
          reject(new Error(data.message || "Failed to load the sandboxed iframe."));
        }
      }

      function cleanup() {
        clearTimeout(timeout);
        window.removeEventListener("message", onMessage);
      }

      window.addEventListener("message", onMessage);
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
