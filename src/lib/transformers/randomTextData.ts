import { failResult, okResult } from "@/lib/transformers/builders";
import { parseCount, parseDims } from "@/lib/random/params";
import { randomRegexLines } from "@/lib/random/regex";
import { randomAlphanumeric, randomChoice, randomLetters, shuffle } from "@/lib/random/random";
import type { TransformationResult } from "@/types/transformation";

export function randomStringGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomLetters(12));
  }
  return okResult(input, parts.join("\n"), "RANDOM_STRING", "TEXT", "Random strings generated", "TEXT");
}

export function randomAlphanumericGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomAlphanumeric(16));
  }
  return okResult(
    input,
    parts.join("\n"),
    "RANDOM_ALPHANUMERIC",
    "TEXT",
    "Random alphanumeric strings generated",
    "TEXT",
  );
}

export function randomRegexGenerator(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "Enter a regex such as [a-z]{3}-\\d{2}.", "TEXT", "TEXT");
  }
  let output: string;
  try {
    output = randomRegexLines(trimmed, 4);
  } catch (error) {
    return failResult(
      input,
      `Invalid regex: ${error instanceof Error ? error.message : "unsupported pattern"}.`,
      "TEXT",
      "TEXT",
    );
  }
  return okResult(input, output, "RANDOM_REGEX", "TEXT", "Random data generated from regex", "TEXT");
}

const RANDOM_WORDS = [
  "alpha",
  "beta",
  "gamma",
  "delta",
  "echo",
  "foxtrot",
  "hotel",
  "india",
  "juliet",
  "kilo",
  "lima",
  "mike",
  "november",
  "oscar",
];

function randomCell(): string {
  return randomChoice(RANDOM_WORDS) + randomChoice("1234567890");
}

export function randomCsvGenerator(input: string): TransformationResult {
  const [rows, cols] = parseDims(input, 5, 4);
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    const cells: string[] = [];
    for (let c = 0; c < cols; c++) {
      cells.push(randomCell());
    }
    lines.push(cells.join(","));
  }
  return okResult(input, lines.join("\n"), "RANDOM_CSV", "TEXT", "Random CSV generated", "TEXT");
}

export function randomTsvGenerator(input: string): TransformationResult {
  const [rows, cols] = parseDims(input, 5, 4);
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    const cells: string[] = [];
    for (let c = 0; c < cols; c++) {
      cells.push(randomCell());
    }
    lines.push(cells.join("\t"));
  }
  return okResult(input, lines.join("\n"), "RANDOM_TSV", "TEXT", "Random TSV generated", "TEXT");
}

function randomJsonTree(depth: number): unknown {
  const keys = ["name", "id", "active", "score", "tags", "meta"];
  const obj: Record<string, unknown> = {};
  keys.forEach((key) => {
    if (depth > 0 && Math.random() > 0.6) {
      obj[key] = randomJsonTree(depth - 1);
    } else {
      const choices: unknown[] = [
        randomLetters(6),
        randomInt(0, 1000),
        Math.random() > 0.5,
        null,
        randomAlphanumeric(8),
      ];
      obj[key] = choices[Math.floor(Math.random() * choices.length)];
    }
  });
  return obj;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomJsonGenerator(input: string): TransformationResult {
  const count = parseCount(input, 1);
  const parts: unknown[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomJsonTree(2));
  }
  return okResult(
    input,
    JSON.stringify(parts, null, 2),
    "RANDOM_JSON",
    "JSON",
    "Random JSON generated",
    "TEXT",
  );
}

export function randomXmlGenerator(input: string): TransformationResult {
  const count = parseCount(input, 3);
  const elements: string[] = [];
  for (let i = 0; i < count; i++) {
    elements.push(`  <item id="${randomAlphanumeric(6)}">${randomLetters(10)}</item>`);
  }
  const xml = `<root>\n${elements.join("\n")}\n</root>`;
  return okResult(input, xml, "RANDOM_XML", "TEXT", "Random XML generated", "TEXT");
}

export function randomBitmapGenerator(input: string): TransformationResult {
  const [width, height] = parseDims(input, 8, 8);
  const lines: string[] = [];
  for (let r = 0; r < height; r++) {
    let row = "";
    for (let c = 0; c < width; c++) {
      row += Math.random() > 0.5 ? "1" : "0";
    }
    lines.push(row);
  }
  return okResult(input, lines.join("\n"), "RANDOM_BITMAP", "TEXT", "Random bitmap generated", "TEXT");
}

export function randomNamePicker(input: string): TransformationResult {
  const names = input
    .split(/[\n,;]+/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
  if (names.length === 0) {
    return failResult(input, "Enter some names separated by commas or new lines.", "TEXT", "TEXT");
  }
  return okResult(input, randomChoice(names), "RANDOM_NAME_PICKER", "TEXT", "Random name picked", "TEXT");
}

export function shuffleLines(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There are no lines to shuffle.", "TEXT", "TEXT");
  }
  const lines = input.split("\n");
  return okResult(input, shuffle(lines).join("\n"), "SHUFFLE_LINES", "TEXT", "Lines shuffled", "TEXT");
}

// keep the import used when TSC tree-shakes unused exports
export const _randomHelpers = { shuffle, randomChoice } as const;