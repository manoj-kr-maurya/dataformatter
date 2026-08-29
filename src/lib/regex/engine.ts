/**
 * Regex playground — validate a pattern, test it against sample text using the
 * JS engine, and report every match with position and capture groups.
 * Fully client-side; uses exactly the RegExp the browser provides.
 */

export interface RegexMatch {
  value: string;
  index: number;
  groups: string[];
  named: Record<string, string>;
}

export interface RegexTest {
  valid: boolean;
  message: string;
  global: boolean;
  matches: RegexMatch[];
  matchCount: number;
  /** Per-line breakdown (lines only — the UI chooses whether to feed lines). */
  lines: { line: number; text: string; count: number }[];
}

export type RegexTestMode = "text" | "lines";

const FLAG_ORDER = ["d", "g", "i", "m", "s", "u", "v", "y"];

export function normalizeFlags(flags: string): string {
  const set = new Set(flags.split(""));
  return FLAG_ORDER.filter((f) => set.has(f)).join("");
}

export function testRegex(pattern: string, flags: string, text: string, mode: RegexTestMode = "text"): RegexTest {
  let re: RegExp;
  try {
    re = new RegExp(pattern, normalizeFlags(flags));
  } catch (error) {
    return { valid: false, message: error instanceof Error ? error.message : "Invalid pattern.", global: false, matches: [], matchCount: 0, lines: [] };
  }

  const global = re.global;
  const reForScan = global
    ? re
    : new RegExp(re.source, normalizeFlags(flags).replace("g", "").replace("y", ""));

  const matches: RegexMatch[] = [];
  const scanLimit = 5000;
  const source = mode === "lines" ? text : text;
  let guard = 0;
  let m: RegExpExecArray | null;
  while ((m = reForScan.exec(source)) !== null && guard < scanLimit) {
    matches.push({
      value: m[0],
      index: m.index,
      groups: m.slice(1).map((g) => g ?? ""),
      named: m.groups ?? {},
    });
    guard += 1;
    if (!reForScan.global) break;
    if (m[0].length === 0) reForScan.lastIndex += 1;
  }

  const lines = mode === "lines"
    ? text.split(/\r?\n/).map((line, i) => {
        const local = new RegExp(re.source, normalizeFlags(flags));
        const hits = line.match(local);
        return { line: i + 1, text: line, count: hits ? hits.length : 0 };
      })
    : [];

  return {
    valid: true,
    message: `Found ${matches.length.toLocaleString()} match${matches.length === 1 ? "" : "es"}.`,
    global,
    matches,
    matchCount: matches.length,
    lines,
  };
}