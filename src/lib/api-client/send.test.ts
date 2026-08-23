import { describe, expect, it, vi } from "vitest";
import { sendRequest } from "@/lib/api-client/send";
import { emptyDraft, exampleDraft } from "@/lib/api-client/types";

function jsonResponse(body: unknown, contentType = "application/json"): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": contentType },
  });
}

describe("sendRequest", () => {
  it("captures status, timing and a decoded JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendRequest(exampleDraft());
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.response.status).toBe(200);
    expect(result.response.ok).toBe(true);
    expect(result.response.kind).toBe("json");
    expect(JSON.parse(result.response.bodyText)).toEqual({ ok: true });
    expect(result.response.durationMs).toBeGreaterThanOrEqual(0);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://jsonplaceholder.typicode.com/todos/1",
    );
  });

  it("surfaces invalid URLs without touching fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendRequest(emptyDraft());
    expect(result).toMatchObject({ status: "failed", kind: "invalid-url" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps TypeError rejections to the CORS/network explanation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const result = await sendRequest(exampleDraft());
    expect(result).toMatchObject({ status: "failed", kind: "network" });
    if (result.status === "failed") {
      expect(result.message).toMatch(/CORS/);
    }
  });

  it("reports timeouts distinctly from user cancels", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener(
              "abort",
              () => reject(new DOMException("Aborted", "AbortError")),
              { once: true },
            );
          }),
      ),
    );

    const pending = sendRequest(exampleDraft(), { timeoutMs: 5 });
    vi.advanceTimersByTime(10);
    const result = await pending;
    expect(result).toMatchObject({ status: "failed", kind: "timeout" });
    vi.useRealTimers();
  });
});
