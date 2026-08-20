import { failResult, okResult } from "@/lib/transformers/builders";
import { countChars, countLines, countWords } from "@/lib/text/counts";
import type { TransformationResult } from "@/types/transformation";

type CaseStyle =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "capitalize"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot";

const CASE_STYLES: CaseStyle[] = [
  "upper",
  "lower",
  "title",
  "sentence",
  "capitalize",
  "camel",
  "pascal",
  "snake",
  "kebab",
  "constant",
  "dot",
];

const UPSIDE_DOWN_MAP: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ",
  k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ",
  u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
  A: "∀", B: "ᙠ", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H", I: "I", J: "ſ",
  K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ", Q: "Q", R: "ᴚ", S: "S", T: "⊥",
  U: "∩", V: "Λ", W: "M", X: "X", Y: "⅄", Z: "Z",
  "0": "0", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  ".": "˙", ",": "'", "!": "¡", "?": "¿", "(": ")", ")": "(", "[": "]", "]": "[",
  "{": "}", "}": "{", "&": "⅋", "_": "‾", "'": ",", '"': ",,", "<": ">", ">": "<",
  " ": " ",
};

const WORD_RE = /[\p{L}\p{N}]+/gu;

function splitWords(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

function emptyFail(input: string, mode: string): TransformationResult {
  return failResult(input, `There is no text to ${mode}.`, "TEXT", "TEXT");
}

export function upsideDownText(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "flip upside down");
  }
  const flipped = Array.from(input)
    .reverse()
    .map((char) => UPSIDE_DOWN_MAP[char] ?? char)
    .join("");
  return okResult(input, flipped, "UPSIDE_DOWN_TEXT", "TEXT", "Text flipped upside down", "TEXT");
}

export function reverseString(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "reverse");
  }
  const reversed = Array.from(input).reverse().join("");
  return okResult(input, reversed, "REVERSE_STRING", "TEXT", "String reversed", "TEXT");
}

/** Apply a named case style; `text` is split on any non-letter/number boundary. */
function applyCase(style: CaseStyle, text: string): string {
  const words = splitWords(text);
  switch (style) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    case "sentence": {
      const first = text.match(/\p{L}/u);
      if (!first) {
        return text.toLowerCase();
      }
      const index = first.index as number;
      return (
        text.slice(0, index) +
        text.charAt(index).toUpperCase() +
        text.slice(index + 1).toLowerCase()
      );
    }
    case "capitalize":
      return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    case "camel":
      return words
        .map((word, i) =>
          i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join("");
    case "pascal":
      return words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
    case "snake":
      return words.map((word) => word.toLowerCase()).join("_");
    case "kebab":
      return words.map((word) => word.toLowerCase()).join("-");
    case "constant":
      return words.map((word) => word.toUpperCase()).join("_");
    case "dot":
      return words.map((word) => word.toLowerCase()).join(".");
  }
}

export function caseConverter(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "convert case");
  }
  const [maybeStyle, ...rest] = input.trim().split(/\s+/);
  const style = CASE_STYLES.includes(maybeStyle as CaseStyle)
    ? (maybeStyle as CaseStyle)
    : "title";
  const text = CASE_STYLES.includes(maybeStyle as CaseStyle) ? rest.join(" ") : input.trim();
  return okResult(input, applyCase(style, text), "CASE_CONVERTER", "TEXT", "Case converted", "TEXT");
}

export function wordCounter(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "count");
  }
  const output = `Words: ${countWords(input)}\nCharacters: ${countChars(input)}\nLines: ${countLines(input)}`;
  return okResult(input, output, "WORD_COUNTER", "TEXT", "Text counted", "TEXT");
}

export function wordFrequencyCounter(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "count word frequencies");
  }
  const counts = new Map<string, number>();
  for (const word of splitWords(input)) {
    const key = word.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const lines = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word, count]) => `${word}: ${count}`);
  return okResult(input, lines.join("\n"), "WORD_FREQUENCY_COUNTER", "TEXT", "Word frequencies counted", "TEXT");
}

export function wordSorter(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "sort words");
  }
  const sorted = splitWords(input)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .join("\n");
  return okResult(input, sorted, "WORD_SORTER", "TEXT", "Words sorted", "TEXT");
}

export function sortTextLines(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "sort lines");
  }
  const sorted = input
    .split("\n")
    .map((line) => line.trimEnd())
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .join("\n");
  return okResult(input, sorted, "SORT_TEXT_LINES", "TEXT", "Lines sorted", "TEXT");
}

export function removeAccents(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "remove accents");
  }
  const cleaned = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return okResult(input, cleaned, "REMOVE_ACCENTS", "TEXT", "Accents removed", "TEXT");
}

export function removeDuplicateLines(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "remove duplicate lines");
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of input.split("\n")) {
    const key = line.trimEnd();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(line);
    }
  }
  return okResult(input, out.join("\n"), "REMOVE_DUPLICATE_LINES", "TEXT", "Duplicate lines removed", "TEXT");
}

export function removeEmptyLines(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "remove empty lines");
  }
  const out = input
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n");
  return okResult(input, out, "REMOVE_EMPTY_LINES", "TEXT", "Empty lines removed", "TEXT");
}

export function removeExtraSpaces(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "remove extra spaces");
  }
  const out = input
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
  return okResult(input, out, "REMOVE_EXTRA_SPACES", "TEXT", "Extra spaces removed", "TEXT");
}

export function removeWhitespace(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "remove whitespace");
  }
  const out = input.replace(/\s+/g, "");
  return okResult(input, out, "REMOVE_WHITESPACE", "TEXT", "Whitespace removed", "TEXT");
}

export function removeLineBreaks(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "remove line breaks");
  }
  const out = input.replace(/\r?\n/g, " ").trim();
  return okResult(input, out, "REMOVE_LINE_BREAKS", "TEXT", "Line breaks removed", "TEXT");
}

export function removePunctuation(input: string): TransformationResult {
  if (!input.trim()) {
    return emptyFail(input, "remove punctuation");
  }
  const out = input.replace(/[\p{P}\p{S}]+/gu, "");
  return okResult(input, out, "REMOVE_PUNCTUATION", "TEXT", "Punctuation removed", "TEXT");
}

/** First line of input is the substring; remaining lines are filtered out when they contain it. */
export function removeLinesContaining(input: string): TransformationResult {
  const [needle, ...rest] = input.split("\n");
  if (!needle || needle.trim() === "" || rest.length === 0) {
    return failResult(input, "Put the word to remove on the first line, then your text below.", "TEXT", "TEXT");
  }
  const out = rest.filter((line) => !line.includes(needle.trim())).join("\n");
  return okResult(input, out, "REMOVE_LINES_CONTAINING", "TEXT", "Matching lines removed", "TEXT");
}

export function textRepeater(input: string): TransformationResult {
  const tokens = input.trim().split(/\s+/);
  const maybeCount = Number(tokens[0]);
  const count = Number.isFinite(maybeCount) && maybeCount > 0 ? Math.min(Math.floor(maybeCount), 1000) : 3;
  const text = Number.isFinite(maybeCount) && tokens.length > 1 ? tokens.slice(1).join(" ") : input;
  if (!text.trim()) {
    return emptyFail(input, "repeat");
  }
  const out = new Array(count).fill(text).join("\n");
  return okResult(input, out, "TEXT_REPEATER", "TEXT", "Text repeated", "TEXT");
}

/** Repeat every word N times. Leading number = N (default 3). */
export function wordRepeater(input: string): TransformationResult {
  const tokens = input.trim().split(/\s+/);
  const maybeCount = Number(tokens[0]);
  const count = Number.isFinite(maybeCount) && maybeCount > 0 ? Math.min(Math.floor(maybeCount), 1000) : 3;
  const words = Number.isFinite(maybeCount) && tokens.length > 1 ? tokens.slice(1) : tokens;
  if (words.length === 0) {
    return emptyFail(input, "repeat");
  }
  const out = words.map((word) => new Array(count).fill(word).join(" ")).join(" ");
  return okResult(input, out, "WORD_REPEATER", "TEXT", "Words repeated", "TEXT");
}

export function stringBuilder(input: string): TransformationResult {
  const [separator, ...items] = input.split("\n");
  if (items.length === 0) {
    return failResult(input, "Put the separator on the first line, then the strings to join below.", "TEXT", "TEXT");
  }
  const out = items.map((line) => line.trimEnd()).join(separator);
  return okResult(input, out, "STRING_BUILDER", "TEXT", "String built from lines", "TEXT");
}

export function delimitedTextExtractor(input: string): TransformationResult {
  const [startLine, endLine, ...rest] = input.split("\n");
  if (!startLine || !endLine || rest.length === 0) {
    return failResult(
      input,
      "Put the start delimiter, end delimiter, then your text below — one per line.",
      "TEXT",
      "TEXT",
    );
  }
  const content = rest.join("\n");
  const matches: string[] = [];
  let pos = 0;
  while (pos < content.length) {
    const startIndex = content.indexOf(startLine, pos);
    if (startIndex === -1) {
      break;
    }
    const afterStart = startIndex + startLine.length;
    const endIndex = content.indexOf(endLine, afterStart);
    if (endIndex === -1) {
      break;
    }
    matches.push(content.slice(afterStart, endIndex));
    pos = endIndex + endLine.length;
  }
  if (matches.length === 0) {
    return failResult(input, "No text was found between the given delimiters.", "TEXT", "TEXT");
  }
  return okResult(input, matches.join("\n"), "DELIMITED_TEXT_EXTRACTOR", "TEXT", "Delimited text extracted", "TEXT");
}