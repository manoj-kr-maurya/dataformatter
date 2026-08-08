import { decodeBase64, stripWhitespace } from "@/lib/base64/decode";

export interface Base64Detection {
  ok: boolean;
  decoded?: string;
}

/**
 * A word/line should only be treated as Base64 when it *looks* like one.
 * Rules (all must hold):
 *  1. At least 8 characters after stripping whitespace.
 *  2. A remainder of 1 (mod 4) is impossible for Base64.
 *  3. It passes the strict Base64 alphabet + UTF-8 decode.
 *  4. The decoded bytes are human text, not random binary.
 */
export function detectBase64(input: string): Base64Detection {
  const cleaned = stripWhitespace(input);
  if (cleaned.length < 8 || cleaned.length % 4 === 1) {
    return { ok: false };
  }

  const decoded = decodeBase64(cleaned);
  if (!decoded.ok) {
    return { ok: false };
  }

  if (!looksLikeText(decoded.value)) {
    return { ok: false };
  }

  return { ok: true, decoded: decoded.value };
}

function looksLikeText(value: string): boolean {
  if (!value) {
    return false;
  }
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const isControl = code < 32 && code !== 9 && code !== 10 && code !== 13;
    const isDel = code === 127;
    if (isControl || isDel) {
      return false;
    }
  }
  return true;
}