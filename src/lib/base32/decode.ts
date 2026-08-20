export type DecodeResult = { ok: true; value: string } | { ok: false; error: string };

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const LOOKUP = new Map<string, number>([...ALPHABET].map((char, index) => [char, index]));
const BASE32_RE = /^[A-Z2-7]+=*$/;

export function stripWhitespace(input: string): string {
  return input.replace(/[\s\u200b-]+/g, "");
}

/**
 * Decode RFC 4648 Base32 to UTF-8 text with strict validation.
 * - Accepts whitespace, dashes (RFC 4648 §6) and optional padding
 * - Rejects characters outside the Base32 alphabet
 * - Fails on a trailing remainder of 1 or 3 bits that cannot be valid
 * - Fails on bytes that are not valid UTF-8
 */
export function decodeBase32(input: string): DecodeResult {
  if (!input.trim()) {
    return {
      ok: false,
      error: "There is no Base32 data to decode. Paste or type some Base32 first.",
    };
  }

  const cleaned = stripWhitespace(input);
  if (!BASE32_RE.test(cleaned)) {
    return { ok: false, error: "Invalid Base32. The text contains characters outside the Base32 alphabet." };
  }

  const unpadded = cleaned.slice(0, cleaned.indexOf("=") === -1 ? cleaned.length : cleaned.indexOf("="));
  const leftover = unpadded.length % 8;
  // Unpadded lengths of 1, 3, or 6 leave a partial byte (RFC 4648) and can
  // only be represented with padding.
  if (leftover === 1 || leftover === 3 || leftover === 6) {
    return {
      ok: false,
      error: "Invalid Base32. The length does not encode a whole number of bytes.",
    };
  }

  if (unpadded.length === 0) {
    return { ok: false, error: "Invalid Base32. Only padding was provided." };
  }

  let bits = 0;
  let accumulator = 0;
  const bytes: number[] = [];

  for (const char of unpadded) {
    const value = LOOKUP.get(char);
    if (value === undefined) {
      return { ok: false, error: "Invalid Base32. Unknown character in the input." };
    }
    accumulator = (accumulator << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((accumulator >> bits) & 0xff);
    }
  }

  try {
    const value = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    return { ok: true, value };
  } catch {
    return { ok: false, error: "Invalid Base32. The data could not be decoded as UTF-8 text." };
  }
}