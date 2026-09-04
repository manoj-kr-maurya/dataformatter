import { describe, expect, it } from "vitest";
import { JsonRpcPeer, type Envelope } from "@/lib/compiler/json-rpc";
import type { PostablePort } from "@/lib/compiler/json-rpc";

/** Collects envelopes; `peer` delivers them to another port's handler. */
class FakePort implements PostablePort {
  onmessage: ((event: MessageEvent<Envelope>) => void) | null = null;
  readonly inbox: Envelope[] = [];

  constructor(private readonly label: string) {}

  postMessage(message: unknown): void {
    this.inbox.push(message as Envelope);
    if (this.peer) {
      const envelope = message as Envelope;
      // Deliver asynchronously so promise chains settle like real ports.
      queueMicrotask(() => {
        this.peer?.onmessage?.({ data: envelope } as MessageEvent<Envelope>);
      });
    }
  }

  peer: FakePort | null = null;

  /** Wire two fake ports into a synchronous-ish loopback channel. */
  static connect(a: FakePort, b: FakePort): void {
    a.peer = b;
    b.peer = a;
  }

  get labelId(): string {
    return this.label;
  }
}

function makeChannel(): [JsonRpcPeer, JsonRpcPeer] {
  const clientPort = new FakePort("client");
  const serverPort = new FakePort("server");
  FakePort.connect(clientPort, serverPort);
  return [new JsonRpcPeer(clientPort), new JsonRpcPeer(serverPort)];
}

describe("JsonRpcPeer over MessagePort-style channels", () => {
  it("round-trips a request/response", async () => {
    const [client, server] = makeChannel();
    server.handle("add", (params) => Number(params["a"]) + Number(params["b"]));

    const result = await client.sendRequest<number>("add", { a: 2, b: 3 });
    expect(result).toBe(5);
  });

  it("rejects with the wire error code and message", async () => {
    const [client, server] = makeChannel();
    const { DartPadRpcError } = await import("@/lib/compiler/errors");
    server.handle("boom", () => {
      throw new DartPadRpcError(6001, "Compilation failed.");
    });

    await expect(client.sendRequest("boom")).rejects.toMatchObject({
      code: 6001,
      message: "Compilation failed.",
    });
  });

  it("reports method-not-found for unregistered methods", async () => {
    const [client] = makeChannel();
    await expect(client.sendRequest("nope")).rejects.toMatchObject({ code: -32601 });
  });

  it("delivers notifications without an id", async () => {
    const [client, server] = makeChannel();
    let seen: Record<string, unknown> | null = null;
    server.handle("push", (params) => {
      seen = params;
      return {};
    });

    client.sendNotification("push", { value: 42 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(seen).toMatchObject({ value: 42 });
  });

  it("re-inserts structured-clone bytes from the envelope into params", async () => {
    const [client, server] = makeChannel();
    let received: Uint8Array | null = null;
    server.handle("upload", (params) => {
      received = params["bytes"] as Uint8Array;
      return {};
    });

    // Simulate what postMessage does with a transferred payload.
    const originalPost = client["port"].postMessage.bind(client["port"]);
    client["port"].postMessage = (message: unknown) => {
      const envelope = message as Envelope;
      envelope.bytes = new Uint8Array([9, 8, 7]);
      originalPost(envelope);
    };

    await client.sendRequest("upload");
    expect(Array.from(received ?? [])).toEqual([9, 8, 7]);
  });

  it("rejects pending requests when the peer closes", async () => {
    const [client, server] = makeChannel();
    const pending = client.sendRequest("slow");
    server.handle("slow", () => new Promise(() => undefined));

    client.close();
    await expect(pending).rejects.toThrow(/Connection closed/);
  });

  it("handles concurrent requests without cross-wiring responses", async () => {
    const [client, server] = makeChannel();
    server.handle("echo", (params) => params["n"]);

    const results = await Promise.all([
      client.sendRequest<number>("echo", { n: 1 }),
      client.sendRequest<number>("echo", { n: 2 }),
      client.sendRequest<number>("echo", { n: 3 }),
    ]);
    expect(results).toEqual([1, 2, 3]);
  });
});
