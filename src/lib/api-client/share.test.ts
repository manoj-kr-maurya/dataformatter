import { describe, expect, it } from "vitest";
import {
  API_CLIENT_HASH_PREFIX,
  createApiClientShareLink,
  extractApiClientShare,
  restoreApiClientShare,
} from "@/lib/api-client/share";
import { emptyDraft, newRow, type RequestDraft } from "@/lib/api-client/types";

function draft(overrides: Partial<RequestDraft> = {}): RequestDraft {
  return { ...emptyDraft(), ...overrides };
}

describe("api client share links", () => {
  it("round-trips a full request through encode → decode", async () => {
    const original = draft({
      method: "POST",
      url: "https://api.example.com/orders",
      query: [newRow("dryRun", "true")],
      headers: [newRow("X-Trace", "abc")],
      bodyMode: "json",
      bodyText: '{"item":"widget"}',
    });
    const link = await createApiClientShareLink(original);
    expect(link.url).toContain(API_CLIENT_HASH_PREFIX);

    const restored = await restoreApiClientShare(link.url);
    expect(restored.status).toBe("ok");
    if (restored.status !== "ok") {
      return;
    }
    expect(restored.payload.method).toBe("POST");
    expect(restored.payload.url).toBe(original.url);
    expect(restored.payload.query[0]).toMatchObject({ name: "dryRun", value: "true" });
    expect(restored.payload.headers[0]).toMatchObject({ name: "X-Trace", value: "abc" });
    expect(restored.payload.bodyMode).toBe("json");
    expect(restored.payload.bodyText).toBe('{"item":"widget"}');
  });

  it("omits defaults: GET, no body, no auth produce minimal payloads", async () => {
    const link = await createApiClientShareLink(draft({ url: "https://x.dev/" }));
    const restored = await restoreApiClientShare(link.url);
    expect(restored.status).toBe("ok");
    if (restored.status === "ok") {
      expect(restored.payload.method).toBe("GET");
      expect(restored.payload.bodyMode).toBe("none");
      expect(restored.payload.authMode).toBe("none");
    }
  });

  it("keeps disabled rows out of the link entirely", async () => {
    const link = await createApiClientShareLink(
      draft({
        url: "https://x.dev/",
        query: [newRow("on", "1"), newRow("off", "2", false)],
      }),
    );
    const restored = await restoreApiClientShare(link.url);
    if (restored.status !== "ok") {
      throw new Error("expected ok restore");
    }
    expect(restored.payload.query.map((row) => row.name)).toEqual(["on"]);
  });

  it("flags credential-bearing links via hasSecrets", async () => {
    const withToken = await createApiClientShareLink(
      draft({ url: "https://x.dev/", headers: [newRow("Authorization", "Bearer abc")] }),
    );
    expect(withToken.hasSecrets).toBe(true);

    const clean = await createApiClientShareLink(
      draft({ url: "https://x.dev/", query: [newRow("page", "2")] }),
    );
    expect(clean.hasSecrets).toBe(false);
  });

  it("extracts only #/api/ hashes", () => {
    expect(extractApiClientShare("https://e.com/api-client#/api/n/xyz").found).toBe(true);
    expect(extractApiClientShare("#/dart/n/xyz").found).toBe(false);
    expect(extractApiClientShare("#/share/x").found).toBe(false);
    expect(extractApiClientShare("#/api/onlycodec").found).toBe(false);
  });

  it("returns error status for corrupted payloads instead of throwing", async () => {
    const restored = await restoreApiClientShare(`${API_CLIENT_HASH_PREFIX}r/!!!nope!!!`);
    expect(restored.status).toBe("error");
  });

  it("rejects payloads missing the URL field", async () => {
    const { encodeBase64Url } = await import("@/lib/share/base64url");
    const { encodeUtf8 } = await import("@/lib/share/codec");
    const forged = `${API_CLIENT_HASH_PREFIX}r/${encodeBase64Url(encodeUtf8('{"m":"GET"}'))}`;
    expect((await restoreApiClientShare(forged)).status).toBe("error");
  });
});
