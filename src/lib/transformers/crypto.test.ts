import { describe, expect, it } from "vitest";
import {
  md5HashGenerator,
  sha1HashGenerator,
  sha256HashGenerator,
  sha512HashGenerator,
  sha3_256HashGenerator,
} from "@/lib/transformers/cryptoTools";

describe("crypto hash generators", () => {
  it("hashes abc with known digests", () => {
    expect(sha256HashGenerator("abc").output).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha1HashGenerator("abc").output).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(md5HashGenerator("abc").output).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(sha512HashGenerator("abc").output).toBe(
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a21" +
        "92992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    );
    expect(sha3_256HashGenerator("abc").output).toBe(
      "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532",
    );
  });

  it("marks the transformation kind", () => {
    expect(sha256HashGenerator("abc").transformation).toBe("SHA256_HASH");
    expect(sha256HashGenerator("abc").success).toBe(true);
  });

  it("fails on empty input", () => {
    const result = sha1HashGenerator("");
    expect(result.success).toBe(false);
    expect(result.output).toBe("");
  });
});