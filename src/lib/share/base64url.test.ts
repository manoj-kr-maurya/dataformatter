import { describe, expect, it } from "vitest";
import { encodeBase64Url, decodeBase64Url } from "@/lib/share/base64url";

const enc = new TextEncoder();
const dec = new TextDecoder();

function roundTrip(text: string): string {
  const bytes = enc.encode(text);
  const encoded = encodeBase64Url(bytes);
  const back = dec.decode(decodeBase64Url(encoded));
  expect(back).toBe(text);
  return encoded;
}

describe("encodeBase64Url / decodeBase64Url", () => {
  it("round-trips empty input", () => {
    expect(encodeBase64Url(new Uint8Array(0))).toBe("");
    expect(decodeBase64Url("")).toEqual(new Uint8Array(0));
  });

  it("round-trips 1, 2, and 3 byte boundaries", () => {
    roundTrip("a");
    roundTrip("ab");
    roundTrip("abc");
    roundTrip("abcd");
  });

  it("emits only URL-safe characters (no +, /, =)", () => {
    const encoded = roundTrip("~!@#$%^&*()_+{}|:\"<>?`-=[]\\;',./");
    expect(encoded).not.toMatch(/[+/=]/);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("round-trips Unicode (emoji, CJK, mixed)", () => {
    roundTrip("héllo wörld");
    roundTrip("🎉 数据格式化 🚀");
    roundTrip("مرحبا بالعالم");
    roundTrip("क्या आप मुझे समझते हैं");
    roundTrip("\u0000\u0001\u007f\u0080\uffff");
  });

  it("round-trips multiline and large content", () => {
    const multiline = "line one\nline two\n\tline three\r\nline four\n\n";
    roundTrip(multiline);
    const big = "x".repeat(100_000);
    const encoded = roundTrip(big);
    expect(encoded.length).toBeGreaterThan(100_000);
  });

  it("produces the RFC 4648 example vectors", () => {
    // "M" -> "TQ", "Ma" -> "TWE", "Man" -> "TWFu"
    expect(encodeBase64Url(enc.encode("M"))).toBe("TQ");
    expect(encodeBase64Url(enc.encode("Ma"))).toBe("TWE");
    expect(encodeBase64Url(enc.encode("Man"))).toBe("TWFu");
  });

  it("decodes standard Base64 with +/ and = padding", () => {
    // Standard base64 of "hello" produced with + and = would be aGVsbG8=
    expect(dec.decode(decodeBase64Url("aGVsbG8="))).toBe("hello");
    expect(dec.decode(decodeBase64Url("aGVsbG8"))).toBe("hello");
  });

  it("rejects invalid characters", () => {
    expect(() => decodeBase64Url("not!valid")).toThrow();
    expect(() => decodeBase64Url("bad char".replace(" ", "!"))).toThrow();
  });

  it("rejects an invalid length (mod 4 === 1)", () => {
    expect(() => decodeBase64Url("abcde")).toThrow();
  });

  it("decodes standard base64url correctly for binary", () => {
    const bytes = new Uint8Array([0, 255, 128, 7, 99, 200]);
    const encoded = encodeBase64Url(bytes);
    expect(decodeBase64Url(encoded)).toEqual(bytes);
  });
});