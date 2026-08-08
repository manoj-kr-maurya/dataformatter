export type DecodeResult = { ok: true; value: string } | { ok: false; error: string };

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

export function stripWhitespace(input: string): string {
  return input.replace(/[\s\u200b]+/g, "");
}

/**
 * Decode Base64 to UTF-8 text with strict validation.
 * - Accepts embedded whitespace/newlines
 * - Recovers missing padding when safely inferable
 * - Rejects characters outside the Base64 alphabet
 * - Rejects input with a remainder of 1 (never valid, cannot be re-padded)
 * - Fails on bytes that are not valid UTF-8
 */
export function decodeBase64(input: string): DecodeResult {
  const cleaned = stripWhitespace(input);

  if (!cleaned) {
    return {
      ok: false,
      error: "There is no Base64 data to decode. Paste or type some Base64 first.",
    };
  }

  if (!BASE64_RE.test(cleaned)) {
    return {
      ok: false,
      error: "Invalid Base64. The text contains characters outside the Base64 alphabet.",
    };
  }

  const remainder = cleaned.length % 4;
  if (remainder === 1) {
    return {
      ok: false,
      error: `Invalid Base64. A Base64 length with remainder 1 (got ${cleaned.length}) can never be valid.`,
    };
  }

  const padded = remainder === 0 ? cleaned : cleaned + "=".repeat(4 - remainder);

  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value };
  } catch {
    return { ok: false, error: "Invalid Base64. The data could not be decoded as UTF-8 text." };
  }
}