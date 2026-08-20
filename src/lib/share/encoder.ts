import { DEFAULT_SHARE_LIMIT_CHARS, SHARE_HASH_PREFIX } from "@/lib/share/types";
import type { SharePayload } from "@/lib/share/types";
import { encodeBase64Url } from "@/lib/share/base64url";
import { defaultShareCodec, encodeUtf8 } from "@/lib/share/codec";
import { serializeSharePayload, serializedShareBytes } from "@/lib/share/serializer";

export interface ShareLinkResult {
  /** Absolute URL, e.g. https://dataformatter.in/#/share/<payload> */
  url: string;
  payload: SharePayload;
  /** bytes before compression */
  originalBytes: number;
  /** bytes after compression */
  compressedBytes: number;
  /** length of the final encoded payload chars */
  encodedChars: number;
  /** codec id used, e.g. "d" | "r" */
  codecId: string;
  /** true when the encoded payload exceeds SHOULD_SHARE_LIMIT_CHARS */
  tooLarge: boolean;
  /** the plain share hash value (#/share/d/<payload>), without page prefix */
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
 * Serialize → compress → Base64URL and build the share URL.
 *
 * The returned URL embeds everything needed to restore the workspace; nothing
 * leaves the browser.
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

  const codec = defaultShareCodec();
  const compressed = await codec.compress(source);

  const encoded = encodeBase64Url(compressed);
  const hash = `${SHARE_HASH_PREFIX}${codec.id}/${encoded}`;
  const url = `${identifier}${hash}`;

  return {
    url,
    hash,
    payload,
    originalBytes,
    compressedBytes: compressed.byteLength,
    encodedChars: hash.length,
    codecId: codec.id,
    tooLarge: hash.length > limit,
  };
}