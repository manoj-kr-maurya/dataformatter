export type DecodeResult = { ok: true; value: string } | { ok: false; error: string };

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const LOOKUP = new Map<string, number>([...ALPHABET].map((char, index) => [char, index]));
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

/**
 * Decode Base58 (Bitcoin alphabet) to UTF-8 text.
 * Leading "1" characters decode to leading zero bytes.
 */
export function decodeBase58(input: string): DecodeResult {
  if (!input.trim()) {
    return {
      ok: false,
      error: "There is no Base58 data to decode. Paste or type some Base58 first.",
    };
  }

  const cleaned = input.replace(/[\s\u200b]+/g, "");
  if (!BASE58_RE.test(cleaned)) {
    return { ok: false, error: "Invalid Base58. The text contains characters outside the Base58 alphabet." };
  }

  let zeros = 0;
  while (zeros < cleaned.length && cleaned[zeros] === "1") {
    zeros++;
  }

  let value = BigInt(0);
  for (const char of cleaned) {
    const digit = LOOKUP.get(char);
    if (digit === undefined) {
      return { ok: false, error: "Invalid Base58. Unknown character in the input." };
    }
    value = value * BigInt(58) + BigInt(digit);
  }

  const bytes: number[] = [];
  while (value > BigInt(0)) {
    bytes.unshift(Number(value & BigInt(255)));
    value >>= BigInt(8);
  }

  const padded = new Uint8Array(zeros + bytes.length);
  padded.set(bytes, zeros);

  if (padded.length === 0) {
    return { ok: false, error: "Invalid Base58. The input encodes an empty value." };
  }

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(padded);
    return { ok: true, value: decoded };
  } catch {
    return { ok: false, error: "Invalid Base58. The data could not be decoded as UTF-8 text." };
  }
}