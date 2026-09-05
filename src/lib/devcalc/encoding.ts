/**
 * Encoding size calculator — how many bytes/chars each common encoding needs
 * for the same text. Byte counts and character counts are kept distinct.
 */

import { bytesOf } from "@/lib/devcalc/engine";

export interface EncodingBreakdown {
  utf8Bytes: number;
  utf16Units: number;
  utf16Bytes: number;
  asciiBytes: number | null;
  hex: string;
  hexChars: number;
  base64: string;
  base64Bytes: number;
  url: string;
  urlChars: number;
  urlBytes: number;
  allAscii: boolean;
}

export function encodingBreakdown(text: string): EncodingBreakdown {
  const utf8Bytes = new TextEncoder().encode(text).length;
  const utf16Units = text.length;
  const utf16Bytes = utf16Units * 2;
  const allAscii = [...text].every((c) => c.charCodeAt(0) <= 0x7f) && text.length > 0;
  const asciiBytes = allAscii ? text.length : null;

  let hex = "";
  let base64 = "";
  if (utf8Bytes <= 32 * 1024) {
    hex = bytesOf(text).hex;
    base64 = bytesOf(text).base64;
  }
  const url = encodeURIComponent(text);
  return {
    utf8Bytes,
    utf16Units,
    utf16Bytes,
    asciiBytes,
    hex,
    hexChars: hex.length,
    base64,
    base64Bytes: base64.length,
    url,
    urlChars: url.length,
    urlBytes: new TextEncoder().encode(url).length,
    allAscii,
  };
}