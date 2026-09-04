import { parseJson } from "@/lib/json/validate";
import { detectBase64 } from "@/lib/detection/detectBase64";
import { parseJwt } from "@/lib/jwt/decode";

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

export interface RepairResult {
  /** True when a missing trailing bracket was appended and the result parses. */
  repaired: boolean;
  /** The repaired, parsed value. */
  value?: unknown;
}

/**
 * Attempt to repair an unterminated JSON value by appending the closing
 * brackets needed to balance the top-level openers, then parsing. This handles
 * common incomplete pastes like `{"a":"SGVsbG8="` → `{"a":"SGVsbG8="}`.
 *
 * Only appends closers at the end; it does not rewrite or reorder content.
 * Returns `repaired: false` when the result still does not parse.
 */
export function repairJsonFragment(input: string): RepairResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { repaired: false };
  }

  const stack: Array<"{" | "["> = [];
  let inString = false;
  let escaped = false;

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
      stack.push(char as "{" | "[");
    } else if (char === "}" || char === "]") {
      if (stack.length > 0) {
        stack.pop();
      }
    }
  }

  if (stack.length === 0) {
    return { repaired: false };
  }

  const closers = stack
    .slice()
    .reverse()
    .map((opener) => (opener === "{" ? "}" : "]"))
    .join("");

  const candidate = trimmed + closers;
  const parsed = parseJson(candidate);
  if (parsed.ok) {
    return { repaired: true, value: parsed.value };
  }

  return { repaired: false };
}

export interface FragmentDecodeResult {
  /** True when at least one complete Base64 (or JWT) value was decoded. */
  decoded: boolean;
  /** A best-effort, clearly-labeled reconstruction with decoded values. */
  output: string;
}

/**
 * Fallback (step 2) when an incomplete JSON fragment cannot be repaired into
 * valid JSON: locate the intact Base64/JWT string values it contains and decode
 * just those, returning a clearly-labeled partial reconstruction. Structure is
 * approximated only by the presence of complete, decodable values; anything
 * that is not confidently decodable is left verbatim.
 */
export function decodeIntactBase64InFragment(input: string): FragmentDecodeResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { decoded: false, output: input };
  }

  let changed = false;
  const replaced = trimmed.replace(/"([A-Za-z0-9+/=_-]+)"/g, (quoted, inner: string) => {
    const detected = detectBase64(inner);
    if (detected.ok && detected.decoded !== undefined) {
      changed = true;
      return JSON.stringify(detected.decoded);
    }
    const jwt = parseJwt(inner);
    if (jwt.ok) {
      changed = true;
      return JSON.stringify({
        header: jwt.value.header,
        payload: jwt.value.payload,
        signature: jwt.value.signature,
      });
    }
    return quoted;
  });

  return { decoded: changed, output: changed ? replaced : trimmed };
}
