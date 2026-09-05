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

export interface EncodingCompareRow {
  label: string;
  size: number;
  pct: number | null;
}

/**
 * Sorted byte-size comparison across encodings, relative to the UTF-8 bytes
 * of the source (always the smallest for valid text). `pct` is the increase
 * over that baseline; null when there is no comparable baseline.
 */
export function encodingSizeComparison(text: string): EncodingCompareRow[] {
  const b = encodingBreakdown(text);
  const rows: EncodingCompareRow[] = [
    { label: "UTF-8", size: b.utf8Bytes, pct: 0 },
    { label: "UTF-16 (LE)", size: b.utf16Bytes, pct: b.utf8Bytes > 0 ? (b.utf16Bytes / b.utf8Bytes - 1) * 100 : null },
    { label: "ASCII", size: b.asciiBytes ?? 0, pct: b.asciiBytes == null ? null : b.utf8Bytes > 0 ? (b.asciiBytes / b.utf8Bytes - 1) * 100 : null },
    { label: "Base64", size: b.base64Bytes, pct: b.utf8Bytes > 0 ? (b.base64Bytes / b.utf8Bytes - 1) * 100 : null },
    { label: "Hex", size: b.hexChars, pct: b.utf8Bytes > 0 ? (b.hexChars / b.utf8Bytes - 1) * 100 : null },
    { label: "URL-encoded", size: b.urlBytes, pct: b.utf8Bytes > 0 ? (b.urlBytes / b.utf8Bytes - 1) * 100 : null },
  ];
  return rows
    .filter((r) => r.size > 0 && r.pct != null)
    .sort((a, b) => a.size - b.size);
}