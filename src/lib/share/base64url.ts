const BASE64_URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const LOOKUP = new Int16Array(128).fill(-1);
for (let i = 0; i < BASE64_URL_ALPHABET.length; i++) {
  LOOKUP[BASE64_URL_ALPHABET.charCodeAt(i)] = i;
}

/**
 * Encode bytes as Base64URL (RFC 4648 §5: no "+/", no "=" padding).
 * Uses a lookup-table encoder so it works in any JS environment.
 */
export function encodeBase64Url(bytes: Uint8Array): string {
  let out = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    out += BASE64_URL_ALPHABET[(n >> 18) & 63];
    out += BASE64_URL_ALPHABET[(n >> 12) & 63];
    out += i + 1 < len ? BASE64_URL_ALPHABET[(n >> 6) & 63] : "";
    out += i + 2 < len ? BASE64_URL_ALPHABET[n & 63] : "";
  }
  return out;
}

/**
 * Decode a Base64URL string back into bytes. Allows the URL-safe alphabet
 * (plus standard "+/=" to tolerate naive pipelines), rejects length%4===1
 * which is invalid for any base64 variant.
 */
export function decodeBase64Url(value: string): Uint8Array {
  const clean = value
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const length = clean.length;
  if (length % 4 === 1) {
    throw new Error("Invalid Base64URL length");
  }

  const out = new Uint8Array(Math.floor((length * 3) / 4));
  let buf = 0;
  let bits = 0;
  let outIndex = 0;
  for (let i = 0; i < length; i++) {
    const code = clean.charCodeAt(i);
    if (code >= 128 || code < 0) {
      throw new Error("Invalid Base64URL character");
    }
    const valueOf = LOOKUP[code];
    if (valueOf < 0) {
      throw new Error(`Invalid Base64URL character "${clean[i]}"`);
    }
    buf = (buf << 6) | valueOf;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[outIndex++] = (buf >> bits) & 0xff;
    }
  }

  return outIndex === out.length ? out : out.slice(0, outIndex);
}