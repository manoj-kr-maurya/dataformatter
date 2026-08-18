export type EncodingResult = { ok: true; value: string } | { ok: false; error: string };

/** Percent-encode a string (encodeURIComponent semantics). */
export function encodeUrl(input: string): EncodingResult {
  return { ok: true, value: encodeURIComponent(input) };
}

/** Decode a percent-encoded string, failing on malformed escapes. */
export function decodeUrl(input: string): EncodingResult {
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: "Invalid URL encoding. The input contains malformed percent-escapes." };
  }
}