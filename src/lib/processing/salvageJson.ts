import { parseJson } from "@/lib/json/validate";

export interface JsonDocument {
  /** The document text (trimmed). */
  text: string;
  /** The parsed document value. */
  value: unknown;
}

export interface SalvageResult {
  /** True when a complete JSON document was recovered as a leading fragment. */
  found: boolean;
  /** The recovered document text. */
  jsonText?: string;
  /** The recovered, parsed value. */
  value?: unknown;
  /** The portion of input after the document that was not valid JSON. */
  trailing?: string;
}

/**
 * Split an input into all complete top-level JSON documents, in order, that
 * parse successfully. Walks the input tracking bracket depth and string state
 * so braces inside string values do not confuse the scanner. Runs only on
 * inputs that are not themselves a single valid JSON document.
 *
 * Returns an array of every document found; a document is counted when a
 * closed top-level value parses as JSON and is separated from the previous one
 * by only whitespace.
 */
export function splitJsonDocuments(input: string): JsonDocument[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  // If the whole thing already parses, treat it as a single document so callers
  // don't need to re-check. Callers guard this path before calling here.
  const whole = parseJson(trimmed);
  if (whole.ok) {
    return [{ text: trimmed, value: whole.value }];
  }

  const docs: JsonDocument[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let segmentStart = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      if (depth === 0) {
        segmentStart = i;
      }
      depth++;
    } else if (char === "}" || char === "]") {
      depth--;
      if (depth === 0) {
        const candidate = trimmed.slice(segmentStart, i + 1);
        const parsed = parseJson(candidate);
        if (parsed.ok) {
          docs.push({ text: candidate, value: parsed.value });
          // Skip past the document; whitespace between docs is skipped by the
          // next segmentStart assignment on the following opening bracket.
        }
      }
    }
  }

  return docs;
}

/**
 * Recover a single complete JSON document from the start of an input that is
 * not itself strictly valid JSON, e.g. `{"a":1} trailing` or `[1,2] extra text`.
 *
 * Returns `found: false` when no leading JSON document can be recovered
 * (e.g. an unterminated object with no closing brace). When more than one
 * document is present, only the first is considered a "salvaged" leading
 * fragment; callers that want to preserve all documents should use
 * `splitJsonDocuments` instead.
 */
export function salvageJsonFragment(input: string): SalvageResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { found: false };
  }

  const whole = parseJson(trimmed);
  if (whole.ok) {
    return { found: false };
  }

  const docs = splitJsonDocuments(trimmed);
  if (docs.length === 0) {
    return { found: false };
  }

  const first = docs[0];
  const trailing = trimmed.slice(trimmed.indexOf(first.text) + first.text.length).trim();
  return {
    found: true,
    jsonText: first.text,
    value: first.value,
    trailing: trailing.length > 0 ? trailing : undefined,
  };
}
