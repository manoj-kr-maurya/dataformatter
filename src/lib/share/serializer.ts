import { SHARE_LEGACY_SCHEMA_VERSION, SHARE_SCHEMA_VERSION } from "@/lib/share/types";
import type { SharePayload } from "@/lib/share/types";
import { isNonDeterministicTool, AUTO_DETECT } from "@/lib/tools";
import { encodeUtf8 } from "@/lib/share/codec";
import type { ToolMode } from "@/types/tools";

/**
 * Whether a share payload must carry the output verbatim. Returns false for
 * deterministic tools (output can be regenerated from the input), true for
 * random generators whose output cannot be recomputed.
 */
export function isStoredOutputRequired(tool: string): boolean {
  return isNonDeterministicTool(tool);
}

const TOOL_CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Stable, append-only order of tool ids for the compact `t` code. The index of
 * a tool in this table is encoded as base62 (1-2 chars) in the share payload.
 * New tools MUST be appended at the end — inserting in the middle breaks every
 * already-shared link.
 */
export const SHARE_TOOL_CODES: readonly string[] = [
  AUTO_DETECT,
  "JSON_FORMAT", "JSON_MINIFY", "JSON_VALIDATE", "SORT_KEYS", "JSON_ENCODE", "JSON_DECODE",
  "BASE32_ENCODE", "BASE32_DECODE", "BASE58_ENCODE", "BASE58_DECODE", "BASE64_ENCODE", "BASE64_DECODE",
  "BASE64_TO_JSON", "JSON_TO_BASE64", "IMAGE_TO_BASE64", "BASE64_TO_IMAGE", "PNG_TO_BASE64", "JPG_TO_BASE64",
  "XML_TO_BASE64", "YAML_TO_BASE64", "BASE64_TO_XML", "BASE64_TO_YAML", "CSV_TO_BASE64", "BASE64_TO_CSV",
  "TSV_TO_BASE64", "BASE64_TO_TSV", "BINARY_TO_BASE64", "BASE64_TO_BINARY", "HEX_TO_BASE64", "BASE64_TO_HEX",
  "OCTAL_TO_BASE64", "JSON_TO_JAVA", "JSON_TO_XML", "JSON_TO_YAML", "JSON_TO_CSV", "JSON_TO_TSV",
  "JSON_TO_TEXT", "JSON_TO_EXCEL", "JSON_TO_HTML", "JWT_DECODE", "URL_ENCODE", "URL_DECODE",
  "JSON_URL_ENCODE", "JSON_URL_DECODE", "HTML_ENCODE", "HTML_DECODE", "XML_URL_ENCODE", "XML_URL_DECODE",
  "UTF8_CONVERTER", "UTF8_DECODE", "HEX_TO_UTF8", "URL_PARSE", "JSON_PARSE", "XML_PARSE", "YAML_PARSE",
  "RANDOM_IP", "RANDOM_TIME", "RANDOM_UUID", "RANDOM_JSON", "RANDOM_XML", "RANDOM_REGEX", "RANDOM_CSV",
  "RANDOM_NUMBER", "RANDOM_INTEGER", "RANDOM_PRIME", "RANDOM_DATE", "RANDOM_BITMAP", "RANDOM_NAME_PICKER",
  "SHUFFLE_LINES", "RANDOM_MAC", "RANDOM_HEX", "RANDOM_TSV", "RANDOM_STRING", "RANDOM_FRACTION",
  "RANDOM_INTEGER_RANGE", "RANDOM_BINARY", "RANDOM_BYTE", "RANDOM_DECIMAL", "RANDOM_ALPHANUMERIC",
  "UPSIDE_DOWN_TEXT", "RANDOM_WORD", "NTLM_HASH", "PASSWORD_GENERATOR", "STRING_BUILDER", "NUMBER_TO_WORDS",
  "WORDS_TO_NUMBER", "WORD_COUNTER", "WORD_REPEATER", "REVERSE_STRING", "STRING_TO_HEX", "HEX_TO_STRING",
  "STRING_TO_BINARY", "BINARY_TO_STRING", "CASE_CONVERTER", "DELIMITED_TEXT_EXTRACTOR", "REMOVE_ACCENTS",
  "REMOVE_DUPLICATE_LINES", "REMOVE_EMPTY_LINES", "REMOVE_EXTRA_SPACES", "REMOVE_WHITESPACE",
  "REMOVE_LINE_BREAKS", "REMOVE_LINES_CONTAINING", "SORT_TEXT_LINES", "WORD_SORTER", "WORD_FREQUENCY_COUNTER",
  "TEXT_REPEATER", "REMOVE_PUNCTUATION", "MD5_HASH", "SHA1_HASH", "SHA224_HASH", "SHA256_HASH",
  "SHA384_HASH", "SHA512_HASH", "SHA512_224_HASH", "SHA512_256_HASH", "SHA3_224_HASH", "SHA3_256_HASH",
  "SHA3_384_HASH", "SHA3_512_HASH",
];

/** Encode a tool index as the shortest base62 code ("0" for AUTO_DETECT). */
export function encodeToolCode(tool: string): string {
  const index = SHARE_TOOL_CODES.indexOf(tool);
  if (index === -1) {
    throw new Error(`Unknown tool for share link: ${tool}`);
  }
  if (index === 0) {
    return "0";
  }
  let code = "";
  let value = index;
  while (value > 0) {
    code = TOOL_CODE_ALPHABET[value % 62] + code;
    value = Math.floor(value / 62);
  }
  return code;
}

/** Decode a v3 `t` value (base62 index code or, for robustness, a full id). */
export function decodeToolCode(value: string): string {
  if (/^[0-9A-Za-z]{1,2}$/.test(value)) {
    let index = 0;
    for (let i = 0; i < value.length; i++) {
      index = index * 62 + TOOL_CODE_ALPHABET.indexOf(value[i]);
    }
    const tool = SHARE_TOOL_CODES[index];
    if (tool !== undefined) {
      return tool;
    }
  }
  return value;
}

/**
 * The on-wire (compact) shape (v3). Defaults are omitted so links stay short:
 *   m — view split (2); omitted = Single
 *   t — tool id, encoded as a short base62 index code
 *   a — "0" when Auto Detect is OFF (omitted when the default ON)
 *   w — "1" when word-wrap is ON (omitted when the default OFF)
 *   i — raw input
 *   o — generated output, only for non-deterministic tools
 *   d — "i" when a Single view was showing the input (omitted for "output")
 */
export interface CompactSharePayload {
  v: typeof SHARE_SCHEMA_VERSION;
  m?: 2;
  t: string;
  a?: 0;
  w?: 1;
  i: string;
  o?: string;
  d?: "i";
}

/** Serialize the canonical payload to its compact (short) JSON form. */
export function serializeSharePayload(payload: SharePayload): string {
  const compact: CompactSharePayload = {
    v: SHARE_SCHEMA_VERSION,
    t: encodeToolCode(payload.tool),
    i: payload.input,
  };
  if (payload.mode === "split") {
    compact.m = 2;
  }
  if (!payload.autoDetect) {
    compact.a = 0;
  }
  if (payload.wordWrap) {
    compact.w = 1;
  }
  if (payload.output !== undefined) {
    compact.o = payload.output;
  }
  if (payload.display === "input") {
    compact.d = "i";
  }
  return JSON.stringify(compact);
}

/** Size in bytes of the serialized payload (pre-compression). */
export function serializedShareBytes(payload: SharePayload): number {
  return encodeUtf8(serializeSharePayload(payload)).byteLength;
}

/**
 * Parse + validate a decoded payload of any supported schema version into the
 * canonical `SharePayload` shape the UI consumes. Returns null when the value
 * is not a valid share payload.
 */
export function normalizeSharePayload(value: unknown): SharePayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const parsed = value as Record<string, unknown>;

  if (parsed.v === SHARE_SCHEMA_VERSION) {
    return normalizeCompactV3(parsed);
  }
  if (parsed.v === 2) {
    return normalizeCompactV2(parsed);
  }
  if (parsed.v === SHARE_LEGACY_SCHEMA_VERSION) {
    return normalizeLegacyV1(parsed);
  }
  return null;
}

function normalizeCompactV3(parsed: Record<string, unknown>): SharePayload | null {
  if (typeof parsed.t !== "string" || parsed.t.length === 0) {
    return null;
  }
  if (typeof parsed.i !== "string") {
    return null;
  }
  let mode: SharePayload["mode"] = "single";
  if (parsed.m !== undefined) {
    if (parsed.m !== 2) return null;
    mode = "split";
  }
  const tool = decodeToolCode(parsed.t) as ToolMode;

  let autoDetect = true;
  if (parsed.a !== undefined) {
    if (parsed.a !== 0) return null;
    autoDetect = false;
  }
  let wordWrap = false;
  if (parsed.w !== undefined) {
    if (parsed.w !== 1) return null;
    wordWrap = true;
  }

  let display: SharePayload["display"] = "output";
  if (parsed.d !== undefined) {
    if (parsed.d !== "i") return null;
    display = "input";
  }

  const output = parsed.o;
  if (output !== undefined && typeof output !== "string") {
    return null;
  }
  if (isStoredOutputRequired(tool) && typeof output !== "string") {
    return null;
  }

  return {
    v: SHARE_SCHEMA_VERSION,
    mode,
    tool,
    autoDetect,
    wordWrap,
    input: parsed.i,
    output,
    display,
  };
}

function normalizeCompactV2(parsed: Record<string, unknown>): SharePayload | null {
  if (typeof parsed.t !== "string" || parsed.t.length === 0) {
    return null;
  }
  if (typeof parsed.i !== "string") {
    return null;
  }
  if (parsed.m !== 1 && parsed.m !== 2) {
    return null;
  }
  const mode = parsed.m === 1 ? "single" : "split";

  let autoDetect = true;
  if (parsed.a !== undefined) {
    if (parsed.a !== 0) return null;
    autoDetect = false;
  }
  let wordWrap = false;
  if (parsed.w !== undefined) {
    if (parsed.w !== 1) return null;
    wordWrap = true;
  }

  let display: SharePayload["display"] = "output";
  if (parsed.d !== undefined) {
    if (parsed.d !== "i") return null;
    display = "input";
  }

  const output = parsed.o;
  if (output !== undefined && typeof output !== "string") {
    return null;
  }
  if (isStoredOutputRequired(parsed.t) && typeof output !== "string") {
    return null;
  }

  return {
    v: 2,
    mode,
    tool: parsed.t as ToolMode,
    autoDetect,
    wordWrap,
    input: parsed.i,
    output,
    display,
  };
}

function normalizeLegacyV1(parsed: Record<string, unknown>): SharePayload | null {
  const { mode, tool, autoDetect, wordWrap, input, output, display } = parsed;
  if (mode !== "single" && mode !== "split") return null;
  if (typeof tool !== "string" || tool.length === 0) return null;
  if (typeof autoDetect !== "boolean") return null;
  if (typeof wordWrap !== "boolean") return null;
  if (typeof input !== "string") return null;
  if (display !== "input" && display !== "output") return null;
  if (output !== undefined && typeof output !== "string") return null;
  if (isStoredOutputRequired(tool) && typeof output !== "string") return null;

  return {
    v: SHARE_LEGACY_SCHEMA_VERSION,
    mode,
    tool: tool as ToolMode,
    autoDetect,
    wordWrap,
    input,
    output,
    display,
  };
}

/**
 * Validate a canonical (app-facing) payload. Returns a human-readable reason
 * on failure, or null when structurally sound. Used mainly by tests.
 */
export function validateSharePayload(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return "Payload is not an object";
  }
  const payload = value as Partial<SharePayload>;

  if (payload.mode !== "single" && payload.mode !== "split") {
    return "Invalid mode";
  }
  if (payload.display !== "input" && payload.display !== "output") {
    return "Invalid display";
  }
  if (typeof payload.tool !== "string" || payload.tool.length === 0) {
    return "Invalid tool";
  }
  if (typeof payload.autoDetect !== "boolean") {
    return "Invalid autoDetect";
  }
  if (typeof payload.wordWrap !== "boolean") {
    return "Invalid wordWrap";
  }
  if (typeof payload.input !== "string") {
    return "Invalid input";
  }
  if (payload.output !== undefined && typeof payload.output !== "string") {
    return "Invalid output";
  }
  if (payload.tool !== undefined && isStoredOutputRequired(payload.tool) && typeof payload.output !== "string") {
    return "Missing output for non-deterministic tool";
  }

  return null;
}