/**
 * SHA-3 (FIPS 202) and cSHAKE-family Shake128/Shake256 — pure JS Keccak-f[1600].
 */

const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROTATION_OFFSETS = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

const MASK = (1n << 64n) - 1n;

function rol(value: bigint, shift: number): bigint {
  return ((value << BigInt(shift)) | (value >> BigInt(64 - shift))) & MASK;
}

function keccakF(state: bigint[]): void {
  for (const rc of ROUND_CONSTANTS) {
    // θ
    const c = new Array(5);
    const d = new Array(5);
    for (let i = 0; i < 5; i++) {
      c[i] = state[i] ^ state[i + 5] ^ state[i + 10] ^ state[i + 15] ^ state[i + 20];
    }
    for (let i = 0; i < 5; i++) {
      d[i] = c[(i + 4) % 5] ^ rol(c[(i + 1) % 5], 1);
    }
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        state[i + 5 * j] ^= d[i];
      }
    }
    // ρ + π
    const b = new Array(25);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        b[j + 5 * ((2 * i + 3 * j) % 5)] = rol(state[i + 5 * j], ROTATION_OFFSETS[i][j]);
      }
    }
    // χ
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        state[i + 5 * j] =
          b[i + 5 * j] ^ ((MASK ^ b[(i + 1) % 5 + 5 * j]) & b[(i + 2) % 5 + 5 * j]);
      }
    }
    // ι
    state[0] ^= rc;
  }
}

/**
 * Keccak core: `rate` bytes per block, `suffix` domain-separation bits,
 * `outputLength` output bytes, `squeeze` = true for XOF (Shake).
 */
function keccak(
  input: Uint8Array,
  rate: number,
  suffix: number,
  outputLength: number,
  squeeze = false,
): Uint8Array {
  const rateBits = rate * 8;
  const state = new Array(25).fill(0n);

  // Absorb — if the message fills a block exactly, we still need an extra
  // block for the pad10*1 terminator.
  const paddedLen =
    input.length % rate === 0 ? input.length + rate : Math.ceil(input.length / rate) * rate;
  const padded = new Uint8Array(paddedLen);
  padded.set(input.subarray(0, input.length));
  padded[input.length] ^= suffix;
  padded[padded.length - 1] ^= 0x80;

  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let i = 0; i < rate / 8; i++) {
      const idx = offset + i * 8;
      let value = 0n;
      for (let k = 0; k < 8; k++) {
        value |= BigInt(padded[idx + k]) << BigInt(8 * k);
      }
      state[i] ^= value;
    }
    keccakF(state);
  }

  // Squeeze
  const out = new Uint8Array(outputLength);
  let written = 0;
  while (written < outputLength) {
    for (let i = 0; i < rate / 8 && written < outputLength; i++) {
      let value = state[i];
      for (let k = 0; k < 8 && written < outputLength; k++) {
        out[written++] = Number(value & 0xffn);
        value >>= 8n;
      }
    }
    if (squeeze && written < outputLength) {
      keccakF(state);
    }
  }
  void rateBits;
  return out;
}

export function sha3_224Digest(input: Uint8Array): Uint8Array {
  return keccak(input, 144, 0x06, 28);
}

export function sha3_256Digest(input: Uint8Array): Uint8Array {
  return keccak(input, 136, 0x06, 32);
}

export function sha3_384Digest(input: Uint8Array): Uint8Array {
  return keccak(input, 104, 0x06, 48);
}

export function sha3_512Digest(input: Uint8Array): Uint8Array {
  return keccak(input, 72, 0x06, 64);
}

export function shake128Digest(input: Uint8Array, outputLength: number): Uint8Array {
  return keccak(input, 168, 0x1f, outputLength, true);
}

export function shake256Digest(input: Uint8Array, outputLength: number): Uint8Array {
  return keccak(input, 136, 0x1f, outputLength, true);
}