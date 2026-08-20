import type { ShareCodec } from "@/lib/share/types";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

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

/**
 * RAW DEFLATE (RFC 1951) via `CompressionStream("deflate-raw")`.
 *
 * Drops the 6-byte ZLIB header + Adler-32 checksum that `deflate` adds, so it
 * is strictly shorter than the `d` codec for any payload. Support: Chrome 103+,
 * Firefox 113+, Safari 16.4+. Guarded by feature detection so browsers without
 * it simply fall back to `d` (they are never handed `n` links).
 */
export const deflateRawCodec: ShareCodec = {
  id: "n",
  name: "deflate-raw",
  async compress(data) {
    const compressed = await new Response(
      new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream("deflate-raw")),
    ).arrayBuffer();
    return new Uint8Array(compressed);
  },
  async decompress(data) {
    const decompressed = await new Response(
      new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw")),
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
  if (deflateRawAvailable()) return deflateRawCodec;
  if (deflateAvailable()) return deflateCodec;
  return rawCodec;
}

/** Look up a codec by its URL marker. Returns null for unknown ids. */
export function shareCodecById(id: string): ShareCodec | null {
  if (id === deflateCodec.id) return deflateCodec;
  if (id === deflateRawCodec.id) return deflateRawCodec;
  if (id === rawCodec.id) return rawCodec;
  return null;
}

/** True when the platform can deflate without the ZLIB wrapper. */
export function deflateRawAvailable(): boolean {
  if (
    typeof CompressionStream !== "function" ||
    typeof DecompressionStream !== "function" ||
    typeof Response !== "function"
  ) {
    return false;
  }
  try {
    new CompressionStream("deflate-raw");
    return true;
  } catch {
    return false;
  }
}

/** True when the platform has the classic CompressionStream API at all. */
export function deflateAvailable(): boolean {
  return (
    typeof CompressionStream === "function" &&
    typeof DecompressionStream === "function" &&
    typeof Response === "function"
  );
}

export function encodeUtf8(text: string): Uint8Array {
  return encoder.encode(text);
}

export function decodeUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}