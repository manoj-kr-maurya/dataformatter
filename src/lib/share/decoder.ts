import { SHARE_HASH_PREFIX, SHARE_OPEN_FAILURE_MESSAGE } from "@/lib/share/types";
import type { SharePayload } from "@/lib/share/types";
import { decodeBase64Url } from "@/lib/share/base64url";
import { decodeUtf8, shareCodecById } from "@/lib/share/codec";
import { validateSharePayload } from "@/lib/share/serializer";

export type ShareDecodeResult =
  | { status: "none"; payload?: undefined; message?: undefined }
  | { status: "ok"; payload: SharePayload; message?: undefined }
  | { status: "error"; payload?: undefined; message: string };

interface ExtractResult {
  found: boolean;
  codecId?: string;
  encoded?: string;
}

/**
 * Extract the codec id + encoded payload out of a URL (or bare hash).
 * eg. "https://…/#/share/d/AAA" → { found, codecId: "d", encoded: "AAA" }
 */
export function extractShareFromUrl(url: string): ExtractResult {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex === -1 ? url : url.slice(hashIndex);
  if (!hash.startsWith(SHARE_HASH_PREFIX)) {
    return { found: false };
  }
  const rest = hash.slice(SHARE_HASH_PREFIX.length);
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
 * Decode + decompress + parse + validate a share URL/hash.
 *
 * Never throws: returns { status: "error" } with a friendly message on any
 * corrupted / invalid input so the app can keep running normally.
 */
export async function restoreFromShareUrl(url: string): Promise<ShareDecodeResult> {
  const extracted = extractShareFromUrl(url);
  if (!extracted.found) {
    return { status: "none" };
  }
  const codec = shareCodecById(extracted.codecId ?? "");
  if (!codec) {
    return { status: "error", message: SHARE_OPEN_FAILURE_MESSAGE };
  }

  try {
    const bytes = decodeBase64Url(extracted.encoded ?? "");
    const decompressed = await codec.decompress(bytes);
    const json = decodeUtf8(decompressed);
    const parsed: unknown = JSON.parse(json);
    const reason = validateSharePayload(parsed);
    if (reason) {
      return { status: "error", message: SHARE_OPEN_FAILURE_MESSAGE };
    }
    return { status: "ok", payload: parsed as SharePayload };
  } catch {
    return { status: "error", message: SHARE_OPEN_FAILURE_MESSAGE };
  }
}