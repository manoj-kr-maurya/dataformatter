import { failResult, okResult } from "@/lib/transformers/builders";
import { md5Digest } from "@/lib/hash/md5";
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
} from "@/lib/hash/keccak";
import type { TransformationKind, TransformationResult } from "@/types/transformation";

const encoder = new TextEncoder();

function hexOf(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Build a simple "hash this text" transformer. Input is hashed as UTF-8 and
 * the lower-case hex digest is returned.
 */
function hashTool(transformKind: TransformationKind, label: string) {
  return function (digest: (input: Uint8Array) => Uint8Array): (input: string) => TransformationResult {
    return function (input: string): TransformationResult {
      if (!input) {
        return failResult(input, "Enter some text to hash.", "TEXT", "TEXT");
      }
      return okResult(input, hexOf(digest(encoder.encode(input))), transformKind, "TEXT", `${label} generated`, "TEXT");
    };
  };
}

const makeMd5 = hashTool("MD5_HASH", "MD5 hash");
const makeSha1 = hashTool("SHA1_HASH", "SHA-1 hash");
const makeSha224 = hashTool("SHA224_HASH", "SHA-224 hash");
const makeSha256 = hashTool("SHA256_HASH", "SHA-256 hash");
const makeSha384 = hashTool("SHA384_HASH", "SHA-384 hash");
const makeSha512 = hashTool("SHA512_HASH", "SHA-512 hash");
const makeSha512_224 = hashTool("SHA512_224_HASH", "SHA-512/224 hash");
const makeSha512_256 = hashTool("SHA512_256_HASH", "SHA-512/256 hash");
const makeSha3_224 = hashTool("SHA3_224_HASH", "SHA3-224 hash");
const makeSha3_256 = hashTool("SHA3_256_HASH", "SHA3-256 hash");
const makeSha3_384 = hashTool("SHA3_384_HASH", "SHA3-384 hash");
const makeSha3_512 = hashTool("SHA3_512_HASH", "SHA3-512 hash");

export const md5HashGenerator = makeMd5(md5Digest);
export const sha1HashGenerator = makeSha1(sha1Digest);
export const sha224HashGenerator = makeSha224(sha224Digest);
export const sha256HashGenerator = makeSha256(sha256Digest);
export const sha384HashGenerator = makeSha384(sha384Digest);
export const sha512HashGenerator = makeSha512(sha512Digest);
export const sha512_224HashGenerator = makeSha512_224(sha512_224Digest);
export const sha512_256HashGenerator = makeSha512_256(sha512_256Digest);
export const sha3_224HashGenerator = makeSha3_224(sha3_224Digest);
export const sha3_256HashGenerator = makeSha3_256(sha3_256Digest);
export const sha3_384HashGenerator = makeSha3_384(sha3_384Digest);
export const sha3_512HashGenerator = makeSha3_512(sha3_512Digest);