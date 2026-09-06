import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "crc32-explained",
  title: "CRC-32 Explained: The Checksum Algorithm Behind Data Integrity",
  description:
    "How CRC-32 works: polynomial division in GF(2), the reflected 0xEDB88320 lookup table, the 0xFFFFFFFF init and final XOR, and the table-driven byte loop — with verified examples.",
  h1: "CRC-32 Explained: The Checksum Algorithm Behind Data Integrity",
  category: "Algorithms & Computer Science",
  excerpt:
    "CRC-32 is a 32-bit error-detection checksum built from binary polynomial division. Real implementations skip the math per bit and use a 256-entry lookup table driven by the reflected polynomial 0xEDB88320.",
  geo: {
    what: "CRC-32 is a checksum algorithm that treats a message as a binary polynomial, divides it by a fixed generator polynomial, and keeps the 32-bit remainder as the checksum.",
    who: "Developers verifying data integrity in zip/gzip, PNG, Ethernet frames and storage formats who want to know exactly how the number is produced — and why it is not cryptography.",
    different: "The Developer Calculator computes CRC-32 in the browser using the standard reflected polynomial 0xEDB88320 with a 256-entry table, matching the widely used 'CRC-32' catalogue entry exactly.",
  },
  publishedAt: "2026-07-28",
  relatedToolPaths: ["/developer-calculator", "/hash-generator"],
  relatedSlugs: ["signed-vs-unsigned-integers", "twos-complement-explained"],
  blocks: [
    {
      type: "p",
      text: "CRC-32 is an error-detection checksum, not a hash for security. It takes a message and emits a fixed 32-bit number that changes with overwhelming probability if any bit of the message changes. It is fast and tiny, which is why it ships in zip, gzip, PNG and network frames — but its purpose is detecting accidental corruption, never intentional tampering.",
    },
    {
      type: "h2",
      text: "The idea: polynomial division",
    },
    {
      type: "p",
      text: "Under the hood a CRC treats the message bits as the coefficients of a polynomial and divides that polynomial by a fixed 33-bit generator. All arithmetic happens in GF(2), meaning XOR instead of subtraction, so there is no borrowing. The remainder of that division is the checksum. For the standard CRC-32 the generator is 0x04C11DB7 (in its normal, non-reflected form).",
    },
    {
      type: "h2",
      text: "Why the table contains 0xEDB88320",
    },
    {
      type: "p",
      text: "Bit-at-a-time division is simple but expensive. Real implementations process whole bytes at once using a precomputed 256-entry table. Most software also uses the reflected variant of the CRC-32 definition (bits and bytes processed least-significant-first), which is why you see 0xEDB88320 — the bit-reversed form of 0x04C11DB7 — in code like the Developer Calculator's table. Both notations describe the same catalogue standard; the reflected loop is just the common software form.",
    },
    {
      type: "h2",
      text: "The four numbers that define it",
    },
    {
      type: "table",
      caption: "The CRC-32 parameter set used here and in most software",
      headers: ["Parameter", "Value", "Meaning"],
      rows: [
        ["Width", "32", "Checksum size in bits"],
        ["Polynomial", "0x04C11DB7 (normal) / 0xEDB88320 (reflected)", "Generator used for division"],
        ["Init", "0xFFFFFFFF", "Register start value (before any bytes)"],
        ["ReflectIn / ReflectOut", "true", "Bits processed least-significant-first"],
        ["XorOut", "0xFFFFFFFF", "Register XORed after the last byte"],
      ],
    },
    {
      type: "p",
      text: "The CRC register starts at 0xFFFFFFFF, not zero. After every byte it becomes table[(register XOR byte) & 0xFF] XOR (register >>> 8), and once all bytes are consumed the result is XORed with 0xFFFFFFFF again: (crc ^ 0xFFFFFFFF) >>> 0. Processing every byte costs four simple operations instead of eight bit-by-bit steps.",
    },
    {
      type: "code",
      label: "The per-byte loop",
      code: `let crc = 0xffffffff;
for (const byte of bytes) {
  crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
}
return (crc ^ 0xffffffff) >>> 0;`,
    },
    {
      type: "h2",
      text: "Why init and final XOR exist",
    },
    {
      type: "p",
      text: "Starting the register at 0xFFFFFFFF and XORing the result at the end is a convention that makes the checksum sensitive to leading zero bytes. Without it, a message like 0x00…00 would always checksum to the same value regardless of length. The initial value also prevents short messages from being described by a trivial polynomial remainder.",
    },
    {
      type: "h2",
      text: "Worked examples",
    },
    {
      type: "table",
      caption: "Verified CRC-32 values from the same algorithm used in the tool",
      headers: ["Input", "CRC-32 (hex)"],
      rows: [
        ['"" (empty string)', "0x00000000"],
        ['"a"', "0xE8B7BE43"],
        ['"hello"', "0x3610A686"],
        ['"The quick brown fox jumps over the lazy dog"', "0x414FA339"],
      ],
    },
    {
      type: "h2",
      text: "CRC-32 vs real hashes",
    },
    {
      type: "table",
      caption: "Checksum versus cryptographic hash",
      headers: ["Property", "CRC-32", "MD5 / SHA-256"],
      rows: [
        ["Purpose", "Error detection (corruption)", "Integrity + tamper resistance"],
        ["Length", "32 bits", "128 / 256 bits"],
        ["Speed", "Very fast, tiny", "Slower, larger"],
        ["Security", "Collisions are trivial to build on purpose", "Cryptographically strong"],
      ],
    },
    {
      type: "note",
      title: "Not a security tool",
      text: "A 32-bit checksum has only 2^32 possible outputs and its construction is public, so constructing files that share a CRC-32 is easy. If an attacker or a checksum collision is in your threat model, use SHA-256 or SHA-3 instead — and note that CRC-32 is computed locally in the calculator, never sent anywhere.",
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Open the Developer Calculator's CRC-32 tool, paste any text, and compare its 32-bit checksum against the examples above. For real hashes such as SHA-256, use the Hash Generator.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is CRC-32 secure?",
          a: "No. It is designed to catch accidental corruption, and intentional collisions can be constructed quickly. Use a cryptographic hash like SHA-256 for anything security-related.",
        },
        {
          q: "Why is the CRC-32 of an empty string zero?",
          a: "With no bytes to process, the register stays at 0xFFFFFFFF and the final XOR of 0xFFFFFFFF cancels it out to 0x00000000.",
        },
        {
          q: "What does 'reflected' mean?",
          a: "The bits and bytes are processed least-significant-first rather than most-significant-first. It does not change the checksum standard — it just changes the polynomial constant you see in code, from 0x04C11DB7 to its bit-reversed twin 0xEDB88320.",
        },
      ],
    },
  ],
};

export default article;