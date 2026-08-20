import { describe, expect, it } from "vitest";
import { deflateCodec, rawCodec, shareCodecById, defaultShareCodec, encodeUtf8, decodeUtf8 } from "@/lib/share/codec";
import type { ShareCodec } from "@/lib/share/types";

const samples: string[] = [
  "",
  "short",
  "hello world!",
  "The quick brown fox jumps over the lazy dog. ".repeat(100),
  "🎉 分享 JSON 数据 📦",
  JSON.stringify({ mode: "single", tool: "AUTO_DETECT", input: "abc\nxyz", output: "ABC\nXYZ", display: "output", v: 1, autoDetect: true, wordWrap: false }),
];

async function roundTrip(codec: ShareCodec, input: string): Promise<void> {
  const bytes = encodeUtf8(input);
  const compressed = await codec.compress(bytes);
  const decompressed = await codec.decompress(compressed);
  expect(decodeUtf8(decompressed)).toBe(input);
}

describe("deflateCodec", () => {
  it("round-trips assorted content, including empty", async () => {
    for (const sample of samples) {
      await roundTrip(deflateCodec, sample);
    }
  });

  it("actually compresses repetitive text", async () => {
    const repeated = "lorem ipsum dolor sit amet ".repeat(500);
    const bytes = encodeUtf8(repeated);
    const compressed = await deflateCodec.compress(bytes);
    expect(compressed.byteLength).toBeLessThan(bytes.byteLength);
  });

  it("compresses the JSON payload form", async () => {
    const json = samples[5];
    const compressed = await deflateCodec.compress(encodeUtf8(json));
    expect(compressed.byteLength).toBeLessThan(encodeUtf8(json).byteLength);
  });
});

describe("rawCodec", () => {
  it("is identity", async () => {
    const bytes = encodeUtf8("anything 🚀");
    expect(await rawCodec.compress(bytes)).toEqual(bytes);
    expect(await rawCodec.decompress(bytes)).toEqual(bytes);
  });
});

describe("shareCodecById", () => {
  it("resolves the built-in codecs by id", () => {
    expect(shareCodecById("d")?.id).toBe("d");
    expect(shareCodecById("r")?.id).toBe("r");
  });

  it("returns null for unknown ids", () => {
    expect(shareCodecById("b")).toBeNull();
    expect(shareCodecById("")).toBeNull();
  });
});

describe("defaultShareCodec", () => {
  it("returns a codec with a known id", () => {
    const codec = defaultShareCodec();
    expect(["d", "r"]).toContain(codec.id);
  });
});