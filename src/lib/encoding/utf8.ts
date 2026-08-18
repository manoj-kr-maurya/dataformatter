export type HexResult = { ok: true; value: Uint8Array } | { ok: false; error: string };

/**
 * "UTF-8 Converter": escape a string so only ASCII remains. Non-ASCII code
 * points become \uXXXX (astral as \u{...}), the widespread representation of
 * arbitrary Unicode as a pure-ASCII UTF-8 escape sequence.
 */
export function escapeToUtf8Escapes(input: string): string {
  return Array.from(input)
    .map((char) => {
      const code = char.codePointAt(0) as number;
      if (code <= 0x7f) {
        return char;
      }
      return code > 0xffff ? `\\u{${code.toString(16)}}` : `\\u${code.toString(16).padStart(4, "0")}`;
    })
    .join("");
}

const ESCAPE_RE = /\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4})|\\x([0-9a-f]{2})/gi;

/** Convert a \uXXXX / \u{...} / \xNN escape sequence back to UTF-8 text. */
export function unescapeUtf8Escapes(input: string): string {
  return input.replace(ESCAPE_RE, (match, hex: string, u4: string, x2: string) => {
    if (hex) {
      return String.fromCodePoint(Number.parseInt(hex, 16));
    }
    if (u4) {
      return String.fromCodePoint(Number.parseInt(u4, 16));
    }
    return String.fromCharCode(Number.parseInt(x2, 16));
  });
}

/** Parse a hex string (whitespace tolerated) into raw bytes. */
export function hexToBytes(input: string): HexResult {
  const cleaned = input.replace(/[\s\u200b]+/g, "");

  if (cleaned.length % 2 !== 0) {
    return {
      ok: false,
      error: "Invalid hex. Hex must contain whole bytes (an even number of characters).",
    };
  }

  if (cleaned && !/^[0-9a-f]+$/i.test(cleaned)) {
    return { ok: false, error: "Invalid hex. The text contains characters outside 0-9 and A-F." };
  }

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleaned.slice(i, i + 2), 16);
  }
  return { ok: true, value: bytes };
}