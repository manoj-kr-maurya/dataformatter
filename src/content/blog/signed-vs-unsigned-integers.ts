import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "signed-vs-unsigned-integers",
  title: "Signed vs Unsigned Integers: Ranges, Overflow and When to Use Each",
  description:
    "Signed vs unsigned integers explained with real ranges (Int8..UInt64), why unsigned max is 2^width−1, how overflow wraps instead of erroring, and when to pick each — grounded in a bit-level calculator.",
  h1: "Signed vs Unsigned Integers: Ranges, Overflow and When to Use Each",
  category: "Algorithms & Computer Science",
  excerpt:
    "An N-bit integer stores 2^N distinct patterns. Whether those patterns stand for 0..2^N−1 (unsigned) or −2^(N−1)..2^(N−1)−1 (signed) changes the range, the largest value and how overflow behaves.",
  geo: {
    what: "A signed integer reserves one bit for the sign and can represent negatives, while an unsigned integer uses every bit for magnitude, so for a given width unsigned always doubles the positive range.",
    who: "Developers modeling sizes, counts, indices, offsets and protocol fields who need to know which range a value actually fits in.",
    different: "The Developer Calculator models all eight built-in types (Int8..UInt64) with BigInt, truncates on overflow exactly like a real machine, and reports the smallest types a value fits into.",
  },
  publishedAt: "2026-07-21",
  relatedToolPaths: ["/developer-calculator", "/compiler"],
  relatedSlugs: ["twos-complement-explained", "crc32-explained"],
  blocks: [
    {
      type: "p",
      text: "Every integer type is described by two numbers: the bit width and whether it is signed. Together they define the full range of values the type can hold. The moment a value falls outside that range, the storage truncates it — and the result is not an error, it is a different number.",
    },
    {
      type: "h2",
      text: "The complete range table",
    },
    {
      type: "table",
      caption: "Built-in integer types and their exact ranges",
      headers: ["Type", "Width", "Signed", "Min", "Max"],
      rows: [
        ["Int8", "8", "Yes", "-128", "127"],
        ["UInt8", "8", "No", "0", "255"],
        ["Int16", "16", "Yes", "-32,768", "32,767"],
        ["UInt16", "16", "No", "0", "65,535"],
        ["Int32", "32", "Yes", "-2,147,483,648", "2,147,483,647"],
        ["UInt32", "32", "No", "0", "4,294,967,295"],
        ["Int64", "64", "Yes", "-9,223,372,036,854,775,808", "9,223,372,036,854,775,807"],
        ["UInt64", "64", "No", "0", "18,446,744,073,709,551,615"],
      ],
    },
    {
      type: "h2",
      text: "Where the numbers come from",
    },
    {
      type: "p",
      text: "An N-bit type has 2^N possible patterns. Unsigned, those patterns are 0 through 2^N − 1, so UInt8 covers 0..255 — all 256 patterns used for magnitude. Signed, the most significant bit is the sign, leaving N − 1 bits of magnitude; the range is −2^(N−1) through 2^(N−1) − 1, so Int8 covers −128..127. That asymmetric minimum (−128 has no positive twin at 8 bits) is a direct consequence of two's-complement storage.",
    },
    {
      type: "h2",
      text: "Overflow wraps; it never errors",
    },
    {
      type: "p",
      text: "Store a value that does not fit and a fixed-width machine keeps only the low N bits. The calculator does the same thing: the stored pattern is value & ((1 << width) − 1), and 256 stored as UInt8 becomes 0, while −1 stored as UInt8 becomes 255. The tool spells this out — '256 does not fit UInt8 (range 0…255); it wraps to 0'.",
    },
    {
      type: "example",
      inputLabel: "Overflow examples",
      input: `256 as UInt8   → wraps to 0
-1 as UInt8    → wraps to 255
-129 as Int8   → wraps to 127`,
      outputLabel: "Why",
      output: `Only the low 8 bits survive.
0b1_0000_0000 & 0b1111_1111 = 0
0b1111_1111 interpreted
as unsigned is 255
0b1000_0001 (two's complement) is 127`,
    },
    {
      type: "h2",
      text: "The solver is BigInt-backed",
    },
    {
      type: "p",
      text: "All integer math in the calculator runs on BigInt, not JavaScript numbers. That matters for the 64-bit rows: plain numbers only represent integers exactly up to 2^53, so UInt64 max (18.4 quintillion) would lose precision in a Number-based solver. BigInt keeps all 64 bits exact.",
    },
    {
      type: "h2",
      text: "Signed or unsigned?",
    },
    {
      type: "ul",
      items: [
        "Unsigned: sizes, element counts, lengths, timestamps, hash/mask bit patterns, and any quantity that can never be negative — you get twice the positive range.",
        "Signed: differences, offsets, deltas, loop counters that can go negative, temperatures and anything that represents a displacement.",
        "Protocol fields: match the wire format first. A C uint32_t or a Rust u32 should be modeled as UInt32, not Int32.",
        "When in doubt, think about what the first bit (the pattern 0x80 at 8 bits, 0x8000 at 16 bits) means: negative sign or 128?",
      ],
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Open the Developer Calculator's integer tool, punch in a value like 256 or −42, and switch the type to see the exact interpreted value, hex, binary, the overflow warning, and which types the value fits.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Does 256 fit in one byte?",
          a: "Only if you mean an unsigned 8-bit value as 0..255 — and 256 does not fit UInt8 either; it wraps to 0. The largest one-byte values are 255 (unsigned) and 127 (signed).",
        },
        {
          q: "Why is Int8's minimum −128 and not −127?",
          a: "Two's complement represents sign patterns symmetrically except for the negative-most value: −128 has no +128 twin at 8 bits, because the all-zero pattern means +0 and the sign bit alone (0b1000_0000) is the extra negative value −128.",
        },
        {
          q: "Do I need to care about 64-bit types in JavaScript?",
          a: "Yes for values above 2^53 (9,007,199,254,740,992) — ordinary JS numbers can't represent them exactly, which is why the calculator uses BigInt for integer math.",
        },
      ],
    },
  ],
};

export default article;