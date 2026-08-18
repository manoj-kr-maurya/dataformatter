import { stripWhitespace } from "@/lib/base64/decode";

export type BytesResult = { ok: true; bytes: Uint8Array } | { ok: false; error: string };

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToBytes(input: string): BytesResult {
  const cleaned = stripWhitespace(input);

  if (!cleaned) {
    return {
      ok: false,
      error: "There is no Base64 data to convert. Paste or type some Base64 first.",
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

  try {
    const binary = atob(remainder === 0 ? cleaned : cleaned + "=".repeat(4 - remainder));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return { ok: true, bytes };
  } catch {
    return { ok: false, error: "Invalid Base64. The data could not be decoded." };
  }
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(input: string): BytesResult {
  const cleaned = stripWhitespace(input);
  if (!cleaned) {
    return { ok: false, error: "There is no hex to convert. Paste or type some hex first." };
  }
  if (cleaned.length % 2 !== 0) {
    return {
      ok: false,
      error: "Invalid hex. A hex string must contain an even number of digits.",
    };
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    return { ok: false, error: "Invalid hex. The text contains characters outside the hex alphabet." };
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return { ok: true, bytes };
}

export function bytesToBinaryString(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(2).padStart(8, "0")).join("");
}

export function binaryStringToBytes(input: string): BytesResult {
  const cleaned = stripWhitespace(input);
  if (!cleaned) {
    return {
      ok: false,
      error: "There is no binary data to convert. Paste or type some 0/1 bits first.",
    };
  }
  if (!/^[01]+$/.test(cleaned)) {
    return { ok: false, error: "Invalid binary. The text must contain only 0 and 1." };
  }
  if (cleaned.length % 8 !== 0) {
    return {
      ok: false,
      error: "Invalid binary. The number of bits must be a multiple of 8.",
    };
  }
  const bytes = new Uint8Array(cleaned.length / 8);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(cleaned.slice(i * 8, i * 8 + 8), 2);
  }
  return { ok: true, bytes };
}

export function octalToBytes(input: string): BytesResult {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return {
      ok: false,
      error: "There is no octal data to convert. Paste or type some octal bytes first.",
    };
  }
  for (const token of tokens) {
    if (!/^[0-7]{1,3}$/.test(token) || Number.parseInt(token, 8) > 255) {
      return {
        ok: false,
        error: `Invalid octal value "${token}". Use 1 to 3 octal digits (0-377).`,
      };
    }
  }
  return {
    ok: true,
    bytes: Uint8Array.from(tokens, (token) => Number.parseInt(token, 8)),
  };
}

export type ImageType = "png" | "jpeg";

export function sniffImageType(bytes: Uint8Array): ImageType | null {
  const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= PNG_MAGIC.length && PNG_MAGIC.every((byte, i) => bytes[i] === byte)) {
    return "png";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpeg";
  }
  return null;
}

export interface ImageDataUri {
  mime: string;
  payload: string;
}

/**
 * Split a `data:<mime>;base64,<payload>` URI into its MIME type and Base64
 * payload. Returns null when the input is not a Base64 data URI (for example
 * raw Base64, or a URI without a `;base64,` marker).
 */
export function splitImageDataUri(input: string): ImageDataUri | null {
  const match = /^data:([^;,]*)?(?:;[^,]*)?;base64,([\s\S]*)$/.exec(input.trim());
  if (!match) {
    return null;
  }
  return { mime: (match[1] ?? "").trim(), payload: match[2].trim() };
}

/** Extract the Base64 payload from a data URI, falling back to raw input. */
export function imagePayload(input: string): string {
  const parts = splitImageDataUri(input);
  return parts ? parts.payload : input.trim();
}