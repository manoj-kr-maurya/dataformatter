export { createShareLink } from "@/lib/share/encoder";
export type { ShareLinkResult } from "@/lib/share/encoder";
export { restoreFromShareUrl, extractShareFromUrl } from "@/lib/share/decoder";
export type { ShareDecodeResult } from "@/lib/share/decoder";
export { looksSensitive } from "@/lib/share/secrets";
export {
  validateSharePayload,
  serializeSharePayload,
  isStoredOutputRequired,
  normalizeSharePayload,
} from "@/lib/share/serializer";
export {
  SHARE_HASH_PREFIX,
  SHARE_OPEN_FAILURE_MESSAGE,
  SHARE_SCHEMA_VERSION,
  SHARE_LEGACY_SCHEMA_VERSION,
  DEFAULT_SHARE_LIMIT_CHARS,
} from "@/lib/share/types";
export type { SharePayload, ShareDisplay } from "@/lib/share/types";