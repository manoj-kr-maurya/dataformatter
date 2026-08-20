export type EncodeResult = { ok: true; value: string } | { ok: false; error: string };

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Encode bytes (from UTF-8) as Base58 using the Bitcoin alphabet,
 * preserving any leading zero bytes as leading "1" characters.
 */
export function encodeBase58(input: string): EncodeResult {
  const bytes = new TextEncoder().encode(input);

  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) {
    zeros++;
  }

  let value = BigInt(0);
  for (const byte of bytes) {
    value = value * BigInt(256) + BigInt(byte);
  }

  let encoded = "";
  while (value > BigInt(0)) {
    const remainder = value % BigInt(58);
    value /= BigInt(58);
    encoded = ALPHABET[Number(remainder)] + encoded;
  }

  return { ok: true, value: "1".repeat(zeros) + encoded };
}