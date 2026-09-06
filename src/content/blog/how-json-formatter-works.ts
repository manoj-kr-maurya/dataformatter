import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "how-json-formatter-works",
  title: "How the JSON Formatter Validates and Pretty-Prints JSON",
  description:
    "Under the hood of DataFormatter's JSON Formatter: JSON.parse for strict RFC 8259 validation, precise error line and column extraction from the native parser message, and clean two-space reserialization.",
  h1: "How the JSON Formatter Validates and Pretty-Prints JSON",
  category: "Data Formats",
  excerpt:
    "A JSON formatter is really two passes: a strict parse that rejects invalid JSON, then a reserialization with two-space indentation. Here's exactly what happens between paste and output.",
  geo: {
    what: "DataFormatter's JSON Formatter is a browser-only tool that validates JSON with a native JSON.parse and then reserializes the parsed value with clean two-space indentation.",
    who: "Developers who paste minified or pasted-down API responses, configs and fixtures and need them readable before editing or debugging.",
    different: "Error positions are derived from the native parser's message and turned into 1-based line and column numbers, and everything runs locally — nothing you paste is uploaded.",
  },
  publishedAt: "2026-08-04",
  relatedToolPaths: ["/json-formatter", "/json-validator", "/json-minifier", "/json-diff"],
  relatedSlugs: ["how-json-diff-works"],
  blocks: [
    {
      type: "p",
      text: "A JSON formatter looks like it just adds newlines and spaces, but the interesting part happens before any indentation is applied. The pipeline is only three steps: trim the input, parse it, and if the parse succeeds reserialize the parsed value. Parse failure never reaches the formatting step — you get an error with a precise location instead.",
    },
    {
      type: "h2",
      text: "Two passes under the hood",
    },
    {
      type: "p",
      text: "The first pass is validation, and it uses the browser's own JSON.parse. Because JSON.parse implements the JSON grammar (RFC 8259), it is deliberately strict: keys must be double-quoted, strings must use double quotes, there are no comments, no single quotes, no trailing commas, and bare words like NaN, Infinity or undefined are rejected. The formatter never tries to 'fix' the input — invalid JSON fails loudly rather than being silently interpreted.",
    },
    {
      type: "code",
      label: "Rejected by the strict parser",
      code: `{                      // ← no comments allowed
  "valid": true,
  "trailing": 1,          // ← no trailing commas
  'singles': "no",        // ← single quotes are not strings
}`,
    },
    {
      type: "h2",
      text: "Pinpointing the exact error",
    },
    {
      type: "p",
      text: "When JSON.parse throws, its message tells you where parsing stopped — for example 'Unexpected token } in JSON at position 14'. The formatter reads that message with a small parser of its own: it matches /position (\\d+)/ to get the character offset, then slices the input up to that offset and counts newlines to convert it into a 1-based line number and a column. For single-line inputs it also understands the 'line X column Y' form directly. The noisy 'in JSON at position N' suffix is stripped from the message so you see the actual problem.",
    },
    {
      type: "example",
      inputLabel: "Broken JSON",
      input: `{"name": "first",
 "age": }`,
      outputLabel: "Reported error",
      output: `Unexpected token } in JSON at position 17
→ line 2, column 9`,
    },
    {
      type: "h2",
      text: "The format pass",
    },
    {
      type: "p",
      text: "Once the input is valid, formatting is a single call: JSON.stringify(parsedValue, null, 2). The third argument (2) is the indentation level — two spaces per nesting level, which is the web convention you see in API docs and most linters. Because the pretty output is produced from the parsed value rather than by editing the raw string, the two spaces are applied consistently even after numbers, big strings or deeply nested arrays.",
    },
    {
      type: "h2",
      text: "What is and is not valid JSON",
    },
    {
      type: "ul",
      items: [
        "Object keys must be quoted strings: { \"ok\": true }, never { ok: true }.",
        "Strings use double quotes only; escapes like \\n and \\uXXXX work.",
        "No trailing commas, no comments, and no control characters inside strings.",
        "Numbers can be negative, exponential and fractional, but leading zeros are invalid.",
        "A document may be any single JSON value: object, array, string, number, true, false or null.",
      ],
    },
    {
      type: "h2",
      text: "Format, validate or minify?",
    },
    {
      type: "table",
      caption: "Which DataFormatter JSON tool matches the job",
      headers: ["Tool", "What it does", "Pick it when"],
      rows: [
        ["JSON Formatter", "Validates and pretty-prints with two-space indentation", "You want readable output from minified or pasted-down JSON"],
        ["JSON Validator", "Parses and reports the exact line and column of errors", "Only syntax matters — you want a definitive error location"],
        ["JSON Minifier", "Removes whitespace to collapse JSON to one line", "Payloads must shrink for storage, logs or transfer limits"],
      ],
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Paste any JSON into the JSON Formatter and the position of the first error, if any, is reported with line and column. Formatting, validating and minifying all run in your browser.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is it safe to paste production JSON?",
          a: "Yes — parsing and formatting run entirely in your browser. Nothing you paste is uploaded to a server.",
        },
        {
          q: "Does the formatter accept comments or trailing commas?",
          a: "No. Input must be strict RFC 8259 JSON. Comments, single quotes, bare identifiers and trailing commas are reported as syntax errors with a line and column.",
        },
        {
          q: "Can the formatter minify JSON too?",
          a: "No — that is the JSON Minifier tool. The formatter always reserializes with two-space indentation.",
        },
      ],
    },
  ],
};

export default article;