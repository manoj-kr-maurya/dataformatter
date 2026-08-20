export type EncodeResult = { ok: true; value: string } | { ok: false; error: string };

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * RFC 4648 Base32 encoding with standard padding.
 * Encoding can never fail — UTF-8 is always encodable.
 */
export function encodeBase32(input: string): EncodeResult {
  const bytes = new TextEncoder().encode(input);
  let bits = 0;
  let accumulator = 0;
  let output = "";

  for (const byte of bytes) {
    accumulator = (accumulator << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += ALPHABET[(accumulator >> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    output += ALPHABET[(accumulator << (5 - bits)) & 0x1f];
  }

  const padding = (8 - (output.length % 8)) % 8;
  return { ok: true, value: output + "=".repeat(padding) };
}