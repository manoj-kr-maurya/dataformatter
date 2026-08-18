import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha1Digest } from "@/lib/hash/sha1";
import { sha224Digest, sha256Digest } from "@/lib/hash/sha256";
import {
  sha384Digest,
  sha512_224Digest,
  sha512_256Digest,
  sha512Digest,
} from "@/lib/hash/sha512";
import {
  sha3_224Digest,
  sha3_256Digest,
  sha3_384Digest,
  sha3_512Digest,
  shake128Digest,
  shake256Digest,
} from "@/lib/hash/keccak";

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

function reference(algorithm: string, input: Uint8Array, length?: number): string {
  const hash = createHash(algorithm, length ? { outputLength: length } : undefined);
  hash.update(input);
  return hash.digest("hex");
}

const cases: Array<{ name: string; input: Uint8Array }> = [
  { name: "empty", input: new TextEncoder().encode("") },
  { name: "abc", input: new TextEncoder().encode("abc") },
  {
    name: "quick brown fox",
    input: new TextEncoder().encode("The quick brown fox jumps over the lazy dog"),
  },
  { name: "1000 x 0x42", input: new Uint8Array(1000).fill(0x42) },
  { name: "55 x 0xaa (pad boundary)", input: new Uint8Array(55).fill(0xaa) },
  { name: "56 x 0xbb (pad boundary)", input: new Uint8Array(56).fill(0xbb) },
  { name: "128 x 0xcc (two sha256 blocks)", input: new Uint8Array(128).fill(0xcc) },
  { name: "272 x 0xdd (two sha3 blocks)", input: new Uint8Array(272).fill(0xdd) },
];

const families: Array<{ fn: (b: Uint8Array) => Uint8Array; algorithm: string; name: string }> = [
  { fn: sha1Digest, algorithm: "sha1", name: "sha1" },
  { fn: sha224Digest, algorithm: "sha224", name: "sha-224" },
  { fn: sha256Digest, algorithm: "sha256", name: "sha-256" },
  { fn: sha384Digest, algorithm: "sha384", name: "sha-384" },
  { fn: sha512Digest, algorithm: "sha512", name: "sha-512" },
  { fn: sha512_224Digest, algorithm: "sha512-224", name: "sha-512/224" },
  { fn: sha512_256Digest, algorithm: "sha512-256", name: "sha-512/256" },
  { fn: sha3_224Digest, algorithm: "sha3-224", name: "sha3-224" },
  { fn: sha3_256Digest, algorithm: "sha3-256", name: "sha3-256" },
  { fn: sha3_384Digest, algorithm: "sha3-384", name: "sha3-384" },
  { fn: sha3_512Digest, algorithm: "sha3-512", name: "sha3-512" },
];

describe("SHA digest families against OpenSSL reference", () => {
  for (const { fn, algorithm, name } of families) {
    it(`${name}`, () => {
      for (const { name: label, input } of cases) {
        expect(hex(fn(input)), `${name} on ${label}`).toBe(reference(algorithm, input));
      }
    });
  }
});

describe("Shake XOFs against OpenSSL reference", () => {
  it("shake128", () => {
    for (const { name: label, input } of cases) {
      expect(hex(shake128Digest(input, 64)), `shake128 on ${label}`).toBe(
        reference("shake128", input, 64),
      );
    }
  });
  it("shake256", () => {
    for (const { name: label, input } of cases) {
      expect(hex(shake256Digest(input, 64)), `shake256 on ${label}`).toBe(
        reference("shake256", input, 64),
      );
    }
  });
});

describe("known FIPS 180-4 vectors", () => {
  it("sha1(abc)", () => {
    expect(hex(sha1Digest(new TextEncoder().encode("abc")))).toBe(
      "a9993e364706816aba3e25717850c26c9cd0d89d",
    );
  });
  it("sha256(abc)", () => {
    expect(hex(sha256Digest(new TextEncoder().encode("abc")))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
  it("sha384(abc)", () => {
    expect(hex(sha384Digest(new TextEncoder().encode("abc")))).toBe(
      "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
    );
  });
});