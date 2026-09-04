/**
 * Developer calculator engines — pure, dependency-free helpers used by the
 * workbench: radix conversion, byte-size/encoding, percent math, CRC32 and a
 * small operator-precedence arithmetic parser (no eval ever).
 */

export interface RadixResult {
  decimal: string;
  hex: string;
  binary: string;
  octal: string;
  char: string | null;
}

export function radixOf(input: number, signedWidth?: "8" | "16" | "32"): RadixResult {
  const value = Number(input);
  if (!Number.isFinite(value)) throw new Error("Must be a finite number.");
  if (value < 0 || !Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new Error("Radix mode only supports non-negative integers up to 2^53-1.");
  }
  let hex = value.toString(16);
  let binary = value.toString(2);
  if (signedWidth) {
    const width = Number(signedWidth);
    const mask = Math.pow(2, width) - 1;
    const bits = value & mask;
    hex = bits.toString(16).padStart(Math.ceil(width / 4), "0").slice(-Math.ceil(width / 4));
    binary = bits.toString(2).padStart(width, "0").slice(-width);
  }
  const char = value >= 32 && value <= 126 ? String.fromCharCode(value) : null;
  return {
    decimal: String(value),
    hex: "0x" + hex,
    binary: "0b" + binary,
    octal: "0o" + value.toString(8),
    char,
  };
}

export interface ByteDetails {
  bytes: number;
  hex: string;
  base64: string;
}

const utf8Encoder = new TextEncoder();

export function bytesOf(text: string, base64SafeInput?: boolean): ByteDetails {
  let byteArray: Uint8Array;
  if (base64SafeInput) {
    try {
      const binary = atob(text);
      byteArray = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    } catch {
      byteArray = utf8Encoder.encode(text);
    }
  } else {
    byteArray = utf8Encoder.encode(text);
  }
  let hex = "";
  for (const byte of byteArray) hex += byte.toString(16).padStart(2, "0");
  let base64 = "";
  if (byteArray.length > 32 * 1024) {
    base64 = "byte array too large to preview";
  } else {
    let binary = "";
    for (const byte of byteArray) binary += String.fromCharCode(byte);
    try {
      base64 = btoa(binary);
    } catch {
      base64 = "";
    }
  }
  return { bytes: byteArray.length, hex, base64 };
}

export function percentBetween(a: number, b: number): number | null {
  if (b === 0) return null;
  return (a / b) * 100;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(text: string): number {
  const bytes = utf8Encoder.encode(text);
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = "B";
  for (const next of units) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  return `${value >= 10 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1)} ${unit}`;
}

// ------------------------------------------------ Safe arithmetic parser

type Token =
  | { kind: "num"; value: number }
  | { kind: "op"; value: string }
  | { kind: "lparen" }
  | { kind: "rparen" };

const OPS: Record<string, { prec: number; right: boolean; fn: (a: number, b: number) => number }> = {
  "^": { prec: 3, right: true, fn: (a, b) => Math.pow(a, b) },
  "*": { prec: 2, right: false, fn: (a, b) => a * b },
  "/": { prec: 2, right: false, fn: (a, b) => a / b },
  "%": { prec: 2, right: false, fn: (a, b) => a % b },
  "+": { prec: 1, right: false, fn: (a, b) => a + b },
  "-": { prec: 1, right: false, fn: (a, b) => a - b },
};

export function tokenizeExpression(input: string): Token[] {
  const tokens: Token[] = [];
  const text = input.replace(/\s+/g, "");
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < text.length && /[0-9.aA-FfXxObB_]/.test(text[j])) j++;
      const raw = text.slice(i, j).replace(/_/g, "");
      let value: number;
      if (/^0x/i.test(raw)) value = parseInt(raw.slice(2), 16);
      else if (/^0b/i.test(raw)) value = parseInt(raw.slice(2), 2);
      else if (/^0o/i.test(raw)) value = parseInt(raw.slice(2), 8);
      else value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`Cannot read number "${raw}".`);
      tokens.push({ kind: "num", value });
      i = j;
      continue;
    }
    if (ch === "(") { tokens.push({ kind: "lparen" }); i++; continue; }
    if (ch === ")") { tokens.push({ kind: "rparen" }); i++; continue; }
    if (OPS[ch]) { tokens.push({ kind: "op", value: ch }); i++; continue; }
    throw new Error(`Unexpected character "${ch}".`);
  }
  return tokens;
}

export function evaluateExpression(input: string): number {
  const tokens = tokenizeExpression(input);
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];

  function parsePrimary(): number {
    const token = peek();
    if (!token) throw new Error("Unexpected end of expression.");
    if (token.kind === "num") {
      pos++;
      return token.value;
    }
    if (token.kind === "lparen") {
      pos++;
      const value = parseExpr(0);
      const close = peek();
      if (!close || close.kind !== "rparen") throw new Error("Missing closing paren.");
      pos++;
      return value;
    }
    throw new Error("Expected a number.");
  }

  function parseUnary(): number {
    const token = peek();
    if (token?.kind === "op" && (token.value === "-" || token.value === "+")) {
      pos++;
      const value = parseUnary();
      return token.value === "-" ? -value : value;
    }
    return parsePrimary();
  }

  function parseExpr(minPrec: number): number {
    let left = parseUnary();
    for (;;) {
      const token = peek();
      if (!token || token.kind !== "op") break;
      const spec = OPS[token.value];
      if (!spec || spec.prec < minPrec) break;
      pos++;
      const right = parseExpr(spec.right ? spec.prec : spec.prec + 1);
      left = spec.fn(left, right);
    }
    return left;
  }

  const result = parseExpr(0);
  if (pos !== tokens.length) throw new Error("Trailing input after expression.");
  if (!Number.isFinite(result)) throw new Error("Result is not finite (division by zero?).");
  return result;
}