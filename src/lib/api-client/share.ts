import { encodeBase64Url, decodeBase64Url } from "@/lib/share/base64url";
import { decodeUtf8, encodeUtf8, shareCodecById } from "@/lib/share/codec";
import { looksSensitive } from "@/lib/share/secrets";
import {
  type AuthMode,
  type BodyMode,
  type HttpMethod,
  type KeyValueRow,
  type RequestDraft,
  newRow,
} from "@/lib/api-client/types";

/**
 * Share links for saved requests. Separate from both the workspace `#/share/`
 * payload and compiler `#/dart/` links — this tool owns:
 *
 *   #/api/<codecId>/<base64url(JSON)>
 *
 * Only enabled rows travel in a link; disabled rows are editor scratch.
 */

export const API_CLIENT_HASH_PREFIX = "#/api/";

export const API_CLIENT_SHARE_LIMIT_CHARS = 32_000;

interface ApiSharePayload {
  m?: string;
  u: string;
  q?: [string, string][];
  h?: [string, string][];
  b?: string;
  t?: string;
  f?: [string, string][];
  /** "b" = bearer, "s" = basic; absent = none. */
  ak?: "b" | "s";
  at?: string;
  au?: string;
  ap?: string;
}

function activePairs(rows: KeyValueRow[]): [string, string][] {
  return rows
    .filter((row) => row.enabled && row.name.trim().length > 0)
    .map((row) => [row.name, row.value]);
}

function pageBaseUrl(): string {
  if (typeof window !== "undefined" && typeof window.location?.href === "string") {
    const href = window.location.href;
    const hashIndex = href.indexOf("#");
    return hashIndex === -1 ? href : href.slice(0, hashIndex);
  }
  return "";
}

export interface ExtractedApiHash {
  found: boolean;
  codecId?: string;
  encoded?: string;
}

/** Pull the codec id + encoded payload out of a URL or bare hash. */
export function extractApiClientShare(url: string): ExtractedApiHash {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex === -1 ? url : url.slice(hashIndex);
  if (!hash.startsWith(API_CLIENT_HASH_PREFIX)) {
    return { found: false };
  }
  const rest = hash.slice(API_CLIENT_HASH_PREFIX.length);
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

export interface ApiClientShareLinkResult {
  url: string;
  encodedChars: number;
  codecId: string;
  tooLarge: boolean;
  /** True when the payload carries credential-looking values. */
  hasSecrets: boolean;
}

export async function createApiClientShareLink(
  draft: RequestDraft,
): Promise<ApiClientShareLinkResult> {
  const payload: ApiSharePayload = { u: draft.url.trim() };
  if (draft.method !== "GET") {
    payload.m = draft.method;
  }
  const query = activePairs(draft.query);
  if (query.length > 0) {
    payload.q = query;
  }
  const headers = activePairs(draft.headers);
  if (headers.length > 0) {
    payload.h = headers;
  }
  if (draft.bodyMode !== "none") {
    payload.b = draft.bodyMode;
    if (draft.bodyMode === "json" || draft.bodyMode === "text") {
      payload.t = draft.bodyText;
    } else {
      const form = activePairs(draft.formRows);
      if (form.length > 0) {
        payload.f = form;
      }
    }
  }
  if (draft.authMode === "bearer" && draft.bearerToken) {
    payload.ak = "b";
    payload.at = draft.bearerToken;
  } else if (draft.authMode === "basic") {
    payload.ak = "s";
    payload.au = draft.basicUsername;
    payload.ap = draft.basicPassword;
  }

  const json = JSON.stringify(payload);
  const hasSecrets = looksSensitive(json);
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

  const hash = `${API_CLIENT_HASH_PREFIX}${codecId}/${encoded}`;
  return {
    url: `${pageBaseUrl()}${hash}`,
    encodedChars: hash.length,
    codecId,
    tooLarge: hash.length > API_CLIENT_SHARE_LIMIT_CHARS,
    hasSecrets,
  };
}

export type ApiClientRestoreResult =
  | { status: "none" }
  | { status: "ok"; payload: RequestDraft }
  | { status: "error"; message: string };

const BODY_MODES: readonly BodyMode[] = [
  "none",
  "json",
  "text",
  "urlencoded",
  "form-data",
];

function toRows(pairs: unknown): KeyValueRow[] | null {
  if (!Array.isArray(pairs)) {
    return null;
  }
  const rows: KeyValueRow[] = [];
  for (const pair of pairs) {
    if (
      !Array.isArray(pair) ||
      pair.length !== 2 ||
      typeof pair[0] !== "string" ||
      typeof pair[1] !== "string"
    ) {
      return null;
    }
    rows.push(newRow(pair[0], pair[1]));
  }
  return rows;
}

/** Decode an API-client share hash into an editable draft. Never throws. */
export async function restoreApiClientShare(
  url: string,
): Promise<ApiClientRestoreResult> {
  const extracted = extractApiClientShare(url);
  if (!extracted.found) {
    return { status: "none" };
  }
  const failure = {
    status: "error" as const,
    message: "Unable to open this shared request link.",
  };
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
    if (typeof record.u !== "string") {
      return failure;
    }

    const method =
      typeof record.m === "string" &&
      ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(record.m)
        ? (record.m as HttpMethod)
        : "GET";
    const bodyMode =
      typeof record.b === "string" && BODY_MODES.includes(record.b as BodyMode)
        ? (record.b as BodyMode)
        : "none";
    const authMode: AuthMode =
      record.ak === "b" ? "bearer" : record.ak === "s" ? "basic" : "none";

    return {
      status: "ok",
      payload: {
        method,
        url: record.u,
        query: toRows(record.q) ?? [newRow()],
        headers: toRows(record.h) ?? [],
        bodyMode,
        bodyText: typeof record.t === "string" ? record.t : "",
        formRows: toRows(record.f) ?? [newRow()],
        authMode,
        bearerToken: typeof record.at === "string" ? record.at : "",
        basicUsername: typeof record.au === "string" ? record.au : "",
        basicPassword: typeof record.ap === "string" ? record.ap : "",
      },
    };
  } catch {
    return failure;
  }
}
