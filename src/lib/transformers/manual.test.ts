import { describe, expect, it } from "vitest";
import { jsonFormatter } from "@/lib/transformers/jsonFormatter";
import { jsonMinifier } from "@/lib/transformers/jsonMinifier";
import { base64Decoder } from "@/lib/transformers/base64Decoder";
import { base64ToJson } from "@/lib/transformers/base64ToJson";
import { jsonToBase64 } from "@/lib/transformers/jsonToBase64";
import { encodeBase64 } from "@/lib/base64/encode";

describe("jsonFormatter", () => {
  it("pretty-prints compact JSON", () => {
    const result = jsonFormatter('{"a":1,"b":[1,2]}');
    expect(result.success).toBe(true);
    expect(result.output).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
    expect(result.transformation).toBe("JSON_FORMAT");
  });

  it("fails on invalid JSON with a helpful message", () => {
    const result = jsonFormatter('{"a":}');
    expect(result.success).toBe(false);
    expect(result.output).toBe('{"a":}');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it("fails on empty input", () => {
    const result = jsonFormatter("  ");
    expect(result.success).toBe(false);
  });
});

describe("jsonMinifier", () => {
  it("minifies pretty JSON", () => {
    const result = jsonMinifier('{\n  "a": 1\n}');
    expect(result.success).toBe(true);
    expect(result.output).toBe('{"a":1}');
    expect(result.transformation).toBe("JSON_MINIFY");
  });

  it("fails on invalid JSON", () => {
    expect(jsonMinifier("nope").success).toBe(false);
  });
});

describe("base64Encoder and base64Decoder", () => {
  const input = '{"userId":"123"}';
  const encoded = encodeBase64(input);

  it("encode then decode round-trips", () => {
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const decoded = base64Decoder(encoded.value);
    expect(decoded.success).toBe(true);
    expect(decoded.output).toBe(input);
  });

  it("decode fails on garbage", () => {
    const result = base64Decoder("not base64 at all!!!");
    expect(result.success).toBe(false);
  });
});

describe("base64ToJson", () => {
  it("decodes Base64 JSON back to pretty JSON", () => {
    const result = base64ToJson("eyJuYW1lIjoiSm9obiIsImFnZSI6MzB9");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("BASE64_TO_JSON");
    expect(result.output).toBe('{\n  "name": "John",\n  "age": 30\n}');
  });

  it("fails when decoded content is not JSON", () => {
    const text = encodeBase64("just plain text");
    expect(text.ok).toBe(true);
    if (!text.ok) return;
    const result = base64ToJson(text.value);
    expect(result.success).toBe(false);
    expect(result.message).toContain("not valid JSON");
  });

  it("fails on invalid Base64", () => {
    expect(base64ToJson("!!notbase64!!").success).toBe(false);
  });
});

describe("jsonToBase64", () => {
  it("validates JSON and encodes it", () => {
    const encoded = encodeBase64('{"a":1}');
    if (!encoded.ok) throw new Error("sanity: encode should succeed");
    const result = jsonToBase64('{"a":1}');
    expect(result.success).toBe(true);
    expect(result.output).toBe(encoded.value);
    expect(result.transformation).toBe("JSON_TO_BASE64");
  });

  it("fails on invalid JSON", () => {
    const result = jsonToBase64("not json");
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid JSON");
  });
});