/** FIPS 180-4 SHA-512 family — SHA-512, SHA-384, SHA-512/224, SHA-512/256 — pure JS. */

// Raw 64-bit constants; JS numbers hold exactly up to 2^53, so we keep the
// high 32 bits and low 32 bits separately.
type Word = [number, number]; // [high, low]

const K512: Word[] = [
  [0x428a2f98, 0xd728ae22], [0x71374491, 0x23ef65cd], [0xb5c0fbcf, 0xec4d3b2f],
  [0xe9b5dba5, 0x8189dbbc], [0x3956c25b, 0xf348b538], [0x59f111f1, 0xb605d019],
  [0x923f82a4, 0xaf194f9b], [0xab1c5ed5, 0xda6d8118], [0xd807aa98, 0xa3030242],
  [0x12835b01, 0x45706fbe], [0x243185be, 0x4ee4b28c], [0x550c7dc3, 0xd5ffb4e2],
  [0x72be5d74, 0xf27b896f], [0x80deb1fe, 0x3b1696b1], [0x9bdc06a7, 0x25c71235],
  [0xc19bf174, 0xcf692694], [0xe49b69c1, 0x9ef14ad2], [0xefbe4786, 0x384f25e3],
  [0x0fc19dc6, 0x8b8cd5b5], [0x240ca1cc, 0x77ac9c65], [0x2de92c6f, 0x592b0275],
  [0x4a7484aa, 0x6ea6e483], [0x5cb0a9dc, 0xbd41fbd4], [0x76f988da, 0x831153b5],
  [0x983e5152, 0xee66dfab], [0xa831c66d, 0x2db43210], [0xb00327c8, 0x98fb213f],
  [0xbf597fc7, 0xbeef0ee4], [0xc6e00bf3, 0x3da88fc2], [0xd5a79147, 0x930aa725],
  [0x06ca6351, 0xe003826f], [0x14292967, 0x0a0e6e70], [0x27b70a85, 0x46d22ffc],
  [0x2e1b2138, 0x5c26c926], [0x4d2c6dfc, 0x5ac42aed], [0x53380d13, 0x9d95b3df],
  [0x650a7354, 0x8baf63de], [0x766a0abb, 0x3c77b2a8], [0x81c2c92e, 0x47edaee6],
  [0x92722c85, 0x1482353b], [0xa2bfe8a1, 0x4cf10364], [0xa81a664b, 0xbc423001],
  [0xc24b8b70, 0xd0f89791], [0xc76c51a3, 0x0654be30], [0xd192e819, 0xd6ef5218],
  [0xd6990624, 0x5565a910], [0xf40e3585, 0x5771202a], [0x106aa070, 0x32bbd1b8],
  [0x19a4c116, 0xb8d2d0c8], [0x1e376c08, 0x5141ab53], [0x2748774c, 0xdf8eeb99],
  [0x34b0bcb5, 0xe19b48a8], [0x391c0cb3, 0xc5c95a63], [0x4ed8aa4a, 0xe3418acb],
  [0x5b9cca4f, 0x7763e373], [0x682e6ff3, 0xd6b2b8a3], [0x748f82ee, 0x5defb2fc],
  [0x78a5636f, 0x43172f60], [0x84c87814, 0xa1f0ab72], [0x8cc70208, 0x1a6439ec],
  [0x90befffa, 0x23631e28], [0xa4506ceb, 0xde82bde9], [0xbef9a3f7, 0xb2c67915],
  [0xc67178f2, 0xe372532b], [0xca273ece, 0xea26619c], [0xd186b8c7, 0x21c0c207],
  [0xeada7dd6, 0xcde0eb1e], [0xf57d4f7f, 0xee6ed178], [0x06f067aa, 0x72176fba],
  [0x0a637dc5, 0xa2c898a6], [0x113f9804, 0xbef90dae], [0x1b710b35, 0x131c471b],
  [0x28db77f5, 0x23047d84], [0x32caab7b, 0x40c72493], [0x3c9ebe0a, 0x15c9bebc],
  [0x431d67c4, 0x9c100d4c], [0x4cc5d4be, 0xcb3e42b6], [0x597f299c, 0xfc657e2a],
  [0x5fcb6fab, 0x3ad6faec], [0x6c44198c, 0x4a475817],
];

interface Sha512Ctx {
  h: Word[];
  outputLength: number;
}

const IV512: Word[] = [
  [0x6a09e667, 0xf3bcc908], [0xbb67ae85, 0x84caa73b], [0x3c6ef372, 0xfe94f82b],
  [0xa54ff53a, 0x5f1d36f1], [0x510e527f, 0xade682d1], [0x9b05688c, 0x2b3e6c1f],
  [0x1f83d9ab, 0xfb41bd6b], [0x5be0cd19, 0x137e2179],
];

const IV384: Word[] = [
  [0xcbbb9d5d, 0xc1059ed8], [0x629a292a, 0x367cd507], [0x9159015a, 0x3070dd17],
  [0x152fecd8, 0xf70e5939], [0x67332667, 0xffc00b31], [0x8eb44a87, 0x68581511],
  [0xdb0c2e0d, 0x64f98fa7], [0x47b5481d, 0xbefa4fa4],
];

const IV512_224: Word[] = [
  [0x8c3d37c8, 0x19544da2], [0x73e19966, 0x89dcd4d6], [0x1dfab7ae, 0x32ff9c82],
  [0x679dd514, 0x582f9fcf], [0x0f6d2b69, 0x7bd44da8], [0x77e36f73, 0x04c48942],
  [0x3f9d85a8, 0x6a1d36c8], [0x1112e6ad, 0x91d692a1],
];

const IV512_256: Word[] = [
  [0x22312194, 0xfc2bf72c], [0x9f555fa3, 0xc84c64c2], [0x2393b86b, 0x6f53b151],
  [0x96387719, 0x5940eabd], [0x96283ee2, 0xa88effe3], [0xbe5e1e25, 0x53863992],
  [0x2b0199fc, 0x2c85b8aa], [0x0eb72ddc, 0x81c52ca2],
];

function rotr64(word: Word, shift: number): Word {
  if (shift === 0) return word;
  const [hi, lo] = word;
  if (shift === 32) {
    return [lo, hi];
  }
  if (shift > 32) {
    const shifted = shift - 32;
    const low = (hi >>> shifted) | (lo << (32 - shifted));
    const high = (lo >>> shifted) | (hi << (32 - shifted));
    return [high >>> 0, low >>> 0];
  }
  const low = (lo >>> shift) | (hi << (32 - shift));
  const high = (hi >>> shift) | (lo << (32 - shift));
  return [high >>> 0, low >>> 0];
}

function shr64(word: Word, shift: number): Word {
  const [hi, lo] = word;
  if (shift >= 32) {
    return [0, hi >>> (shift - 32)];
  }
  const high = hi >>> shift;
  const low = ((hi << (32 - shift)) >>> 0) | (lo >>> shift);
  return [high, low >>> 0];
}

function xor64(a: Word, b: Word): Word {
  return [(a[0] ^ b[0]) >>> 0, (a[1] ^ b[1]) >>> 0];
}

function and64(a: Word, b: Word): Word {
  return [(a[0] & b[0]) >>> 0, (a[1] & b[1]) >>> 0];
}

function not64(a: Word): Word {
  return [(~a[0]) >>> 0, (~a[1]) >>> 0];
}

/** 64-bit addition with carry (inputs are 32-bit values, sum < 2^53). */
function add64(...words: Word[]): Word {
  let low = 0;
  for (const [, lo] of words) low += lo;
  let high = 0;
  for (const [hi] of words) high += hi;
  high += Math.floor(low / 0x100000000);
  return [high >>> 0, low >>> 0];
}

export function sha512Digest(input: Uint8Array): Uint8Array {
  return sha512Core(input, { h: IV512, outputLength: 64 });
}

export function sha384Digest(input: Uint8Array): Uint8Array {
  return sha512Core(input, { h: IV384, outputLength: 48 });
}

export function sha512_224Digest(input: Uint8Array): Uint8Array {
  return sha512Core(input, { h: IV512_224, outputLength: 28 });
}

export function sha512_256Digest(input: Uint8Array): Uint8Array {
  return sha512Core(input, { h: IV512_256, outputLength: 32 });
}

function sha512Core(input: Uint8Array, ctx: Sha512Ctx): Uint8Array {
  const blockLen = 128;
  const paddedLen = ((input.length + 16) >> 7) * blockLen + blockLen;
  const padded = new Uint8Array(paddedLen);
  padded.set(input);
  padded[input.length] = 0x80;
  const dv = new DataView(padded.buffer);
  const bitLen = input.length * 8;
  dv.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  dv.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const h = ctx.h.map((w) => w.slice()) as Word[];
  const w: Word[] = new Array(80);
  for (let offset = 0; offset < paddedLen; offset += blockLen) {
    for (let i = 0; i < 16; i++) {
      w[i] = [dv.getUint32(offset + i * 8, false), dv.getUint32(offset + i * 8 + 4, false)];
    }
    for (let i = 16; i < 80; i++) {
      const s0 = xor64(xor64(rotr64(w[i - 15], 1), rotr64(w[i - 15], 8)), shr64(w[i - 15], 7));
      const s1 = xor64(xor64(rotr64(w[i - 2], 19), rotr64(w[i - 2], 61)), shr64(w[i - 2], 6));
      w[i] = add64(w[i - 16], s0, w[i - 7], s1);
    }

    let a = h[0];
    let b = h[1];
    let c = h[2];
    let d = h[3];
    let e = h[4];
    let f = h[5];
    let g = h[6];
    let hh = h[7];

    for (let i = 0; i < 80; i++) {
      const s1 = xor64(xor64(rotr64(e, 14), rotr64(e, 18)), rotr64(e, 41));
      const ch = xor64(and64(e, f), and64(not64(e), g));
      const t1 = add64(hh, s1, ch, K512[i], w[i]);
      const s0 = xor64(xor64(rotr64(a, 28), rotr64(a, 34)), rotr64(a, 39));
      const maj = xor64(xor64(and64(a, b), and64(a, c)), and64(b, c));
      const t2 = add64(s0, maj);
      hh = g;
      g = f;
      f = e;
      e = add64(d, t1);
      d = c;
      c = b;
      b = a;
      a = add64(t1, t2);
    }

    h[0] = add64(h[0], a);
    h[1] = add64(h[1], b);
    h[2] = add64(h[2], c);
    h[3] = add64(h[3], d);
    h[4] = add64(h[4], e);
    h[5] = add64(h[5], f);
    h[6] = add64(h[6], g);
    h[7] = add64(h[7], hh);
  }

  const out = new Uint8Array(ctx.outputLength);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < h.length && i * 8 < ctx.outputLength; i++) {
    outView.setUint32(i * 8, h[i][0], false);
    if (i * 8 + 4 < ctx.outputLength) {
      outView.setUint32(i * 8 + 4, h[i][1], false);
    }
  }
  return out;
}