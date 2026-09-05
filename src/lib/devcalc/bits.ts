/**
 * Integer / bitwise toolkit — BigInt-backed so 64-bit values never lose
 * precision. Covers integer literal parsing, integer types (Int8..UInt64),
 * two's complement, and a small bitwise expression evaluator (no eval).
 */

export type SignedWidth = 8 | 16 | 32 | 64;

/** Parse an integer literal: decimal, 0x hex, 0b binary or 0o octal. */
export function parseIntegerLiteral(text: string): bigint {
  const t = (text ?? "").trim().replace(/_/g, "").toLowerCase();
  if (!t) throw new Error("Enter an integer.");
  const match = t.match(/^([+-]?)(0x[0-9a-f]+|0b[01]+|0o[0-7]+|\d+)$/);
  if (!match) throw new Error("Enter an integer (decimal, 0x, 0b or 0o).");
  const sign = match[1] === "-" ? -1n : 1n;
  const raw = match[2];
  let digits = raw;
  let base = 10;
  if (digits.startsWith("0x")) { base = 16; digits = digits.slice(2); }
  else if (digits.startsWith("0b")) { base = 2; digits = digits.slice(2); }
  else if (digits.startsWith("0o")) { base = 8; digits = digits.slice(2); }
  let value = 0n;
  for (const ch of digits) {
    const d = parseInt(ch, base);
    if (Number.isNaN(d)) throw new Error(`Invalid digit "${ch}".`);
    value = value * BigInt(base) + BigInt(d);
  }
  return sign * value;
}

/** Interpret a `width`-bit pattern as a two's-complement signed value. */
export function interpretSigned(bits: bigint, width: number): bigint {
  const mask = (1n << BigInt(width)) - 1n;
  const wrapped = bits & mask;
  const signBit = 1n << BigInt(width - 1);
  return wrapped & signBit ? wrapped - (1n << BigInt(width)) : wrapped;
}

export interface IntegerType {
  label: string;
  sign: "signed" | "unsigned";
  bits: number;
  bytes: number;
  min: bigint;
  max: bigint;
}

export const INTEGER_TYPES: Record<
  "Int8" | "UInt8" | "Int16" | "UInt16" | "Int32" | "UInt32" | "Int64" | "UInt64",
  IntegerType
> = {
  Int8: { label: "Int8", sign: "signed", bits: 8, bytes: 1, min: -128n, max: 127n },
  UInt8: { label: "UInt8", sign: "unsigned", bits: 8, bytes: 1, min: 0n, max: 255n },
  Int16: { label: "Int16", sign: "signed", bits: 16, bytes: 2, min: -32768n, max: 32767n },
  UInt16: { label: "UInt16", sign: "unsigned", bits: 16, bytes: 2, min: 0n, max: 65535n },
  Int32: { label: "Int32", sign: "signed", bits: 32, bytes: 4, min: -2147483648n, max: 2147483647n },
  UInt32: { label: "UInt32", sign: "unsigned", bits: 32, bytes: 4, min: 0n, max: 4294967295n },
  Int64: { label: "Int64", sign: "signed", bits: 64, bytes: 8, min: -(1n << 63n), max: (1n << 63n) - 1n },
  UInt64: { label: "UInt64", sign: "unsigned", bits: 64, bytes: 8, min: 0n, max: (1n << 64n) - 1n },
};

export interface TwosComplementResult {
  bits: string;
  hex: string;
  unsigned: bigint;
  signed: bigint;
  width: SignedWidth;
  overflowSigned: boolean;
  overflowUnsigned: boolean;
}

/** Canonical two's-complement representation of a value at a bit width. */
export function toTwosComplement(value: bigint, width: SignedWidth): TwosComplementResult {
  const mask = (1n << BigInt(width)) - 1n;
  const wrapped = value & mask;
  const hexDigits = Math.ceil(width / 4);
  const bits = wrapped.toString(2).padStart(width, "0").slice(-width);
  const hex = wrapped.toString(16).padStart(hexDigits, "0").slice(-hexDigits).toUpperCase();
  const signedMin = -(1n << BigInt(width - 1));
  const signedMax = (1n << BigInt(width - 1)) - 1n;
  return {
    bits,
    hex,
    unsigned: wrapped,
    signed: interpretSigned(wrapped, width),
    width,
    overflowSigned: value < signedMin || value > signedMax,
    overflowUnsigned: value < 0n || value > mask,
  };
}

/** The truncation a `width`-bit machine produces for an arbitrary value. */
export function bitwiseBreakdown(value: bigint, width: SignedWidth): {
  decimal: string;
  hex: string;
  binary: string;
  signed: bigint;
  unsigned: bigint;
  width: SignedWidth;
  overflow: boolean;
} {
  const mask = (1n << BigInt(width)) - 1n;
  const unsigned = value & mask;
  const signed = interpretSigned(unsigned, width);
  const hexDigits = Math.ceil(width / 4);
  return {
    decimal: unsigned.toString(),
    hex: `0x${unsigned.toString(16).padStart(hexDigits, "0").slice(-hexDigits).toUpperCase()}`,
    binary: unsigned.toString(2).padStart(width, "0").slice(-width),
    signed,
    unsigned,
    width,
    overflow: value > mask || value < -(1n << BigInt(width - 1)),
  };
}

type BitToken = { isNum: true; digits: string } | { isNum: false; op: string };

const BIT_PREC: Record<string, number> = { "<<": 6, ">>": 6, ">>>": 6, "&": 5, "^": 4, "|": 3 };

/** Evaluate a bitwise expression over BigInt operators (& | ^ ~ << >> >>>). */
export function evaluateBitwise(expr: string, width: SignedWidth): bigint {
  const text = expr.replace(/\s+/g, "");
  if (!text) throw new Error("Enter a bitwise expression.");
  const tokens: BitToken[] = [];
  for (let i = 0; i < text.length; ) {
    const ch = text[i];
    if (/[0-9A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < text.length && /[0-9A-Za-z_]/.test(text[j])) j++;
      const raw = text.slice(i, j);
      i = j;
      tokens.push({ isNum: true, digits: raw });
      continue;
    }
    const two = text.slice(i, i + 3);
    if (two === ">>>") { tokens.push({ isNum: false, op: ">>>" }); i += 3; continue; }
    const twoOp = text.slice(i, i + 2);
    if (twoOp === "<<" || twoOp === ">>") { tokens.push({ isNum: false, op: twoOp }); i += 2; continue; }
    if (ch === "&" || ch === "|" || ch === "^" || ch === "~" || ch === "<" || ch === ">") {
      tokens.push({ isNum: false, op: ch });
      i++;
      continue;
    }
    if (ch === "(") { tokens.push({ isNum: false, op: "(" }); i++; continue; }
    if (ch === ")") { tokens.push({ isNum: false, op: ")" }); i++; continue; }
    throw new Error(`Unsupported character "${ch}".`);
  }

  const mask = (1n << BigInt(width)) - 1n;
  let pos = 0;

  const parsePrimary = (): bigint => {
    const token = tokens[pos];
    if (!token) throw new Error("Unexpected end of bitwise expression.");
    if (token.isNum) {
      pos++;
      return parseIntegerLiteral(token.digits) & mask;
    }
    if (token.op === "(") {
      pos++;
      const value = parseExpr(0);
      const close = tokens[pos];
      if (!close || close.isNum || close.op !== ")") throw new Error("Missing closing paren.");
      pos++;
      return value & mask;
    }
    if (token.op === "~") {
      pos++;
      return (~parsePrimary()) & mask;
    }
    throw new Error("Expected a number.");
  };

  function parseExpr(minPrec: number): bigint {
    let left = parsePrimary();
    for (;;) {
      const token = tokens[pos];
      if (!token || token.isNum) break;
      const op = token.op;
      if (op === ")" || op === "(") break;
      const prec = BIT_PREC[op];
      if (prec === undefined) break;
      if (prec < minPrec) break;
      pos++;
      const right = parseExpr(prec + 1);
      if (op === "<<") left = (left << right) & mask;
      else if (op === ">>") left = (left >> right) & mask;
      else if (op === ">>>") left = ((left & mask) >> right) & mask;
      else if (op === "&") left = (left & right) & mask;
      else if (op === "^") left = (left ^ right) & mask;
      else if (op === "|") left = (left | right) & mask;
      else throw new Error(`Unsupported operator "${op}".`);
    }
    return left;
  }

  const result = parseExpr(0);
  if (pos !== tokens.length) throw new Error("Trailing input after bitwise expression.");
  return result & mask;
}

/** Labels of every integer type `value` fits into, smallest first. */
export function fittingTypes(value: bigint): string[] {
  return Object.values(INTEGER_TYPES)
    .filter((t) => value >= t.min && value <= t.max)
    .sort((a, b) => a.bits - b.bits || (a.sign === b.sign ? 0 : a.sign === "unsigned" ? 1 : -1))
    .map((t) => t.label);
}

/** Explain what `raw` actually becomes when stored as `type` (wrap-around). */
export function wrapMessage(raw: bigint, type: IntegerType): string {
  const mask = (1n << BigInt(type.bits)) - 1n;
  const wrapped = type.sign === "signed" ? interpretSigned(raw & mask, type.bits) : raw & mask;
  return `${raw} does not fit ${type.label} (range ${type.min}…${type.max}); it wraps to ${wrapped}.`;
}

interface BitTowerCell {
  binary: string;
  hex: string;
  decimal: string;
}

export interface BitTower {
  op: string;
  left: BitTowerCell;
  right: BitTowerCell;
  result: BitTowerCell;
}

/**
 * Split an expression at its top-level (lowest-precedence) bitwise operator so
 * a bitwise visual can show both operands and the result stacked in binary.
 * Returns null for single operands, unary expressions or unparseable input.
 */
export function topLevelBinarySplit(expr: string): { op: string; left: string; right: string } | null {
  const text = expr.replace(/\s+/g, "");
  let depth = 0;
  let best: { op: string; at: number; len: number; prec: number } | null = null;
  for (let i = 0; i < text.length; ) {
    const ch = text[i];
    if (ch === "(") { depth++; i++; continue; }
    if (ch === ")") { depth--; i++; continue; }
    if (depth === 0 && (ch === "0" || /[1-9A-Za-z_]/.test(ch))) {
      let j = i;
      while (j < text.length && /[0-9A-Za-z_]/.test(text[j])) j++;
      i = j;
      continue;
    }
    let op: string | null = null;
    let len = 0;
    if (text[i + 2] === ">" && text[i] === ">" && text[i + 1] === ">") { op = ">>>"; len = 3; }
    else if (text[i + 1] === "<" && text[i] === "<") { op = "<<"; len = 2; }
    else if (text[i + 1] === ">" && text[i] === ">") { op = ">>"; len = 2; }
    else if (ch === "&" || ch === "|" || ch === "^") { op = ch; len = 1; }
    if (op) {
      if (depth === 0) {
        const prec = BIT_PREC[op] ?? 0;
        if (!best || prec < best.prec) best = { op, at: i, len, prec };
      }
      i += len;
      continue;
    }
    i++;
  }
  if (!best) return null;
  const left = text.slice(0, best.at);
  const right = text.slice(best.at + best.len);
  if (!left || !right) return null;
  return { op: best.op, left, right };
}

/** Breakdown both operands and the result for the bitwise visual. */
export function bitwiseTower(expr: string, width: SignedWidth): BitTower | null {
  const split = topLevelBinarySplit(expr);
  if (!split) return null;
  const left = bitwiseBreakdown(evaluateBitwise(split.left, width), width);
  const right = bitwiseBreakdown(evaluateBitwise(split.right, width), width);
  const result = bitwiseBreakdown(evaluateBitwise(expr, width), width);
  return {
    op: split.op,
    left: { binary: left.binary, hex: left.hex, decimal: left.decimal },
    right: { binary: right.binary, hex: right.hex, decimal: right.decimal },
    result: { binary: result.binary, hex: result.hex, decimal: result.decimal },
  };
}