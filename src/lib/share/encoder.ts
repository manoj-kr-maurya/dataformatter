import { DEFAULT_SHARE_LIMIT_CHARS, SHARE_HASH_PREFIX } from "@/lib/share/types";
import type { SharePayload, ShareCodec } from "@/lib/share/types";
import { encodeBase64Url } from "@/lib/share/base64url";
import {
  encodeUtf8,
  deflateRawCodec,
  deflateCodec,
  deflateRawAvailable,
  deflateAvailable,
  rawCodec,
} from "@/lib/share/codec";
import { serializeSharePayload, serializedShareBytes } from "@/lib/share/serializer";

export interface ShareLinkResult {
  /** Absolute URL, e.g. https://dataformatter.in/#/share/d/<payload> */
  url: string;
  payload: SharePayload;
  /** bytes before compression (compact JSON, UTF-8) */
  originalBytes: number;
  /** bytes after compression (=== originalBytes for the raw codec) */
  compressedBytes: number;
  /** length of the final encoded payload chars */
  encodedChars: number;
  /** codec id used, e.g. "d" | "r" */
  codecId: string;
  /** true when the encoded payload exceeds the practical share cap */
  tooLarge: boolean;
  /** the plain share hash value (#/share/<codec>/<payload>), without page prefix */
  hash: string;
}

export interface CreateShareLinkOptions {
  /** Override the URL base (defaults to the current page location). */
  baseUrl?: string;
  /** Override the max encoded char count (useful in tests). */
  limit?: number;
}

function pageBaseUrl(): string {
  if (typeof window !== "undefined" && typeof window.location?.href === "string") {
    const href = window.location.href;
    const hashIndex = href.indexOf("#");
    return hashIndex === -1 ? href : href.slice(0, hashIndex);
  }
  return "";
}

function stripHash(identifier: string): string {
  const hashIndex = identifier.indexOf("#");
  return hashIndex === -1 ? identifier : identifier.slice(0, hashIndex);
}

/**
 * Serialize → (deflate only when it actually pays off) → Base64URL and build
 * the share URL. Deflate is great for structured text but adds management
 * bytes that bloat tiny payloads, so both candidates are computed and the
 * shorter encoded form wins. Nothing leaves the browser.
 */
export async function createShareLink(
  payload: SharePayload,
  options: CreateShareLinkOptions = {},
): Promise<ShareLinkResult> {
  const identifier = stripHash(options.baseUrl ?? pageBaseUrl());
  const limit = options.limit ?? DEFAULT_SHARE_LIMIT_CHARS;
  const serialized = serializeSharePayload(payload);
  const originalBytes = serializedShareBytes(payload);
  const source = encodeUtf8(serialized);

  const rawEncoded = encodeBase64Url(source);
  let chosen: { codec: ShareCodec; bytes: Uint8Array; encoded: string } = {
    codec: rawCodec,
    bytes: source,
    encoded: rawEncoded,
  };

  // The compressed candidate is the shortest deflate flavour the platform
  // supports: raw DEFLATE (RFC 1951, no 6-byte ZLIB wrapper) when available,
  // otherwise classic ZLIB DEFLATE. Whichever encoded form is shorter wins —
  // tiny payloads where compression has nothing to gain stay on the raw codec.
  if (deflateRawAvailable()) {
    const compressed = await deflateRawCodec.compress(source);
    const encoded = encodeBase64Url(compressed);
    if (encoded.length <= chosen.encoded.length) {
      chosen = { codec: deflateRawCodec, bytes: compressed, encoded };
    }
  } else if (deflateAvailable()) {
    const compressed = await deflateCodec.compress(source);
    const encoded = encodeBase64Url(compressed);
    if (encoded.length <= chosen.encoded.length) {
      chosen = { codec: deflateCodec, bytes: compressed, encoded };
    }
  }

  const hash = `${SHARE_HASH_PREFIX}${chosen.codec.id}/${chosen.encoded}`;
  const url = `${identifier}${hash}`;

  return {
    url,
    hash,
    payload,
    originalBytes,
    compressedBytes: chosen.bytes.byteLength,
    encodedChars: hash.length,
    codecId: chosen.codec.id,
    tooLarge: hash.length > limit,
  };
}