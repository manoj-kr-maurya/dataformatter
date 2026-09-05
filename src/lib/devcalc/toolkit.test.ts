import { describe, expect, it } from "vitest";
import { evaluateExpression } from "@/lib/devcalc/engine";
import {
  parseIntegerLiteral,
  interpretSigned,
  INTEGER_TYPES,
  toTwosComplement,
  bitwiseBreakdown,
  evaluateBitwise,
  bitwiseTower,
  fittingTypes,
  wrapMessage,
} from "@/lib/devcalc/bits";
import { floatDetails, floatLayout } from "@/lib/devcalc/float";
import { sizeConversions } from "@/lib/devcalc/units";
import { cidrBreakdown } from "@/lib/devcalc/network";
import { textBreakdown, analyzeJson } from "@/lib/devcalc/textsize";
import { encodingBreakdown, encodingSizeComparison } from "@/lib/devcalc/encoding";
import { computeStats } from "@/lib/devcalc/stats";
import { computeConcurrency, computeBandwidth, computeApiTraffic, estimateStorage, estimateCache, estimateQueue, rpsPerUnit } from "@/lib/devcalc/estimators";
import { parseDurationString, breakdownDuration, formatDurationBreakdown } from "@/lib/devcalc/time";

describe("expression engine extensions", () => {
  it("supports ** power", () => {
    expect(evaluateExpression("2 ** 10")).toBe(1024);
    expect(evaluateExpression("2 ** 3 ** 2")).toBe(512);
    expect(evaluateExpression("3 * 2 ** 3")).toBe(24);
  });

  it("supports functions", () => {
    expect(evaluateExpression("sqrt(16)")).toBe(4);
    expect(evaluateExpression("abs(-3)")).toBe(3);
    expect(evaluateExpression("round(2.6)")).toBe(3);
    expect(evaluateExpression("floor(2.9)")).toBe(2);
    expect(evaluateExpression("ceil(2.1)")).toBe(3);
    expect(evaluateExpression("pow(2, 8)")).toBe(256);
    expect(evaluateExpression("min(2, 10, 7)")).toBe(2);
    expect(evaluateExpression("max(2, 10, 7)")).toBe(10);
    expect(evaluateExpression("round(log10(1000))")).toBe(3);
    expect(evaluateExpression("round(exp(1))")).toBe(3);
  });

  it("supports constants", () => {
    expect(evaluateExpression("round(PI * 10)")).toBe(31);
    expect(evaluateExpression("round(TAU * 10)")).toBe(63);
    expect(evaluateExpression("round(E * 10)")).toBe(27);
  });

  it("supports scientific notation", () => {
    expect(evaluateExpression("1.5e3 + 1")).toBe(1501);
    expect(evaluateExpression("1e-2 * 5")).toBe(0.05);
  });

  it("composes functions inside larger expressions", () => {
    expect(evaluateExpression("sqrt(9) * 2 + 1")).toBe(7);
    expect(evaluateExpression("max(1, 2) * min(6, 4)")).toBe(8);
    expect(evaluateExpression("(1024 * 1024) / 2")).toBe(524288);
  });

  it("rejects unknown functions and identifiers", () => {
    expect(() => evaluateExpression("evil(1)")).toThrow();
    expect(() => evaluateExpression("2 + foo")).toThrow();
    expect(() => evaluateExpression("min()")).toThrow();
  });

  it("supports shift and mask operators arithmetically", () => {
    expect(evaluateExpression("1 << 31")).toBe(2147483648);
    expect(evaluateExpression("2 ** 32")).toBe(4294967296);
    expect(evaluateExpression("8 >> 1")).toBe(4);
    expect(evaluateExpression("15 >>> 2")).toBe(3);
    expect(evaluateExpression("42 & 15")).toBe(10);
    expect(evaluateExpression("42 | 15")).toBe(47);
    expect(evaluateExpression("1 + 2 << 3")).toBe(24);
    expect(evaluateExpression("3 * (1 | 2) + 1")).toBe(10);
    expect(evaluateExpression("0xF0 & 0x3C")).toBe(48);
  });
});

describe("integer literals and types", () => {
  it("parses decimal / hex / binary / octal with signs and underscores", () => {
    expect(parseIntegerLiteral("255")).toBe(255n);
    expect(parseIntegerLiteral("0xFF")).toBe(255n);
    expect(parseIntegerLiteral("0b11111111")).toBe(255n);
    expect(parseIntegerLiteral("0o377")).toBe(255n);
    expect(parseIntegerLiteral("-0b1010")).toBe(-10n);
    expect(parseIntegerLiteral("1_000")).toBe(1000n);
    expect(parseIntegerLiteral("0xFFFFFFFFFFFFFFFF")).toBe(18446744073709551615n);
  });

  it("defines correct type ranges", () => {
    expect(INTEGER_TYPES.UInt8.max).toBe(255n);
    expect(INTEGER_TYPES.UInt8.min).toBe(0n);
    expect(INTEGER_TYPES.Int8.min).toBe(-128n);
    expect(INTEGER_TYPES.Int32.min).toBe(-2147483648n);
    expect(INTEGER_TYPES.UInt64.max).toBe(18446744073709551615n);
    expect(INTEGER_TYPES.Int64.bytes).toBe(8);
    expect(INTEGER_TYPES.UInt8.sign).toBe("unsigned");
  });

  it("interprets two's complement", () => {
    expect(interpretSigned(0n, 8)).toBe(0n);
    expect(interpretSigned(255n, 8)).toBe(-1n);
    expect(interpretSigned(255n, 32)).toBe(255n);
  });
});

describe("bitwise calculator", () => {
  it("evaluates the documented operators", () => {
    expect(evaluateBitwise("42 & 15", 32)).toBe(10n);
    expect(evaluateBitwise("42 | 15", 32)).toBe(47n);
    expect(evaluateBitwise("42 ^ 15", 32)).toBe(37n);
  });

  it("handles shifts and NOT", () => {
    expect(evaluateBitwise("1 << 4", 32)).toBe(16n);
    expect(evaluateBitwise("256 >> 4", 8)).toBe(0n);
    expect(evaluateBitwise("~0", 32)).toBe(4294967295n);
    expect(evaluateBitwise("~0", 8)).toBe(255n);
    expect(evaluateBitwise("0xF0 | 0x0F", 8)).toBe(255n);
    expect(evaluateBitwise("(1 << 3) | 0b101", 8)).toBe(13n);
  });

  it("masks to a signed width", () => {
    expect(bitwiseBreakdown(255n, 8).signed).toBe(-1n);
    expect(bitwiseBreakdown(255n, 8).binary).toBe("11111111");
    expect(bitwiseBreakdown(255n, 8).hex).toBe("0xFF");
  });

  it("throws on malformed input", () => {
    expect(() => evaluateBitwise("42 &", 32)).toThrow();
    expect(() => evaluateBitwise("(1 | 2", 32)).toThrow();
  });

  it("builds the operand/result binary tower for the visual", () => {
    const tower = bitwiseTower("42 & 15", 32);
    expect(tower).not.toBeNull();
    if (!tower) return;
    expect(tower.op).toBe("&");
    expect(tower.left.hex).toBe("0x0000002A");
    expect(tower.right.binary).toBe("00000000000000000000000000001111");
    expect(tower.result.binary).toBe("00000000000000000000000000001010");
  });

  it("splits at the lowest-precedence top-level operator", () => {
    const tower = bitwiseTower("(1 << 3) | 0b101", 8);
    expect(tower).not.toBeNull();
    if (!tower) return;
    expect(tower.op).toBe("|");
    expect(tower.left.binary).toBe("00001000");
    expect(tower.right.binary).toBe("00000101");
    expect(tower.result.decimal).toBe("13");
  });

  it("returns null for single operands", () => {
    expect(bitwiseTower("0xFF", 32)).toBeNull();
    expect(bitwiseTower("~0", 8)).toBeNull();
  });

  it("lists the types a value fits into", () => {
    expect(fittingTypes(255n)).toContain("UInt8");
    expect(fittingTypes(-128n)).toContain("Int8");
    expect(fittingTypes(255n)).not.toContain("Int8");
    expect(fittingTypes(2n ** 40n)).not.toContain("Int32");
    expect(fittingTypes(2n ** 40n)).toContain("Int64");
    expect(fittingTypes(2n ** 40n)).toContain("UInt64");
  });

  it("explains overflow with the wrapped value", () => {
    expect(wrapMessage(256n, INTEGER_TYPES.UInt8)).toContain("wraps to 0");
    expect(wrapMessage(-129n, INTEGER_TYPES.Int8)).toContain("wraps to 127");
    expect(wrapMessage(32768n, INTEGER_TYPES.Int16)).toContain("wraps to -32768");
    expect(wrapMessage(-32769n, INTEGER_TYPES.Int16)).toContain("wraps to 32767");
  });
});

describe("two's complement", () => {
  it("reproduces the documented -42 example at 8 bits", () => {
    const result = toTwosComplement(-42n, 8);
    expect(result.bits).toBe("11010110");
    expect(result.hex).toBe("D6");
    expect(result.signed).toBe(-42n);
    expect(result.overflowSigned).toBe(false);
  });

  it("flags overflow beyond a type", () => {
    expect(toTwosComplement(256n, 8).overflowUnsigned).toBe(true);
    expect(toTwosComplement(200n, 8).overflowSigned).toBe(true);
    expect(toTwosComplement(30000n, 16).overflowSigned).toBe(false);
  });
});

describe("IEEE-754 float representation", () => {
  it("lays out float32 3.14 correctly", () => {
    const d = floatDetails(3.14, 32);
    expect(d.sign).toBe(0);
    expect(d.exponentBits).toBe("10000000");
    expect(d.fractionBits).toBe("10010001111010111000011");
    expect(d.kind).toBe("normal");
    expect(d.exponentValue).toBe(1);
  });

  it("lays out float64 3.14 correctly", () => {
    const d = floatDetails(3.14, 64);
    expect(d.sign).toBe(0);
    expect(d.exponentBits).toBe("10000000000");
    expect(d.fractionBits).toBe("1001000111101011100001010001111010111000010100011111");
    expect(d.exponentValue).toBe(1);
  });

  it("handles special values", () => {
    expect(floatDetails(0, 32).kind).toBe("zero");
    expect(floatDetails(1 / 0, 32).kind).toBe("infinity");
    expect(floatDetails(NaN, 32).kind).toBe("nan");
    expect(floatDetails(Number.MIN_VALUE, 64).kind).toBe("subnormal");
  });

  it("formats the visual bit layout", () => {
    expect(floatLayout(1, 32).split(" | ").length).toBe(3);
  });
});

describe("data size units", () => {
  it("distinguishes 1 KiB = 1024 B from 1 KB = 1000 B", () => {
    const kimibyte = sizeConversions(1, "KiB").find((r) => r.unit === "B" && r.system === "binary");
    const kilobyte = sizeConversions(1, "KB").find((r) => r.unit === "B" && r.system === "decimal");
    expect(kimibyte?.value).toBe(1024);
    expect(kilobyte?.value).toBe(1000);
  });

  it("converts across units", () => {
    const gb = sizeConversions(1, "GiB").find((r) => r.unit === "MiB" && r.system === "binary");
    expect(gb?.value).toBe(1024);
    const tb = sizeConversions(5000, "MB").find((r) => r.unit === "GB" && r.system === "decimal");
    expect(tb?.value).toBe(5);
  });

  it("rejects junk input", () => {
    expect(() => sizeConversions(-1, "KB")).toThrow();
    expect(() => sizeConversions(1, "XYZ")).toThrow();
  });
});

describe("ipv4 cidr", () => {
  it("solves the /24 documented example", () => {
    const cidr = cidrBreakdown("192.168.1.0/24");
    expect(cidr.network).toBe("192.168.1.0");
    expect(cidr.broadcast).toBe("192.168.1.255");
    expect(cidr.usableAddresses).toBe(254);
    expect(cidr.firstUsable).toBe("192.168.1.1");
    expect(cidr.lastUsable).toBe("192.168.1.254");
    expect(cidr.subnetMask).toBe("255.255.255.0");
    expect(cidr.wildcardMask).toBe("0.0.0.255");
    expect(cidr.totalAddresses).toBe(256);
  });

  it("handles /32 and /31 point-to-point", () => {
    expect(cidrBreakdown("10.0.0.5/32").usableAddresses).toBe(1);
    expect(cidrBreakdown("10.0.0.1/31").usableAddresses).toBe(2);
  });

  it("rejects bad input", () => {
    expect(() => cidrBreakdown("999.0.0.1/24")).toThrow();
    expect(() => cidrBreakdown("10.0.0.1/33")).toThrow();
    expect(() => cidrBreakdown("10.0.0.1/foo")).toThrow();
  });
});

describe("text and JSON size", () => {
  it("counts graphemes, code points, bytes independently", () => {
    expect(textBreakdown("Hello 👋").characters).toBe(7);
    expect(textBreakdown("Hello 👋").codePoints).toBe(7);
    expect(textBreakdown("Hello 👋").utf8Bytes).toBe(10);
    expect(textBreakdown("Hello 👋").utf16Units).toBe(8);
    expect(textBreakdown("Hello 👋").words).toBe(2);
    expect(textBreakdown("e\u0301").characters).toBe(1);
    expect(textBreakdown("e\u0301").codePoints).toBe(2);
    expect(textBreakdown("€").utf8Bytes).toBe(3);
    expect(textBreakdown("€").codePoints).toBe(1);
    expect(textBreakdown("😀").utf8Bytes).toBe(4);
  });

  it("analyzes valid JSON including unicode and emoji", () => {
    const result = analyzeJson('{"a":1,"b":[true,null],"c":{"d":"€😀"},"nested":{"deep":{"x":[1,2,3]}}}');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.minifiedBytes).toBeLessThan(result.prettyBytes);
      expect(result.savingsBytes).toBe(result.prettyBytes - result.minifiedBytes);
      expect(result.pretty).toContain('"b"');
    }
  });

  it("flags invalid JSON with a friendly message", () => {
    const result = analyzeJson('{"a":}');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("Invalid JSON");
  });

  it("handles empty JSON", () => {
    const result = analyzeJson("{}");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.minifiedBytes).toBe(2);
  });
});

describe("encoding sizes", () => {
  it("reproduces the documented Hello example", () => {
    const e = encodingBreakdown("Hello");
    expect(e.utf8Bytes).toBe(5);
    expect(e.asciiBytes).toBe(5);
    expect(e.base64).toBe("SGVsbG8=");
    expect(e.base64Bytes).toBe(8);
    expect(e.hexChars).toBe(10);
  });

  it("does not confuse characters with bytes", () => {
    const e = encodingBreakdown("€");
    expect(e.utf8Bytes).toBe(3);
    expect(e.utf16Units).toBe(1);
    expect(e.asciiBytes).toBeNull();
    const emoji = encodingBreakdown("😀");
    expect(emoji.utf8Bytes).toBe(4);
  });
});

describe("statistics", () => {
  it("computes the 10..50 sample", () => {
    const s = computeStats("10\n20\n30\n40\n50");
    expect(s).not.toBeNull();
    if (!s) return;
    expect(s.count).toBe(5);
    expect(s.sum).toBe(150);
    expect(s.mean).toBe(30);
    expect(s.median).toBe(30);
    expect(s.min).toBe(10);
    expect(s.max).toBe(50);
    expect(s.range).toBe(40);
    expect(s.p90).toBe(46);
    expect(s.p95).toBe(48);
  });

  it("accepts commas and junk is skipped", () => {
    const s = computeStats("1,2,2,3, NaN, 4");
    expect(s?.count).toBe(5);
    expect(s?.mode).toEqual([2]);
  });

  it("returns null on empty input", () => {
    expect(computeStats("  ,  \n ")).toBeNull();
  });
});

describe("estimators", () => {
  it("computes the documented concurrency example", () => {
    expect(computeConcurrency(2000, 150)).toBe(300);
  });

  it("computes the documented bandwidth example", () => {
    const b = computeBandwidth(5000, 0, 20480);
    expect(b.bytesPerSec).toBe(102400000);
    expect(b.mbPerSec).toBeCloseTo(102.4, 5);
  });

  it("estimates database storage transparently", () => {
    const s = estimateStorage({ records: 10000000, recordBytes: 2048, dailyGrowthRecords: 0, retentionDays: 0, replication: 1, overheadPct: 0 });
    expect(s.rawBytes).toBe(20480000000);
    expect(s.rawLabel).toBe("19.07 GB");
  });

  it("sanity-checks cache and queue estimates", () => {
    const c = estimateCache({ keys: 100000, keyBytes: 32, valueBytes: 512, overheadPct: 50, replication: 2, headroomPct: 20 });
    expect(c.recommendedBytes).toBeGreaterThan(c.rawSizeBytes);
    const q = estimateQueue({ eventsPerSec: 1000, eventBytes: 2048, retentionDays: 7, replication: 3 });
    expect(q.eventsPerDay).toBe(86400000);
    expect(q.retainedBytes).toBeGreaterThan(q.rawPerDayBytes);
  });

  it("computes per-month request counts (30-day month)", () => {
    expect(rpsPerUnit(100).perMonth).toBe(100 * 30 * 86400);
    expect(rpsPerUnit(2000).perMonth).toBe(2000 * 30 * 86400);
  });

  it("estimates daily API traffic correctly", () => {
    const t = computeApiTraffic(1_000_000, 1000, 20000);
    expect(t.requestsPerDay).toBe(1_000_000);
    expect(t.requestsPerSec).toBeCloseTo(11.574, 2);
    expect(t.gbPerDay).toBeCloseTo(21, 0);
    expect(t.tbPerMonth).toBeCloseTo(0.63, 2);
  });
});

describe("encoding size comparison", () => {
  it("shows UTF-8 as baseline with zero percent", () => {
    const rows = encodingSizeComparison("Hello");
    expect(rows.length).toBeGreaterThan(1);
    const utf8 = rows.find((r) => r.label === "UTF-8");
    expect(utf8).toBeDefined();
    expect(utf8!.size).toBe(5);
    expect(utf8!.pct).toBe(0);
  });

  it("marks Base64 as +60% for ASCII and lists encodings in ascending size", () => {
    const rows = encodingSizeComparison("Hello");
    const base64 = rows.find((r) => r.label === "Base64");
    expect(base64?.size).toBe(8);
    expect(base64?.pct).toBeCloseTo(60, 1);
    expect(rows[0].label).toBe("UTF-8");
  });

  it("can produce negative percentages when another encoding is smaller", () => {
    const rows = encodingSizeComparison("€");
    const utf16 = rows.find((r) => r.label === "UTF-16 (LE)");
    expect(utf16?.size).toBe(2);
    expect(utf16?.pct).toBeLessThan(0);
  });
});

describe("duration toolkit", () => {
  it("parses compound human durations", () => {
    expect(parseDurationString("2h 35m 20s")).toBe(2 * 3600000 + 35 * 60000 + 20 * 1000);
    expect(parseDurationString("1w 2d")).toBe(604800000 + 172800000);
    expect(parseDurationString("500ms")).toBe(500);
    expect(parseDurationString("1.5h")).toBe(5400000);
    expect(parseDurationString("45 s")).toBe(45000);
    expect(parseDurationString("10d3h")).toBe(10 * 86400000 + 3 * 3600000);
  });

  it("rejects invalid input", () => {
    expect(() => parseDurationString("hello")).toThrow();
    expect(() => parseDurationString("")).toThrow();
    expect(() => parseDurationString("10")).toThrow();
    expect(() => parseDurationString("10 x")).toThrow();
  });

  it("splits milliseconds into correct components", () => {
    const b = breakdownDuration(777600000);
    expect(b.weeks).toBe(1);
    expect(b.days).toBe(2);
    expect(b.hours).toBe(0);
    expect(b.minutes).toBe(0);
    expect(b.seconds).toBe(0);
    expect(b.milliseconds).toBe(0);
  });

  it("renders a compact human string", () => {
    expect(formatDurationBreakdown(9320000)).toBe("2h 35m 20s");
    expect(formatDurationBreakdown(0)).toBe("0ms");
    expect(formatDurationBreakdown(500)).toBe("500ms");
    expect(formatDurationBreakdown(777600000)).toBe("1w 2d");
  });
});