import type { ShareCodec } from "@/lib/share/types";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

function supportsNativeStreams(): boolean {
  return (
    typeof CompressionStream === "function" &&
    typeof DecompressionStream === "function" &&
    typeof Response === "function"
  );
}

/**
 * DEFLATE via the platform `CompressionStream`/`DecompressionStream` APIs.
 *
 * Zero new dependencies, lossless, and available in every browser the app
 * targets (Safari 16.4+, Chrome/Edge/Firefox). HTTPS is not required for this
 * API, so compressed links work from `http://localhost` too.
 *
 * The scheme is marked in the URL so a future codec (e.g. Brotli) can be
 * introduced without breaking existing links.
 */
export const deflateCodec: ShareCodec = {
  id: "d",
  name: "deflate",
  async compress(data) {
    const compressed = await new Response(
      new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer();
    return new Uint8Array(compressed);
  },
  async decompress(data) {
    const decompressed = await new Response(
      new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate")),
    ).arrayBuffer();
    return new Uint8Array(decompressed);
  },
};

/** Fallback that stores bytes verbatim (no compression) — keeps the whole
 * feature functional in environments without CompressionStream. */
export const rawCodec: ShareCodec = {
  id: "r",
  name: "raw",
  async compress(data) {
    return data;
  },
  async decompress(data) {
    return data;
  },
};

/** The codec used to build new links on this device. */
export function defaultShareCodec(): ShareCodec {
  return supportsNativeStreams() ? deflateCodec : rawCodec;
}

/** Look up a codec by its URL marker. Returns null for unknown ids. */
export function shareCodecById(id: string): ShareCodec | null {
  if (id === deflateCodec.id) return deflateCodec;
  if (id === rawCodec.id) return rawCodec;
  return null;
}

export function encodeUtf8(text: string): Uint8Array {
  return encoder.encode(text);
}

export function decodeUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}