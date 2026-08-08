import { describe, expect, it } from "vitest";
import { encodeBase64 } from "@/lib/base64/encode";
import { decodeBase64 } from "@/lib/base64/decode";

describe("encodeBase64", () => {
  it("encodes ASCII text", () => {
    const result = encodeBase64("hello world");
    expect(result.ok && result.value).toBe("aGVsbG8gd29ybGQ=");
  });

  it("encodes JSON strings", () => {
    const result = encodeBase64('{"userId":"123","name":"John"}');
    expect(result.ok && result.value).toBe("eyJ1c2VySWQiOiIxMjMiLCJuYW1lIjoiSm9obiJ9");
  });

  it("handles Unicode characters and emoji without mangling", () => {
    const result = encodeBase64("héllo 👋 日本語");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const decoded = decodeBase64(result.value);
      expect(decoded.ok && decoded.value).toBe("héllo 👋 日本語");
    }
  });

  it("encodes an empty string to an empty value", () => {
    const result = encodeBase64("");
    expect(result.ok && result.value).toBe("");
  });
});

describe("decodeBase64", () => {
  it("decodes plain text", () => {
    const result = decodeBase64("aGVsbG8gd29ybGQ=");
    expect(result.ok && result.value).toBe("hello world");
  });

  it("decodes padded and unpadded Base64", () => {
    const padded = decodeBase64("aGVsbG8gd29ybGQ=");
    const unpadded = decodeBase64("aGVsbG8gd29ybGQ");
    expect(padded.ok && padded.value).toBe("hello world");
    expect(unpadded.ok && unpadded.value).toBe("hello world");
  });

  it("ignores whitespace and newlines", () => {
    const result = decodeBase64("aGVsbG8g d29y\nbGQ=");
    expect(result.ok && result.value).toBe("hello world");
  });

  it("decodes JSON payloads", () => {
    const result = decodeBase64("eyJ1c2VySWQiOiIxMjMiLCJuYW1lIjoiSm9obiJ9");
    expect(result.ok && result.value).toBe('{"userId":"123","name":"John"}');
  });

  it("rejects empty input", () => {
    const result = decodeBase64("   ");
    expect(result.ok).toBe(false);
  });

  it("rejects characters outside the Base64 alphabet", () => {
    const result = decodeBase64("not valid base64!");
    expect(result.ok).toBe(false);
  });

  it("rejects excessive padding", () => {
    const result = decodeBase64("YWJj===");
    expect(result.ok).toBe(false);
  });

  it("rejects a remainder of 1 which can never be valid", () => {
    const result = decodeBase64("aGVsbG8g");
    // 8 chars → remainder 0, decodes "hello " — valid
    expect(result.ok).toBe(true);
    const impossible = decodeBase64("a"); // length 1 → remainder 1
    expect(impossible.ok).toBe(false);
  });

  it("rejects bytes that are not valid UTF-8", () => {
    const result = decodeBase64("//4=");
    expect(result.ok).toBe(false);
  });
});