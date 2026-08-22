import { JsonRpcPeer } from "@/lib/compiler/json-rpc";
import { DartPadWorkerClient, Workspace } from "@/lib/compiler/worker-client";
import { SandboxClient } from "@/lib/compiler/sandbox";

/**
 * Boots the DartPad SDK assets hosted under `public/dartpad/`:
 *
 *  - a Web Worker (loaded through a tiny blob bootstrap so the worker can be
 *    a module importing worker.js from our origin) running the DDC compiler,
 *  - a workspace for file operations / pub / compilation,
 *  - a sandboxed iframe that executes the compiled JavaScript.
 */

/** Where the DartPad SDK bundle is served from inside this app. */
export const DARTPAD_ASSET_BASE_URL = "/dartpad/";

const SANDBOX_HOST_ID = "dartpad-sandbox-host";

function assetUrl(path: string): URL {
  return new URL(`${DARTPAD_ASSET_BASE_URL}${path}`, window.location.origin);
}

/**
 * The worker loader blob mirrors package:dartpad's `DartPadSdk.dedicatedWorker`:
 * import Worker from the asset base, create it, then hand the session
 * MessagePort back to the main page.
 */
function workerLoaderScript(workerJsUrl: string): string {
  return `
import {Worker} from '${workerJsUrl}';
try {
  const worker = await Worker.create({});
  const channel = new MessageChannel();
  worker.session(channel.port1);
  self.postMessage({action: 'session'}, [channel.port2]);
} catch (e) {
  console.error(e);
  self.postMessage({action: 'error', message: e.toString()});
}
`;
}

async function launchWorker(): Promise<{ client: DartPadWorkerClient; terminate: () => void }> {
  const script = workerLoaderScript(assetUrl("worker.js").toString());
  const blobUrl = URL.createObjectURL(
    new Blob([script], { type: "application/javascript" }),
  );

  let worker: Worker;
  try {
    worker = new Worker(blobUrl, { name: "dartpad-worker", type: "module" });
  } catch (error) {
    URL.revokeObjectURL(blobUrl);
    throw new Error("This browser cannot start the Dart engine.", { cause: error });
  }

  const sessionPort = await new Promise<MessagePort>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("The Dart engine took too long to boot."));
    }, 120_000);

    function onMessage(event: MessageEvent): void {
      const data = event.data as { action?: string; message?: string } | null;
      if (!data || typeof data !== "object") {
        return;
      }
      if (data.action === "session") {
        const port = (event as MessageEvent & { ports?: MessagePort[] }).ports?.[0];
        if (port instanceof MessagePort) {
          cleanup();
          resolve(port);
        }
      } else if (data.action === "error") {
        cleanup();
        reject(new Error(data.message || "Failed to load the Dart engine."));
      }
    }

    function onError(event: ErrorEvent): void {
      cleanup();
      reject(new Error(event.message || "The Dart engine failed to load."));
    }

    function cleanup() {
      clearTimeout(timeout);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    }

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
  });

  return {
    client: new DartPadWorkerClient(new JsonRpcPeer(sessionPort)),
    terminate: () => {
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
    },
  };
}

export interface DartPadSession {
  workspace: Workspace;
  sandbox: SandboxClient;
  /** Recreate the sandbox iframe (fresh program state, warm worker). */
  rebuildSandbox(): Promise<SandboxClient>;
  dispose(): Promise<void>;
}

/** The off-screen host element the sandbox iframe lives in. */
export function sandboxHostElement(): HTMLElement {
  const existing = document.getElementById(SANDBOX_HOST_ID);
  if (existing) {
    return existing;
  }
  const host = document.createElement("div");
  host.id = SANDBOX_HOST_ID;
  // Off-screen but rendered — the iframe must be in the document to load.
  host.style.cssText = "position:fixed;width:0;height:0;border:0;overflow:hidden;";
  document.body.appendChild(host);
  return host;
}

/**
 * Bring up a full session: worker → workspace → sandbox iframe.
 * Throws with user-presentable messages when anything fails to boot.
 */
export async function createDartPadSession(): Promise<DartPadSession> {
  if (typeof window === "undefined") {
    throw new Error("DartPad can only run in a browser.");
  }
  if (typeof Worker === "undefined" || typeof WebAssembly === "undefined") {
    throw new Error("This browser does not support WebAssembly, which the Dart engine needs.");
  }

  const { client, terminate } = await launchWorker();
  try {
    const workspace = await client.createWorkspace();
    const sandbox = await SandboxClient.create(sandboxHostElement(), assetUrl(""));
    return {
      workspace,
      sandbox,
      rebuildSandbox: () => SandboxClient.create(sandboxHostElement(), assetUrl("")),
      dispose: async () => {
        sandbox.dispose();
        await workspace.dispose().catch(() => undefined);
        client.close();
        terminate();
      },
    };
  } catch (error) {
    client.close();
    terminate();
    throw error;
  }
}
