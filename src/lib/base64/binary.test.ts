import { describe, expect, it } from "vitest";
import {
  base64ToBytes,
  binaryStringToBytes,
  bytesToBase64,
  bytesToBinaryString,
  bytesToHex,
  hexToBytes,
  imagePayload,
  octalToBytes,
  sniffImageType,
  splitImageDataUri,
} from "@/lib/base64/binary";

describe("base64ToBytes / bytesToBase64", () => {
  it("round-trips ASCII", () => {
    const result = base64ToBytes("aGVsbG8gd29ybGQ=");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(bytesToBase64(result.bytes)).toBe("aGVsbG8gd29ybGQ=");
  });

  it("recovers unpadded Base64", () => {
    expect(base64ToBytes("aGVsbG8gd29ybGQ").ok).toBe(true);
  });

  it("rejects characters outside the alphabet", () => {
    expect(base64ToBytes("not base64!!!").ok).toBe(false);
  });

  it("rejects a remainder of 1", () => {
    expect(base64ToBytes("a").ok).toBe(false);
  });

  it("handles empty input", () => {
    expect(base64ToBytes("   ").ok).toBe(false);
  });
});

describe("hexToBytes / bytesToHex", () => {
  it("round-trips", () => {
    const result = hexToBytes("48656c6c6f");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(bytesToHex(result.bytes)).toBe("48656c6c6f");
  });

  it("accepts spaces between bytes", () => {
    expect(hexToBytes("48 69 20 21").ok).toBe(true);
  });

  it("rejects odd-length hex", () => {
    expect(hexToBytes("abc").ok).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(hexToBytes("zz").ok).toBe(false);
  });
});

describe("binaryStringToBytes / bytesToBinaryString", () => {
  it("round-trips", () => {
    const result = binaryStringToBytes("0100100001101001");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(bytesToBinaryString(result.bytes)).toBe("0100100001101001");
  });

  it("rejects bits not aligned to bytes", () => {
    expect(binaryStringToBytes("0101").ok).toBe(false);
  });

  it("rejects non-binary characters", () => {
    expect(binaryStringToBytes("01012").ok).toBe(false);
  });
});

describe("octalToBytes", () => {
  it("parses octal bytes", () => {
    const result = octalToBytes("110 150");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(bytesToHex(result.bytes)).toBe("4868");
  });

  it("rejects values above 377", () => {
    expect(octalToBytes("400").ok).toBe(false);
  });

  it("rejects non-octal digits", () => {
    expect(octalToBytes("19").ok).toBe(false);
  });
});

describe("sniffImageType", () => {
  it("detects a real PNG header", () => {
    const result = base64ToBytes(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(sniffImageType(result.bytes)).toBe("png");
  });

  it("returns null for plain text bytes", () => {
    const result = base64ToBytes("aGVsbG8=");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(sniffImageType(result.bytes)).toBeNull();
  });
});

describe("splitImageDataUri / imagePayload", () => {
  it("splits a PNG data URI", () => {
    const parts = splitImageDataUri("data:image/png;base64,iVBORw0KGgo=");
    expect(parts).toEqual({ mime: "image/png", payload: "iVBORw0KGgo=" });
  });

  it("handles charset parameters", () => {
    const parts = splitImageDataUri("data:image/jpeg;charset=utf-8;base64,/9j/4AAQ");
    expect(parts && parts.mime).toBe("image/jpeg");
    expect(parts && parts.payload).toBe("/9j/4AAQ");
  });

  it("returns null for raw Base64", () => {
    expect(splitImageDataUri("aGVsbG8=")).toBeNull();
  });

  it("falls back to raw input", () => {
    expect(imagePayload("aGVsbG8=")).toBe("aGVsbG8=");
  });
});