/**
 * RFC 1320 MD4 — required for NTLM hashing. Implemented in pure JS because
 * the platform WebCrypto API exposes no MD4.
 */

const ROUND2_INDEX = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
const ROUND3_INDEX = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];

const ROUND1_SHIFT = [3, 7, 11, 19];
const ROUND2_SHIFT = [3, 5, 9, 13];
const ROUND3_SHIFT = [3, 9, 11, 15];

function rol(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

interface Md4State {
  a: number;
  b: number;
  c: number;
  d: number;
}

/** Process a single 64-byte (16 word) block in place. */
function md4Block(state: Md4State, words: Uint32Array): void {
  const x = words;
  let { a, b, c, d } = state;

  for (let i = 0; i < 16; i++) {
    const f = (b & c) | (~b & d);
    a = rol((a + f + x[i]) >>> 0, ROUND1_SHIFT[i % 4]);
    // Rotate registers: a <- d <- c <- b <- a
    [a, b, c, d] = [d, a, b, c];
  }

  for (let i = 0; i < 16; i++) {
    const g = (b & c) | (b & d) | (c & d);
    a = rol((a + g + x[ROUND2_INDEX[i]] + 0x5a827999) >>> 0, ROUND2_SHIFT[i % 4]);
    [a, b, c, d] = [d, a, b, c];
  }

  for (let i = 0; i < 16; i++) {
    const h = (b ^ c) ^ d;
    a = rol((a + h + x[ROUND3_INDEX[i]] + 0x6ed9eba1) >>> 0, ROUND3_SHIFT[i % 4]);
    [a, b, c, d] = [d, a, b, c];
  }

  state.a = (state.a + a) >>> 0;
  state.b = (state.b + b) >>> 0;
  state.c = (state.c + c) >>> 0;
  state.d = (state.d + d) >>> 0;
}

/** MD4 digest of arbitrary bytes, returned as a 16-byte little-endian array. */
export function md4Digest(input: Uint8Array): Uint8Array {
  const state: Md4State = {
    a: 0x67452301,
    b: 0xefcdab89,
    c: 0x98badcfe,
    d: 0x10325476,
  };

  const blockLen = 64;
  const bitLen = (input.length * 8) >>> 0;
  const paddedLen = ((input.length + 9 + blockLen - 1) / blockLen | 0) * blockLen;
  const padded = new Uint8Array(paddedLen);
  padded.set(input);
  padded[input.length] = 0x80;
  // A 64-bit little-endian bit length — numbers this large fit in a double,
  // and typical inputs never exceed 2^32 bits.
  const dv = new DataView(padded.buffer);
  dv.setUint32(paddedLen - 8, bitLen, true);
  dv.setUint32(paddedLen - 4, 0, true);

  const words = new Uint32Array(16);
  for (let offset = 0; offset < paddedLen; offset += blockLen) {
    for (let i = 0; i < 16; i++) {
      words[i] =
        padded[offset + i * 4] |
        (padded[offset + i * 4 + 1] << 8) |
        (padded[offset + i * 4 + 2] << 16) |
        (padded[offset + i * 4 + 3] << 24);
    }
    md4Block(state, words);
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, state.a, true);
  outView.setUint32(4, state.b, true);
  outView.setUint32(8, state.c, true);
  outView.setUint32(12, state.d, true);
  return out;
}

/** MD4 of a UTF-16LE encoded string — the NTLM hash of a password. */
export function ntlmHash(password: string): string {
  const le = new Uint8Array(password.length * 2);
  for (let i = 0; i < password.length; i++) {
    const code = password.charCodeAt(i);
    le[i * 2] = code & 0xff;
    le[i * 2 + 1] = code >> 8;
  }
  const digest = md4Digest(le);
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}