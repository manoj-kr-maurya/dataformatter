const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

const SCALES = [
  "",
  "thousand",
  "million",
  "billion",
  "trillion",
  "quadrillion",
  "quintillion",
];

function toWordsHundreds(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} hundred`);
  }
  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(ones > 0 ? `${TENS[tens]}-${ONES[ones]}` : TENS[tens]);
    }
  }
  return parts.join(" ");
}

/** Convert a non-negative integer to its English words. */
export function numberToWords(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Only non-negative finite numbers are supported.");
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error("Number is too large to convert accurately.");
  }
  if (value === 0) {
    return "zero";
  }

  const groups: number[] = [];
  let n = value;
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === 0) {
      continue;
    }
    const text = toWordsHundreds(group);
    words.push(SCALES[i] ? `${text} ${SCALES[i]}` : text);
  }
  return words.join(" ");
}

const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  million: 1_000_000,
  billion: 1_000_000_000,
  trillion: 1_000_000_000_000,
};

/**
 * Parse a line of English number words (e.g. "one hundred twenty three")
 * into an integer. Throws on unknown tokens.
 */
export function wordsToNumber(text: string): number {
  const tokens = text
    .toLowerCase()
    .trim()
    .split(/[\s-]+/)
    .filter((token) => token !== "and" && token !== "");

  if (tokens.length === 0) {
    throw new Error("No number words found.");
  }

  let current = 0;
  let result = 0;
  for (const token of tokens) {
    const value = WORD_TO_NUMBER[token];
    if (value === undefined) {
      throw new Error(`Unrecognised number word: "${token}".`);
    }
    if (value === 100) {
      current *= 100;
    } else if (value >= 1000) {
      current *= value;
      result += current;
      current = 0;
    } else {
      current += value;
    }
  }
  result += current;
  return result;
}