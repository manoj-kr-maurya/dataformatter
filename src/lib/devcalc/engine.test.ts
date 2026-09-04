import { describe, expect, it } from "vitest";
import {
  radixOf,
  bytesOf,
  percentBetween,
  crc32,
  humanBytes,
  evaluateExpression,
} from "@/lib/devcalc/engine";

describe("radixOf", () => {
  it("renders common bases", () => {
    const result = radixOf(255);
    expect(result.hex).toBe("0xff");
    expect(result.binary).toBe("0b11111111");
    expect(result.octal).toBe("0o377");
  });

  it("pads to a signed width", () => {
    const result = radixOf(255, "16");
    expect(result.hex).toBe("0x00ff");
    expect(result.binary).toBe("0b0000000011111111");
  });

  it("rejects negatives / non-integers", () => {
    expect(() => radixOf(-1)).toThrow();
    expect(() => radixOf(1.5)).toThrow();
  });
});

describe("bytesOf", () => {
  it("counts utf-8 bytes and hex/base64", () => {
    const result = bytesOf("hi");
    expect(result.bytes).toBe(2);
    expect(result.hex).toBe("6869");
    expect(result.base64).toBe("aGk=");
  });

  it("counts multibyte characters", () => {
    expect(bytesOf("é").bytes).toBe(2);
    expect(bytesOf("😀").bytes).toBe(4);
  });
});

describe("misc helpers", () => {
  it("computes percent and guards division by zero", () => {
    expect(percentBetween(50, 200)).toBe(25);
    expect(percentBetween(1, 0)).toBeNull();
  });

  it("computes known crc32 vectors", () => {
    expect(crc32("a")).toBe(0xe8b7be43);
    expect(crc32("123456789")).toBe(0xcbf43926);
  });

  it("formats byte counts", () => {
    expect(humanBytes(512)).toBe("512 B");
    expect(humanBytes(1024)).toBe("1 KB");
  });
});

describe("evaluateExpression", () => {
  it("respects precedence and parens", () => {
    expect(evaluateExpression("2 + 3 * 4")).toBe(14);
    expect(evaluateExpression("(2 + 3) * 4")).toBe(20);
  });

  it("handles unary minus and exponent right-associativity", () => {
    expect(evaluateExpression("-2 + 5")).toBe(3);
    expect(evaluateExpression("2^3^2")).toBe(512);
    expect(evaluateExpression("2 * -3")).toBe(-6);
  });

  it("supports hex/binary literals and modulo", () => {
    expect(evaluateExpression("0x10 + 10")).toBe(26);
    expect(evaluateExpression("0b101 * 2")).toBe(10);
    expect(evaluateExpression("7 % 3")).toBe(1);
  });

  it("throws on malformed input", () => {
    expect(() => evaluateExpression("2 +")).toThrow();
    expect(() => evaluateExpression("(2")).toThrow();
    expect(() => evaluateExpression("1 / 0")).toThrow();
  });
});