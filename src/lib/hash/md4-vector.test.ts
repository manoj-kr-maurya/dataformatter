import { expect, it } from "vitest";
import { md4Digest, ntlmHash } from "@/lib/hash/md4";

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

it("matches RFC 1320 MD4 test vectors", () => {
  expect(hex(md4Digest(new TextEncoder().encode("")))).toBe("31d6cfe0d16ae931b73c59d7e0c089c0");
  expect(hex(md4Digest(new TextEncoder().encode("a")))).toBe("bde52cb31de33e46245e05fbdbd6fb24");
  expect(hex(md4Digest(new TextEncoder().encode("abc")))).toBe("a448017aaf21d8525fc10ae87aa6729d");
  expect(hex(md4Digest(new TextEncoder().encode("message digest")))).toBe(
    "d9130a8164549fe818874806e1c7014b",
  );
});

it("NTLM hash matches independent OpenSSL MD4(UTF-16LE) values", () => {
  expect(ntlmHash("Test")).toBe("4a1fab8f6b5441e0493dc7d41304bfb6");
  expect(ntlmHash("123456")).toBe("32ed87bdb5fdc5e9cba88547376818d4");
  expect(ntlmHash("")).toBe("31d6cfe0d16ae931b73c59d7e0c089c0");
});