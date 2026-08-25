import { encodeBase64Url, decodeBase64Url } from "@/lib/share/base64url";
import { decodeUtf8, encodeUtf8, shareCodecById } from "@/lib/share/codec";
import type { CompilerLanguage } from "@/lib/compiler/examples";

/**
 * Share links for the compiler playground. Deliberately separate from
 * the workspace `#/share/` payload (whose compact tool-code table is
 * append-only and tool-specific) — compiler links use their own hash prefix:
 *
 *   #/dart/<codecId>/<base64url(JSON)>
 *
 * where JSON is `{ c: string, s?: string, l?: "js" | "ts" }` (code, optional
 * stdin, optional language). The legacy `#/dart/` prefix stays so existing
 * Dart links keep working; Dart shares omit `l`, JS/TS ones set it.
 */

export const COMPILER_HASH_PREFIX = "#/dart/";

export const COMPILER_SHARE_LIMIT_CHARS = 32_000;

export interface CompilerSharePayload {
  code: string;
  stdin: string;
  /** Defaults to `"dart"`; only JS/TS links carry the field on the wire. */
  language?: CompilerLanguage;
}

export interface CompilerShareLinkResult {
  url: string;
  encodedChars: number;
  codecId: string;
  tooLarge: boolean;
}

function pageBaseUrl(): string {
  if (typeof window !== "undefined" && typeof window.location?.href === "string") {
    const href = window.location.href;
    const hashIndex = href.indexOf("#");
    return hashIndex === -1 ? href : href.slice(0, hashIndex);
  }
  return "";
}

export interface ExtractedCompilerHash {
  found: boolean;
  codecId?: string;
  encoded?: string;
}

/** Pull the codec id + encoded payload out of a URL or bare hash. */
export function extractCompilerShare(url: string): ExtractedCompilerHash {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex === -1 ? url : url.slice(hashIndex);
  if (!hash.startsWith(COMPILER_HASH_PREFIX)) {
    return { found: false };
  }
  const rest = hash.slice(COMPILER_HASH_PREFIX.length);
  const slash = rest.indexOf("/");
  if (slash === -1) {
    return { found: false };
  }
  const codecId = rest.slice(0, slash);
  const encoded = rest.slice(slash + 1);
  if (!codecId || !encoded) {
    return { found: false };
  }
  return { found: true, codecId, encoded };
}

/**
 * Build a shareable URL carrying the program + stdin. Compression is chosen
 * the same way as workspace shares: whichever of raw / deflate encodes shorter.
 */
export async function createCompilerShareLink(
  payload: CompilerSharePayload,
): Promise<CompilerShareLinkResult> {
  const json = JSON.stringify(
    payload.language && payload.language !== "dart"
      ? { c: payload.code, s: payload.stdin, l: payload.language }
      : { c: payload.code, s: payload.stdin },
  );
  const source = encodeUtf8(json);

  let codecId = "r";
  let encoded = encodeBase64Url(source);

  try {
    const { deflateRawAvailable, deflateRawCodec, deflateAvailable, deflateCodec } =
      await import("@/lib/share/codec");
    if (deflateRawAvailable()) {
      const candidate = encodeBase64Url(await deflateRawCodec.compress(source));
      if (candidate.length < encoded.length) {
        codecId = deflateRawCodec.id;
        encoded = candidate;
      }
    } else if (deflateAvailable()) {
      const candidate = encodeBase64Url(await deflateCodec.compress(source));
      if (candidate.length < encoded.length) {
        codecId = deflateCodec.id;
        encoded = candidate;
      }
    }
  } catch {
    // Compression is an optimization; raw encoding always works.
  }

  const hash = `${COMPILER_HASH_PREFIX}${codecId}/${encoded}`;
  return {
    url: `${pageBaseUrl()}${hash}`,
    encodedChars: hash.length,
    codecId,
    tooLarge: hash.length > COMPILER_SHARE_LIMIT_CHARS,
  };
}

export type CompilerRestoreResult =
  | { status: "none" }
  | { status: "ok"; payload: CompilerSharePayload }
  | { status: "error"; message: string };

/** Decode a compiler share hash. Never throws. */
export async function restoreCompilerShare(url: string): Promise<CompilerRestoreResult> {
  const extracted = extractCompilerShare(url);
  if (!extracted.found) {
    return { status: "none" };
  }
  const failure = { status: "error" as const, message: "Unable to open this shared Dart link." };
  const codec = shareCodecById(extracted.codecId ?? "");
  if (!codec) {
    return failure;
  }
  try {
    const bytes = decodeBase64Url(extracted.encoded ?? "");
    const decompressed = await codec.decompress(bytes);
    const parsed: unknown = JSON.parse(decodeUtf8(decompressed));
    if (typeof parsed !== "object" || parsed === null) {
      return failure;
    }
    const record = parsed as Record<string, unknown>;
    if (typeof record.c !== "string") {
      return failure;
    }
    return {
      status: "ok",
      payload: {
        code: record.c,
        stdin: typeof record.s === "string" ? record.s : "",
        language:
          record.l === "js" ? ("js" as const) : record.l === "ts" ? ("ts" as const) : ("dart" as const),
      },
    };
  } catch {
    return failure;
  }
}
