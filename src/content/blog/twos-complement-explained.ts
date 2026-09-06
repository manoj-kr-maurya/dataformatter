import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "twos-complement-explained",
  title: "Two's Complement Explained: How Signed Integers Are Stored in Binary",
  description:
    "Why two's complement is how signed integers are stored: invert every bit and add one, how the sign bit works, the −128..127 range asymmetry, and how overflow truncates — with real bit patterns.",
  h1: "Two's Complement Explained: How Signed Integers Are Stored in Binary",
  category: "Algorithms & Computer Science",
  excerpt:
    "Two's complement is the storage convention behind every signed integer on modern hardware: a negative value is the bitwise inversion of its positive magnitude plus one, and the high bit acts as the sign.",
  geo: {
    what: "Two's complement is the scheme used to store signed integers in binary: the bits of a negative number are the bitwise inversion of its positive magnitude plus one, and a set high bit means negative.",
    who: "Developers debugging hex dumps, bit fields, overflow bugs and binary protocols where the pattern 0xFF might mean −1 or 255 depending on interpretation.",
    different: "The Developer Calculator converts integer literals to exact two's-complement bits at 8, 16, 32 or 64 bits, interprets them back to signed and unsigned values, and flags overflow while still showing the truncated pattern.",
  },
  publishedAt: "2026-07-23",
  relatedToolPaths: ["/developer-calculator", "/compiler"],
  relatedSlugs: ["signed-vs-unsigned-integers", "crc32-explained"],
  blocks: [
    {
      type: "p",
      text: "Two's complement is a convention: a fixed number of bits interprets its high bit as a negative sign, and every negative value is produced from its positive magnitude by inverting all bits and adding one. Because the same binary pattern can be read as signed or unsigned, the same bits in memory can mean 255 or −1 — the interpretation is what makes the difference.",
    },
    {
      type: "h2",
      text: "The rule: invert every bit and add one",
    },
    {
      type: "p",
      text: "To find the two's-complement bits of a negative number, write the positive magnitude in binary, flip every bit, then add 1. For −42 at 8 bits: 42 is 00101010, inverted it is 11010101, plus one gives 11010110. The all-ones pattern 11111111 is −1 (invert 00000001, add 1, and 00000000 + 1 rolls over to 11111111 by definition).",
    },
    {
      type: "example",
      inputLabel: "−42 as 8-bit two's complement",
      input: `42        00101010
invert    11010101
  + 1     11010110`,
      outputLabel: "Readings of the same pattern",
      output: `unsigned: 214
signed:   −42
hex:      0xD6`,
    },
    {
      type: "h2",
      text: "Why it wins over the alternatives",
    },
    {
      type: "p",
      text: "Two's complement makes ordinary addition work for both signs with the same hardware. Add 1 to 11111111 (≈ −1) and you get 00000000 (0) with a discarded carry — exactly what −1 + 1 should be. There is a single representation of zero (00000000), unlike sign-magnitude where 10000000 would be \u201cminus zero\u201d, and subtraction becomes addition of the complemented value.",
    },
    {
      type: "h2",
      text: "Reading a pattern in your head",
    },
    {
      type: "table",
      caption: "The sign bit decides how to read a 4-bit pattern",
      headers: ["Pattern", "Unsigned", "Two's-complement signed"],
      rows: [
        ["0000", "0", "0"],
        ["0111", "7", "7 (max positive)"],
        ["1000", "8", "-8 (min negative)"],
        ["1001", "9", "-7"],
        ["1111", "15", "-1"],
      ],
    },
    {
      type: "p",
      text: "If the high bit of a signed value is 0, the number is positive and the remaining bits are its magnitude. If the high bit is 1, the number is negative: 11111111 at 8 bits is −1, 10000000 is −128, and the range between them covers exactly −128..127 — one more negative value than positive, because zero consumes one pattern.",
    },
    {
      type: "h2",
      text: "The hex shortcut",
    },
    {
      type: "p",
      text: "At 8-bit signed widths the high hex nibble tells most of the story: 0x00–0x7F are 0..127 and 0x80–0xFF are −128..−1. So 0xFF is −1, 0xFE is −2, and 0x80 is −128. The same shortcut works at 16 bits with 0x8000 (−32768) and 0xFFFF (−1).",
    },
    {
      type: "h2",
      text: "What happens outside the range",
    },
    {
      type: "p",
      text: "When a value does not fit the requested width, the calculator truncates to the low bits and reports overflow — it still shows exactly what bits a machine of that width would keep. −300 at 8 bits, for example, becomes 11010100 (−44 when read signed). This matches the chip: overflow drops the high bits and the low pattern is what lands in memory.",
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Open the Developer Calculator's two's-complement tool, enter negative and positive values at 8, 16, 32 or 64 bits, and read the bits, hex and signed interpretation. Overflow widths warn but still display the truncated pattern.",
    },
    {
      type: "faq",
      items: [
        {
          q: "How do you negate a two's-complement value?",
          a: "Same rule: invert every bit and add one. Applying it twice returns the original value, so it works symmetrically for positive and negative inputs.",
        },
        {
          q: "Why is the minimum −128 at 8 bits and not −127?",
          a: "0b10000000 is the only pattern with no positive counterpart — all other negative patterns come in +/− pairs, but that one represents −2^7, leaving the space for zero.",
        },
        {
          q: "Is 0xFF always −1?",
          a: "Only when interpreted as an 8-bit signed value. As an 8-bit unsigned value the same pattern is 255, which is precisely why keeping signed and unsigned straight matters.",
        },
      ],
    },
  ],
};

export default article;