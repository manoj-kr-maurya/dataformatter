import { describe, expect, it } from "vitest";
import {
  COMPILER_HASH_PREFIX,
  createCompilerShareLink,
  extractCompilerShare,
  restoreCompilerShare,
} from "@/lib/compiler/share";

const PROGRAM = `void main() {
  print('hello from a shared link');
}
`;

describe("compiler share links", () => {
  it("round-trips code and stdin through encode → decode", async () => {
    const payload = { code: PROGRAM, stdin: "one\ntwo\n" };
    const link = await createCompilerShareLink(payload);

    expect(link.url).toContain(COMPILER_HASH_PREFIX);
    const restored = await restoreCompilerShare(link.url);
    expect(restored.status).toBe("ok");
    if (restored.status === "ok") {
      expect(restored.payload.code).toBe(PROGRAM);
      expect(restored.payload.stdin).toBe("one\ntwo\n");
    }
  });

  it("defaults stdin to empty when absent", async () => {
    const link = await createCompilerShareLink({ code: PROGRAM, stdin: "" });
    const restored = await restoreCompilerShare(link.url);
    expect(restored.status).toBe("ok");
    if (restored.status === "ok") {
      expect(restored.payload.stdin).toBe("");
    }
  });

  it("extracts codec id + encoded part from a URL with other hashes present", () => {
    const extracted = extractCompilerShare("https://example.com/page#/dart/n/abc123");
    expect(extracted.found).toBe(true);
    expect(extracted.codecId).toBe("n");
    expect(extracted.encoded).toBe("abc123");

    expect(extractCompilerShare("#/share/d/other").found).toBe(false);
    expect(extractCompilerShare("no hash at all").found).toBe(false);
    expect(extractCompilerShare("#/dart/onlycodec").found).toBe(false);
  });

  it("returns error status for corrupted payloads instead of throwing", async () => {
    const restored = await restoreCompilerShare(`${COMPILER_HASH_PREFIX}r/!!!not-base64url!!!`);
    // '!!!...' decodes to garbage that fails JSON parsing.
    if (restored.status === "error") {
      expect(restored.message).toMatch(/Unable to open/);
    } else {
      expect.fail("expected an error result");
    }
  });

  it("returns error status for payloads missing the code field", async () => {
    const { encodeBase64Url } = await import("@/lib/share/base64url");
    const { encodeUtf8 } = await import("@/lib/share/codec");
    const forged = `${COMPILER_HASH_PREFIX}r/${encodeBase64Url(encodeUtf8('{"v":1}'))}`;
    const restored = await restoreCompilerShare(forged);
    expect(restored.status).toBe("error");
  });

  it("flags oversized programs as tooLarge but still encodes them", async () => {
    // Random characters defeat compression so the encoded link really is big.
    let random = "";
    while (random.length < 40_000) {
      random += Math.random().toString(36).slice(2);
    }
    const big = `void main() {\n  print('${random}');\n}\n`;
    const link = await createCompilerShareLink({ code: big, stdin: "" });
    expect(link.tooLarge).toBe(true);
  });
});
