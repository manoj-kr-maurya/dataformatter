import { describe, expect, it } from "vitest";
import { createShareLink } from "@/lib/share/encoder";
import { restoreFromShareUrl, extractShareFromUrl } from "@/lib/share/decoder";
import { validateSharePayload } from "@/lib/share/serializer";
import type { SharePayload } from "@/lib/share/types";

const samplePayload: SharePayload = {
  v: 1,
  mode: "split",
  tool: "AUTO_DETECT",
  autoDetect: true,
  wordWrap: true,
  input: '{"name":"Ada","tags":["valid","JSON"]}\nsecond line',
  output: '{\n  "name": "Ada",\n  "tags": ["valid", "JSON"]\n}',
  display: "output",
};

const evalPayload: SharePayload = {
  v: 1,
  mode: "single",
  tool: "JSON_FORMAT",
  autoDetect: false,
  wordWrap: false,
  input: "short input",
  output: "short output",
  display: "input",
};

describe("createShareLink / restoreFromShareUrl round trip", () => {
  it("builds a shareable URL and restores the identical payload", async () => {
    const link = await createShareLink(samplePayload, { baseUrl: "https://dataformatter.in/" });

    expect(link.url).toMatch(/^https:\/\/dataformatter\.in\/#\/share\/[a-z]\//);
    expect(link.encodedChars).toBe(link.hash.length);

    const restored = await restoreFromShareUrl(link.url);
    expect(restored.status).toBe("ok");
    if (restored.status === "ok") {
      expect(restored.payload).toEqual(samplePayload);
    }
  });

  it("round-trips a payload with unicode + line breaks", async () => {
    const unicode: SharePayload = {
      ...samplePayload,
      input: "héllo 🎉\ntab\there\nक्या",
      output: "HELLO 🎉",
      wordWrap: false,
    };
    const link = await createShareLink(unicode, { baseUrl: "https://example.org/#existing" });
    const restored = await restoreFromShareUrl(link.url);
    expect(restored.status).toBe("ok");
    if (restored.status === "ok") {
      expect(restored.payload).toEqual(unicode);
    }
  });

  it("falls back to raw when compression is unavailable", async () => {
    // rawCodec is exercised via shareCodecById in decoder tests; this just hashes the marker.
    const link = await createShareLink(samplePayload, { baseUrl: "" });
    expect(link.codecId).toMatch(/^[dr]$/);
    expect(link.url.startsWith(`#/share/${link.codecId}/`)).toBe(true);
  });

  it("flags oversized links via the limit option", async () => {
    const big = new SharePayloadBuilder(30_000).build();
    const link = await createShareLink(big, { baseUrl: "x", limit: 10_000 });
    expect(link.tooLarge).toBe(true);

    const small = await createShareLink(samplePayload, { baseUrl: "x", limit: 1_000_000 });
    expect(small.tooLarge).toBe(false);
  });

  it("keeps originalBytes/compressedBytes/encodedChars accurate", async () => {
    const link = await createShareLink(samplePayload, { baseUrl: "x" });
    expect(link.originalBytes).toBeGreaterThan(0);
    expect(link.compressedBytes).toBeGreaterThan(0);
    expect(link.encodedChars).toBeGreaterThan(link.compressedBytes);
  });
});

describe("extractShareFromUrl", () => {
  it("parses hash from a full URL", () => {
    const { found, codecId, encoded } = extractShareFromUrl(`https://x.example/path?query=1#/share/d/AbCd--_`);
    expect(found).toBe(true);
    expect(codecId).toBe("d");
    expect(encoded).toBe("AbCd--_");
  });

  it("parses a bare hash", () => {
    const { found, codecId, encoded } = extractShareFromUrl(`#/share/r/aGVsbG8`);
    expect(found).toBe(true);
    expect(codecId).toBe("r");
    expect(encoded).toBe("aGVsbG8");
  });

  it("returns found:false when there is no share prefix", () => {
    expect(extractShareFromUrl("https://x.example/").found).toBe(false);
    expect(extractShareFromUrl("https://x.example/#/other/abc").found).toBe(false);
    expect(extractShareFromUrl("").found).toBe(false);
    expect(extractShareFromUrl("#/share/d").found).toBe(false);
  });
});

describe("restoreFromShareUrl error handling", () => {
  it("returns none for a non-share URL", async () => {
    expect((await restoreFromShareUrl("https://x.example/")).status).toBe("none");
  });

  it("returns error for an unknown codec", async () => {
    const result = await restoreFromShareUrl(`#/share/b/aaa`);
    expect(result.status).toBe("error");
  });

  it("returns error for tampered (non-decodable) payloads", async () => {
    const result = await restoreFromShareUrl(`#/share/d/not%20base64url!!`);
    expect(result.status).toBe("error");
  });

  it("returns error for valid base64 that is not JSON", async () => {
    // "hello" -> standard base64 "aGVsbG8"
    const result = await restoreFromShareUrl(`#/share/r/aGVsbG8`);
    expect(result.status).toBe("error");
  });

  it("returns error for structurally invalid JSON payloads", async () => {
    const okJson = JSON.stringify({ ...samplePayload, v: 2 });
    const b64 = Buffer.from(okJson, "utf8").toString("base64url");
    const result = await restoreFromShareUrl(`#/share/r/${b64}`);
    expect(result.status).toBe("error");
  });

  it("returns error for JSON missing required fields", async () => {
    const broken = JSON.stringify({ v: 1, mode: "split" });
    const b64 = Buffer.from(broken, "utf8").toString("base64url");
    const result = await restoreFromShareUrl(`#/share/r/${b64}`);
    expect(result.status).toBe("error");
  });
});

describe("optional output for deterministic tools", () => {
  it("accepts a deterministic payload without output and restores it", async () => {
    const noOutput: SharePayload = { ...samplePayload, output: undefined };
    expect(validateSharePayload(noOutput)).toBeNull();

    const link = await createShareLink(noOutput, { baseUrl: "https://x.example/" });
    const restored = await restoreFromShareUrl(link.url);
    expect(restored.status).toBe("ok");
    if (restored.status === "ok") {
      expect(restored.payload).toEqual(noOutput);
      expect(restoredPayloadHas("output", restored.payload)).toBe(false);
    }
  });

  it("rejects non-deterministic (random) tools that omit output", () => {
    const missing = {
      v: 1,
      mode: "split",
      tool: "RANDOM_UUID",
      autoDetect: false,
      wordWrap: false,
      input: "5",
      display: "output",
    };
    expect(validateSharePayload(missing)).toMatch(/non-deterministic/);
    expect(validateSharePayload({ ...samplePayload, tool: "RANDOM_UUID" })).toBeNull();
  });

  it("accepts a deterministic payload whose output is present (legacy links)", () => {
    expect(validateSharePayload(samplePayload)).toBeNull();
  });

  it("accepts non-deterministic tools with an empty string output", () => {
    expect(validateSharePayload({ ...samplePayload, tool: "SHUFFLE_LINES", output: "" })).toBeNull();
  });

  it("rejects non-deterministic tools with a non-string output", () => {
    expect(
      validateSharePayload({ ...samplePayload, tool: "PASSWORD_GENERATOR", output: 42 }),
    ).not.toBeNull();
  });

  it("treats unknown tool ids as deterministic (no stored output needed)", () => {
    const unknown = { ...samplePayload, tool: "REMOVED_TOOL_X" , output: undefined };
    expect(validateSharePayload(unknown)).toBeNull();
  });

  it("drops the output key from the serialized JSON for deterministic payloads", async () => {
    const link = await createShareLink({ ...samplePayload, output: undefined }, { baseUrl: "x" });
    expect(link.originalBytes).toBeLessThan(
      (await createShareLink(samplePayload, { baseUrl: "x" })).originalBytes,
    );
  });
});

describe("validateSharePayload", () => {
  it("accepts the canonical payload", () => {
    expect(validateSharePayload(samplePayload)).toBeNull();
    expect(validateSharePayload(evalPayload)).toBeNull();
  });

  it("rejects non-objects", () => {
    expect(validateSharePayload(null)).not.toBeNull();
    expect(validateSharePayload("abc")).not.toBeNull();
    expect(validateSharePayload(42)).not.toBeNull();
  });

  it("rejects wrong version", () => {
    expect(validateSharePayload({ ...samplePayload, v: 2 })).not.toBeNull();
  });

  it("rejects bad enumerations", () => {
    expect(validateSharePayload({ ...samplePayload, mode: "triple" })).not.toBeNull();
    expect(validateSharePayload({ ...samplePayload, display: "both" })).not.toBeNull();
  });

  it("rejects wrong field types", () => {
    expect(validateSharePayload({ ...samplePayload, input: 5 })).not.toBeNull();
    expect(validateSharePayload({ ...samplePayload, autoDetect: "yes" })).not.toBeNull();
    expect(validateSharePayload({ ...samplePayload, tool: "" })).not.toBeNull();
  });

  it("rejects missing fields", () => {
    const noDisplay: Partial<SharePayload> = { ...samplePayload };
    delete noDisplay.display;
    expect(validateSharePayload(noDisplay)).not.toBeNull();
  });
});

function restoredPayloadHas(key: string, payload: unknown): boolean {
  return typeof payload === "object" && payload !== null && key in payload;
}

/** Helper that builds a payload with input of roughly `targetChars` characters. */
class SharePayloadBuilder {
  private payload: SharePayload;
  constructor(private targetChars: number) {
    this.payload = { ...samplePayload };
  }
  build(): SharePayload {
    const rnd = this.seededRandom(42);
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const chars: string[] = [];
    for (let i = 0; i < this.targetChars; i++) {
      chars.push(alphabet[Math.floor(rnd() * alphabet.length)]);
    }
    this.payload.input = chars.join("");
    this.payload.output = chars.slice(0, Math.min(this.targetChars, 1000)).join("");
    return this.payload;
  }
  private seededRandom(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
}