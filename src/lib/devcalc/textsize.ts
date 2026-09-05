/**
 * Text / JSON size toolkit. Counts grapheme clusters, code points, UTF-8
 * bytes and UTF-16 code units independently — never conflates them.
 */

export interface TextBreakdown {
  characters: number;
  codePoints: number;
  utf8Bytes: number;
  utf16Units: number;
  lines: number;
  words: number;
  digits: number;
  whitespace: number;
  special: number;
}

export function textBreakdown(text: string): TextBreakdown {
  const codePoints = Array.from(text);
  let characters = codePoints.length;
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    try {
      characters = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)).length;
    } catch {
      /* fall back to code-point count */
    }
  }
  const utf8Bytes = new TextEncoder().encode(text).length;
  const lines = text === "" ? 0 : text.split(/\r\n|\r|\n/).length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const digits = (text.match(/[0-9]/g) ?? []).length;
  const whitespace = (text.match(/\s/g) ?? []).length;
  const special = codePoints.filter((c) => !/\p{L}|\p{N}|\s/u.test(c)).length;
  return { characters, codePoints: codePoints.length, utf8Bytes, utf16Units: text.length, lines, words, digits, whitespace, special };
}

export type JsonSizeResult =
  | { valid: true; pretty: string; minified: string; prettyBytes: number; minifiedBytes: number; savingsBytes: number; chars: number }
  | { valid: false; error: string };

export function analyzeJson(text: string): JsonSizeResult {
  if (text.trim() === "") return { valid: false, error: "Paste some JSON to size it." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    return { valid: false, error: `Invalid JSON — ${cause instanceof Error ? cause.message : "syntax error"}` };
  }
  const pretty = JSON.stringify(parsed, null, 2);
  const minified = JSON.stringify(parsed);
  const enc = new TextEncoder();
  const prettyBytes = enc.encode(pretty).length;
  const minifiedBytes = enc.encode(minified).length;
  return {
    valid: true,
    pretty,
    minified,
    prettyBytes,
    minifiedBytes,
    savingsBytes: Math.max(0, prettyBytes - minifiedBytes),
    chars: pretty.length,
  };
}