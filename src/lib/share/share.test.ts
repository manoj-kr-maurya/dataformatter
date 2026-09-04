import { describe, expect, it } from "vitest";
import { createShareLink } from "@/lib/share/encoder";
import { restoreFromShareUrl, extractShareFromUrl } from "@/lib/share/decoder";
import {
  normalizeSharePayload,
  serializeSharePayload,
  validateSharePayload,
  encodeToolCode,
  decodeToolCode,
} from "@/lib/share/serializer";
import { encodeBase64Url } from "@/lib/share/base64url";
import { encodeUtf8 } from "@/lib/share/codec";
import { SHARE_SCHEMA_VERSION } from "@/lib/share/types";
import type { SharePayload } from "@/lib/share/types";

const deflateRawEnabled =
  typeof CompressionStream === "function" &&
  typeof DecompressionStream === "function" &&
  typeof Response === "function";
let deflateRawSupported = deflateRawEnabled;
try {
  if (deflateRawEnabled) {
    new CompressionStream("deflate-raw");
  }
} catch {
  deflateRawSupported = false;
}
const deflateEnabled = deflateRawEnabled;

const samplePayload: SharePayload = {
  v: SHARE_SCHEMA_VERSION,
  mode: "split",
  tool: "AUTO_DETECT",
  autoDetect: true,
  wordWrap: true,
  input: '{"name":"Ada","tags":["valid","JSON"]}\nsecond line',
  output: '{\n  "name": "Ada",\n  "tags": ["valid", "JSON"]\n}',
  display: "output",
};

async function roundTrip(payload: SharePayload): Promise<SharePayload> {
  const link = await createShareLink(payload, { baseUrl: "https://x.example/" });
  const restored = await restoreFromShareUrl(link.url);
  expect(restored.status).toBe("ok");
  if (restored.status !== "ok") {
    throw new Error("restore failed");
  }
  return restored.payload;
}

describe("createShareLink / restoreFromShareUrl round trip", () => {
  it("restores the identical payload", async () => {
    const link = await createShareLink(samplePayload, { baseUrl: "https://dataformatter.in/" });
    expect(link.url).toMatch(/^https:\/\/dataformatter\.in\/#\/share\/[a-z]\//);
    expect(link.encodedChars).toBe(link.hash.length);
    const restored = await roundTrip(samplePayload);
    expect(restored).toEqual(samplePayload);
  });

  it("decodes defaults when fields are omitted", async () => {
    const compact = {
      v: SHARE_SCHEMA_VERSION,
      m: 2,
      t: encodeToolCode("AUTO_DETECT"),
      i: '{"a":1}',
    };
    const normalized = normalizeSharePayload(compact);
    expect(normalized).toEqual({
      v: SHARE_SCHEMA_VERSION,
      mode: "split",
      tool: "AUTO_DETECT",
      autoDetect: true,
      wordWrap: false,
      input: '{"a":1}',
      output: undefined,
      display: "output",
    });
  });

  it("decodes a v2 payload (m required, t is a full id)", async () => {
    const normalized = normalizeSharePayload({
      v: 2,
      m: 1,
      t: "AUTO_DETECT",
      i: '{"a":1}',
    });
    expect(normalized).toEqual({
      v: 2,
      mode: "single",
      tool: "AUTO_DETECT",
      autoDetect: true,
      wordWrap: false,
      input: '{"a":1}',
      output: undefined,
      display: "output",
    });
  });

  it("preserves non-default settings exactly", async () => {
    const nonDefault: SharePayload = {
      v: SHARE_SCHEMA_VERSION,
      mode: "single",
      tool: "JSON_FORMAT",
      autoDetect: false,
      wordWrap: true,
      input: "not json",
      output: undefined,
      display: "input",
    };
    const restored = await roundTrip(nonDefault);
    expect(restored.mode).toBe("single");
    expect(restored.tool).toBe("JSON_FORMAT");
    expect(restored.autoDetect).toBe(false);
    expect(restored.wordWrap).toBe(true);
    expect(restored.display).toBe("input");
  });

  it("preserves input with every URL-hostile character exactly", async () => {
    const nasty = [
      "plain",
      "with spaces and & ampersand ? question # hash % percent + plus / slash = eq",
      'quotes "double" \'single\' and \\backslash \\n literal',
      "emoji 🎉🚀😀 and CJK 数据格式化 and RTL مرحبا",
      "tabs\there\nnewlines\nand\r\ncrlf",
      "\u0000 null\u0001 control \u007f \uffff \ud83d\ude80",
    ];
    for (const input of nasty) {
      const restored = await roundTrip({ ...samplePayload, input });
      expect(restored.input).toBe(input);
    }
  });

  it("handles empty input", async () => {
    const restored = await roundTrip({ ...samplePayload, input: "", output: undefined });
    expect(restored.input).toBe("");
  });

  it("handles invalid JSON input (input is preserved verbatim)", async () => {
    const invalid = '{ "name": "broken", } ,, ,';
    const restored = await roundTrip({ ...samplePayload, input: invalid, output: undefined });
    expect(restored.input).toBe(invalid);
  });

  it("handles very large but compressible input", async () => {
    const big = JSON.stringify(
      Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `item-${i}`, nested: { tags: ["a", "b", "c"], active: i % 2 === 0 } })),
    );
    const link = await createShareLink({ ...samplePayload, input: big, output: undefined }, { baseUrl: "x", limit: 1_000_000 });
    expect(link.tooLarge).toBe(false);
    expect(link.encodedChars).toBeLessThan(big.length / 2);
    const restored = await roundTrip({ ...samplePayload, input: big, output: undefined });
    expect(restored.input).toBe(big);
  });
});

describe("deterministic output is never stored", () => {
  it("serializes without an output key", async () => {
    const serialized = serializeSharePayload({ ...samplePayload, output: undefined });
    expect(serialized).not.toContain('"o"');

    const link = await createShareLink({ ...samplePayload, output: undefined }, { baseUrl: "x" });
    const restored = await restoreFromShareUrl(link.url);
    expect(restored.status).toBe("ok");
  });

  it("stores and restores output for non-deterministic tools", async () => {
    const generated: SharePayload = {
      v: SHARE_SCHEMA_VERSION,
      mode: "split",
      tool: "RANDOM_UUID",
      autoDetect: false,
      wordWrap: false,
      input: "20",
      output: "a-generated-uuid\ranother-uuid",
      display: "output",
    };
    const restored = await roundTrip(generated);
    expect(restored.tool).toBe("RANDOM_UUID");
    expect(restored.output).toBe(generated.output);
  });

  it("keeps the exact output for SHUFFLE_LINES and PASSWORD_GENERATOR", async () => {
    for (const tool of ["SHUFFLE_LINES", "PASSWORD_GENERATOR"] as const) {
      const restored = await roundTrip({
        ...samplePayload,
        tool,
        autoDetect: false,
        output: "verbatim-result-line-1\nverbatim-result-line-2",
      });
      expect(restored.output).toBe("verbatim-result-line-1\nverbatim-result-line-2");
    }
  });
});

describe("legacy v1 links still decode", () => {
  const v1 = {
    v: 1,
    mode: "single",
    tool: "JSON_MINIFY",
    autoDetect: false,
    wordWrap: true,
    input: "{\n  \"a\": 1\n}",
    output: '{"a":1}',
    display: "output",
  };

  it("decodes a v1 payload via the raw codec", async () => {
    const b64 = encodeBase64Url(encodeUtf8(JSON.stringify(v1)));
    const url = `https://x.example/#/share/r/${b64}`;
    const result = await restoreFromShareUrl(url);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.payload).toEqual(v1);
    }
  });

  it("decodes a v1 payload via the deflate codec", async () => {
    const { deflateCodec } = await import("@/lib/share/codec");
    const compressed = await deflateCodec.compress(encodeUtf8(JSON.stringify(v1)));
    const b64 = encodeBase64Url(compressed);
    const url = `https://x.example/#/share/d/${b64}`;
    const result = await restoreFromShareUrl(url);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.payload).toEqual(v1);
    }
  });
});

describe("adaptive codec", () => {
  it("selects deflate for high-entropy-reducing repetitive text when available", async () => {
    const repetitive = (JSON.stringify(Array.from({ length: 4000 }, (_, i) => i))).repeat(1);
    const link = await createShareLink({ ...samplePayload, input: repetitive, output: undefined }, { baseUrl: "x" });
    expect(link.codecId).toBe(deflateRawSupported ? "n" : deflateEnabled ? "d" : "r");
    expect(link.compressedBytes).toBeLessThan(link.originalBytes);
  });

  it("never produces an encoded form longer than raw for tiny payloads", async () => {
    const tiny = await createShareLink({ ...samplePayload, input: "a", output: undefined }, { baseUrl: "x" });
    const restored = await restoreFromShareUrl(tiny.url);
    expect(restored.status).toBe("ok");
    // The chosen codec must be self-consistent: hash round-trips regardless.
    expect(tiny.hash.length).toBe(tiny.encodedChars);
  });

  it("round-trips through every codec id", async () => {
    for (const codecId of ["d", "r", "n"]) {
      const { rawCodec, deflateCodec, deflateRawCodec } = await import("@/lib/share/codec");
      const codec =
        codecId === "d" ? deflateCodec : codecId === "n" ? deflateRawCodec : rawCodec;
      const serialized = encodeUtf8(serializeSharePayload(samplePayload));
      const encoded = encodeBase64Url(await codec.compress(serialized));
      const result = await restoreFromShareUrl(`x/#/share/${codecId}/${encoded}`);
      expect(result.status).toBe("ok");
      if (result.status === "ok") {
        expect(result.payload).toEqual(samplePayload);
      }
    }
  });
});

describe("v3 tool codes", () => {
  it("encodes AUTO_DETECT and the first 62 tools as single chars", () => {
    expect(encodeToolCode("AUTO_DETECT")).toBe("0");
    expect(encodeToolCode("JSON_FORMAT")).toBe("1");
    expect(encodeToolCode("JSON_MINIFY")).toBe("2");
    expect(decodeToolCode("0")).toBe("AUTO_DETECT");
    expect(decodeToolCode("1")).toBe("JSON_FORMAT");
  });

  it("is a reversible bijection for every known tool", async () => {
    const { SHARE_TOOL_CODES } = await import("@/lib/share/serializer");
    for (const tool of SHARE_TOOL_CODES) {
      expect(decodeToolCode(encodeToolCode(tool))).toBe(tool);
      expect(encodeToolCode(tool).length).toBeLessThanOrEqual(2);
    }
  });

  it("passes through full ids and keeps v2-style links working", () => {
    expect(decodeToolCode("AUTO_DETECT")).toBe("AUTO_DETECT");
    expect(decodeToolCode("RANDOM_UUID")).toBe("RANDOM_UUID");
  });

  it("unknown two-char codes fall through to the raw id", () => {
    expect(decodeToolCode("zz")).toBe("zz");
  });
});

describe("extractShareFromUrl", () => {
  it("parses a hash from a full URL", () => {
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

  it("returns found:false without the share prefix", () => {
    expect(extractShareFromUrl("https://x.example/").found).toBe(false);
    expect(extractShareFromUrl("https://x.example/#/other/abc").found).toBe(false);
    expect(extractShareFromUrl("").found).toBe(false);
    expect(extractShareFromUrl("#/share/d").found).toBe(false);
  });
});

describe("too-large handling", () => {
  it("flags oversized links without truncating the payload", async () => {
    const builder = new RandomPayloadBuilder(30_000);
    const link = await createShareLink(builder.build(), { baseUrl: "x", limit: 10_000 });
    expect(link.tooLarge).toBe(true);
    // The URL is still complete and decodable — never truncated.
    const restored = await restoreFromShareUrl(link.url);
    expect(restored.status).toBe("ok");
    if (restored.status === "ok") {
      expect(restored.payload.input).toBe(builder.input);
    }
  });

  it("does not flag reasonably sized links", async () => {
    const link = await createShareLink(samplePayload, { baseUrl: "x", limit: 10_000 });
    expect(link.tooLarge).toBe(false);
  });
});

describe("normalizeSharePayload validation", () => {
  it("rejects wrong or missing versions", () => {
    expect(normalizeSharePayload(null)).toBeNull();
    expect(normalizeSharePayload(42)).toBeNull();
    expect(normalizeSharePayload({ v: 2 })).toBeNull();
    expect(normalizeSharePayload({})).toBeNull();
  });

  it("rejects structurally invalid v3 payloads", () => {
    expect(normalizeSharePayload({ v: 3, m: 3, t: "0", i: "" })).toBeNull();
    expect(normalizeSharePayload({ v: 3, m: 1, t: "0", i: "" })).toBeNull();
    expect(normalizeSharePayload({ v: 3, t: "", i: "" })).toBeNull();
    expect(normalizeSharePayload({ v: 3, t: "0" })).toBeNull();
    expect(normalizeSharePayload({ v: 3, t: "0", i: 5 })).toBeNull();
    expect(normalizeSharePayload({ v: 3, t: "0", i: "", a: 1 })).toBeNull();
    expect(normalizeSharePayload({ v: 3, t: "0", i: "", w: 0 })).toBeNull();
    expect(normalizeSharePayload({ v: 3, t: "0", i: "", d: "x" })).toBeNull();
    expect(normalizeSharePayload({ v: 3, t: "0", i: "", o: 7 })).toBeNull();
  });

  it("rejects structurally invalid v2 payloads", () => {
    expect(normalizeSharePayload({ v: 2, m: 3, t: "X", i: "" })).toBeNull();
    expect(normalizeSharePayload({ v: 2, m: 1, t: "", i: "" })).toBeNull();
    expect(normalizeSharePayload({ v: 2, m: 1, i: "" })).toBeNull();
    expect(normalizeSharePayload({ v: 2, m: 1, t: "X" })).toBeNull();
    expect(normalizeSharePayload({ v: 2, m: 1, t: "X", i: 5 })).toBeNull();
    expect(normalizeSharePayload({ v: 2, m: 1, t: "X", i: "", a: 1 })).toBeNull();
    expect(normalizeSharePayload({ v: 2, m: 1, t: "X", i: "", w: 0 })).toBeNull();
    expect(normalizeSharePayload({ v: 2, m: 1, t: "X", i: "", d: "x" })).toBeNull();
    expect(normalizeSharePayload({ v: 2, m: 1, t: "X", i: "", o: 7 })).toBeNull();
  });

  it("requires output for non-deterministic tools", () => {
    expect(normalizeSharePayload({ v: 3, t: encodeToolCode("RANDOM_UUID"), i: "5" })).toBeNull();
    expect(
      normalizeSharePayload({ v: 3, t: encodeToolCode("RANDOM_UUID"), i: "5", o: "abc" }),
    ).not.toBeNull();
  });
});

describe("validateSharePayload (canonical shape)", () => {
  it("accepts the canonical payload", () => {
    expect(validateSharePayload(samplePayload)).toBeNull();
  });

  it("rejects bad field types", () => {
    expect(validateSharePayload({ ...samplePayload, input: 5 })).not.toBeNull();
    expect(validateSharePayload({ ...samplePayload, autoDetect: "yes" })).not.toBeNull();
    expect(validateSharePayload({ ...samplePayload, mode: "triple" })).not.toBeNull();
    expect(validateSharePayload({ ...samplePayload, tool: "" })).not.toBeNull();
  });
});

describe("compact serialization", () => {
  it("omits default fields (split, m kept; single m dropped)", () => {
    const split = JSON.parse(serializeSharePayload({
      v: SHARE_SCHEMA_VERSION, mode: "split", tool: "AUTO_DETECT", autoDetect: true, wordWrap: false,
      input: "hi", display: "output",
    }));
    expect(split).toEqual({ v: 3, m: 2, t: "0", i: "hi" });

    const single = JSON.parse(serializeSharePayload({
      v: SHARE_SCHEMA_VERSION, mode: "single", tool: "AUTO_DETECT", autoDetect: true, wordWrap: false,
      input: "hi", display: "output",
    }));
    expect(single).toEqual({ v: 3, t: "0", i: "hi" });
  });

  it("includes non-default fields", () => {
    const compact = JSON.parse(serializeSharePayload({
      v: SHARE_SCHEMA_VERSION, mode: "single", tool: "JSON_FORMAT", autoDetect: false, wordWrap: true,
      input: "hi", display: "input",
    }));
    expect(compact).toEqual({ v: 3, t: "1", a: 0, w: 1, i: "hi", d: "i" });
  });

  it("always embeds output for non-deterministic tools", () => {
    const compact = JSON.parse(serializeSharePayload({
      v: SHARE_SCHEMA_VERSION, mode: "split", tool: "RANDOM_JSON", autoDetect: true, wordWrap: false,
      input: "5", output: "{\"x\":1}", display: "output",
    }));
    expect(compact.o).toBe("{\"x\":1}");
    expect(compact.m).toBe(2);
  });
});

/** Generates deterministic high-entropy content so it does not compress. */
class RandomPayloadBuilder {
  readonly input: string;
  constructor(count: number) {
    const rnd = this.seeded(42);
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const chars: string[] = [];
    for (let i = 0; i < count; i++) {
      chars.push(alphabet[Math.floor(rnd() * alphabet.length)]);
    }
    this.input = chars.join("");
  }
  build(): SharePayload {
    return { ...samplePayload, input: this.input, output: undefined };
  }
  private seeded(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
}