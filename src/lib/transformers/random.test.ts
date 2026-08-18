import { describe, expect, it } from "vitest";
import { randomCsvGenerator, randomJsonGenerator, randomNamePicker, randomRegexGenerator, randomXmlGenerator, randomBitmapGenerator, shuffleLines } from "@/lib/transformers/randomTextData";
import {
  randomDecimalGenerator,
  randomFractionGenerator,
  randomIntegerGenerator,
  randomIntegerRangeGenerator,
  randomNumberGenerator,
  randomPrimeGenerator,
} from "@/lib/transformers/randomNumbers";
import {
  randomBinaryGenerator,
  randomByteGenerator,
  randomHexGenerator,
  randomIp,
  randomMacGenerator,
  randomTimeGenerator,
  randomUuidGenerator,
} from "@/lib/transformers/randomValues";
import { parseRegex } from "@/lib/random/regex";
import { isPrime } from "@/lib/random/random";

describe("random IP/time/uuid/mac/hex", () => {
  it("generates the requested number of IP addresses", () => {
    const result = randomIp("5");
    expect(result.success).toBe(true);
    const ips = result.output.split("\n");
    expect(ips).toHaveLength(5);
    ips.forEach((ip) => expect(ip).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/));
  });

  it("falls back to a default count", () => {
    const result = randomIp("");
    expect(result.success).toBe(true);
    expect(result.output.split("\n")).toHaveLength(5);
  });

  it("generates times in HH:MM:SS shape", () => {
    const result = randomTimeGenerator("5");
    expect(result.output.split("\n")).toHaveLength(5);
    expect(result.output).toMatch(/^\d{2}:\d{2}:\d{2}(?:\n\d{2}:\d{2}:\d{2})*$/);
  });

  it("generates well-shaped UUIDs", () => {
    const result = randomUuidGenerator("3");
    const uuids = result.output.split("\n");
    expect(uuids).toHaveLength(3);
    uuids.forEach((uuid) => expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/));
  });

  it("generates MAC addresses", () => {
    const result = randomMacGenerator("2");
    expect(result.output).toMatch(/^[0-9a-f]{2}(?::[0-9a-f]{2}){5}$/m);
  });

  it("generates hex strings", () => {
    const result = randomHexGenerator("3");
    expect(result.output.split("\n")).toHaveLength(3);
    expect(result.output).toMatch(/^[0-9a-f]{32}(?:\n[0-9a-f]{32})*$/);
  });
});

describe("random numbers", () => {
  it("generates the requested count of numeric lines", () => {
    const result = randomNumberGenerator("5");
    expect(result.success).toBe(true);
    expect(result.output.split("\n")).toHaveLength(5);
  });

  it("respects a min/max range", () => {
    const result = randomNumberGenerator("10 20");
    const values = result.output.split("\n").map((n) => Number(n));
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(2000);
    });
  });

  it("generates integers", () => {
    const result = randomIntegerGenerator("5");
    expect(result.output.split("\n")).toHaveLength(5);
    expect(result.output).toMatch(/^\d+(?:\n\d+)*$/);
  });

  it("generates integers in a given range", () => {
    const result = randomIntegerRangeGenerator("1 5");
    const values = result.output.split("\n").map((n) => Number(n));
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it("generates decimals with fractional parts", () => {
    const result = randomDecimalGenerator("5");
    expect(result.output.split("\n")).toHaveLength(5);
    expect(result.output).toMatch(/^\d+(\.\d+)?(?:\n\d+(\.\d+)?)*$/);
  });

  it("generates fractions in a/b shape", () => {
    const result = randomFractionGenerator("4");
    expect(result.output).toMatch(/^\d+\/\d+(?:\n\d+\/\d+)*$/);
  });

  it("generates primes only", () => {
    const result = randomPrimeGenerator("10");
    const primes = result.output.split("\n").map((n) => Number(n));
    primes.forEach((n) => expect(isPrime(n)).toBe(true));
  });

  it("generates binary strings", () => {
    const result = randomBinaryGenerator("3");
    expect(result.output).toMatch(/^[01]{8}(?:\n[01]{8})*$/);
  });

  it("generates byte values in 0-255", () => {
    const result = randomByteGenerator("3");
    const bytes = result.output.split("\n").map((n) => Number(n));
    bytes.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(255);
    });
  });
});

describe("random strings and data structures", () => {
  it("generates CSV lines", () => {
    const result = randomCsvGenerator("3x3");
    expect(result.success).toBe(true);
    const lines = result.output.split("\n");
    expect(lines).toHaveLength(3);
    lines.forEach((line) => expect(line.split(",")).toHaveLength(3));
  });

  it("generates parseable random JSON", () => {
    const result = randomJsonGenerator("2");
    expect(result.success).toBe(true);
    expect(result.detectedType).toBe("JSON");
    const value = JSON.parse(result.output);
    expect(value).toHaveLength(2);
  });

  it("generates XML with a root", () => {
    const result = randomXmlGenerator("3");
    expect(result.success).toBe(true);
    expect(result.output).toContain("<root>");
    expect(result.output).toContain("</root>");
    expect(result.output).toContain("<item");
  });

  it("generates a bitmap grid", () => {
    const result = randomBitmapGenerator("6x6");
    expect(result.success).toBe(true);
    const lines = result.output.split("\n");
    expect(lines).toHaveLength(6);
    lines.forEach((line) => expect(line).toMatch(/^[01]{6}$/));
  });

  it("picks a name from a list", () => {
    const result = randomNamePicker("Ada,Bob,Cy");
    expect(result.success).toBe(true);
    expect(["Ada", "Bob", "Cy"]).toContain(result.output);
  });

  it("fails to pick from an empty list", () => {
    expect(randomNamePicker(" ").success).toBe(false);
  });

  it("shuffles lines (same set, same length)", () => {
    const result = shuffleLines("a\nb\nc\nd");
    expect(result.success).toBe(true);
    expect(result.output.split("\n")).toHaveLength(4);
    const sorted = result.output.split("\n").sort().join("\n");
    expect(sorted).toBe("a\nb\nc\nd");
  });

  it("fails to shuffle empty text", () => {
    expect(shuffleLines(" ").success).toBe(false);
  });
});

describe("random regex", () => {
  it("generates data matching a simple pattern", () => {
    const result = randomRegexGenerator("[a-z]{4}-\\d{2}");
    expect(result.success).toBe(true);
    expect(result.output.split("\n")).toHaveLength(4);
    result.output.split("\n").forEach((line) => expect(line).toMatch(/^[a-z]{4}-\d{2}$/));
  });

  it("handles alternation and quantifiers", () => {
    const result = randomRegexGenerator("(red|blue|green)\\d+");
    expect(result.success).toBe(true);
    result.output.split("\n").forEach((line) => expect(line).toMatch(/^(red|blue|green)\d+$/));
  });

  it("fails on empty input", () => {
    expect(randomRegexGenerator("").success).toBe(false);
  });

  it("fails on unbalanced groups", () => {
    const result = randomRegexGenerator("([a-z]{2}");
    expect(result.success).toBe(false);
  });
});

describe("parseRegex", () => {
  it("parses and generates from character classes", () => {
    const token = parseRegex("[0-9]{3}");
    expect(token.kind).toBe("repeat");
  });

  it("parses alternation into branches", () => {
    const token = parseRegex("(a|b)");
    expect(token.kind).toBe("alternation");
  });
});