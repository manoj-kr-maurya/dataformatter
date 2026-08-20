/**
 * RFC 1321 MD5 — implemented in pure JS because the WebCrypto API has no MD5.
 * Digest bytes are little-endian, matching the reference algorithm.
 */

const S: number[] = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const K: number[] = [];
for (let i = 0; i < 64; i++) {
  K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
}

function rol(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

export function md5Digest(input: Uint8Array): Uint8Array {
  const bitLenLow = (input.length * 8) >>> 0;
  const bitLenHigh = Math.floor(input.length / 0x20000000);

  // Smallest multiple of 64 that can hold input + 0x80 + 8 length bytes.
  const paddedLen = (input.length + 9 + 63) & ~63;
  const padded = new Uint8Array(paddedLen);
  padded.set(input);
  padded[input.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(paddedLen - 8, bitLenLow, true);
  dv.setUint32(paddedLen - 4, bitLenHigh, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const m = new Uint32Array(16);
  const blockLen = 64;
  for (let offset = 0; offset < paddedLen; offset += blockLen) {
    for (let i = 0; i < 16; i++) {
      m[i] = dv.getUint32(offset + i * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const rounded = rol((a + f + K[i] + m[g]) >>> 0, S[i]);
      const nextB = (b + rounded) >>> 0;
      const temp = d;
      d = c;
      c = b;
      b = nextB;
      a = temp;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return out;
}