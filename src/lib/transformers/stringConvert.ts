import { failResult, okResult } from "@/lib/transformers/builders";
import { hexToBytes } from "@/lib/encoding/utf8";
import { numberToWords, wordsToNumber } from "@/lib/text/numbers";
import type { TransformationResult } from "@/types/transformation";

function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function stringToHexConverter(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to convert.", "TEXT", "TEXT");
  }
  const hex = Array.from(utf8Bytes(input), (byte) => byte.toString(16).padStart(2, "0")).join(" ");
  return okResult(input, hex, "STRING_TO_HEX", "TEXT", "String converted to hex", "TEXT");
}

export function hexToStringConverter(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no hex to convert.", "TEXT", "TEXT");
  }
  const parsed = hexToBytes(input);
  if (!parsed.ok) {
    return failResult(input, parsed.error ?? "Invalid hex.", "TEXT", "TEXT");
  }
  try {
    const text = decodeUtf8(parsed.value);
    return okResult(input, text, "HEX_TO_STRING", "TEXT", "Hex converted to string", "TEXT");
  } catch {
    return failResult(input, "Invalid hex. The bytes are not valid UTF-8 text.", "TEXT", "TEXT");
  }
}

export function stringToBinaryConverter(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no text to convert.", "TEXT", "TEXT");
  }
  const binary = Array.from(utf8Bytes(input), (byte) => byte.toString(2).padStart(8, "0")).join(" ");
  return okResult(input, binary, "STRING_TO_BINARY", "TEXT", "String converted to binary", "TEXT");
}

export function binaryToStringConverter(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "There is no binary to convert.", "TEXT", "TEXT");
  }
  const groups = input.trim().split(/\s+/);
  const bytes = new Uint8Array(groups.length);
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (!/^[01]{8}$/.test(group)) {
      return failResult(input, "Invalid binary. Each byte must be exactly 8 bits (0 or 1).", "TEXT", "TEXT");
    }
    bytes[i] = Number.parseInt(group, 2);
  }
  try {
    const text = decodeUtf8(bytes);
    return okResult(input, text, "BINARY_TO_STRING", "TEXT", "Binary converted to string", "TEXT");
  } catch {
    return failResult(input, "Invalid binary. The bytes are not valid UTF-8 text.", "TEXT", "TEXT");
  }
}

export function numberToWordsConverter(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "Enter a number to convert.", "TEXT", "TEXT");
  }
  const lines: string[] = [];
  for (const raw of input.trim().split(/\s+/)) {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return failResult(input, `"${raw}" is not a number.`, "TEXT", "TEXT");
    }
    try {
      lines.push(numberToWords(value));
    } catch (error) {
      return failResult(input, error instanceof Error ? error.message : "Cannot convert that number.", "TEXT", "TEXT");
    }
  }
  return okResult(input, lines.join("\n"), "NUMBER_TO_WORDS", "TEXT", "Number converted to words", "TEXT");
}

export function wordsToNumberConverter(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "Enter number words to convert.", "TEXT", "TEXT");
  }
  const lines: string[] = [];
  for (const line of input.trim().split(/\n+/)) {
    try {
      lines.push(String(wordsToNumber(line)));
    } catch (error) {
      return failResult(input, error instanceof Error ? error.message : "Cannot convert those words.", "TEXT", "TEXT");
    }
  }
  return okResult(input, lines.join("\n"), "WORDS_TO_NUMBER", "TEXT", "Words converted to numbers", "TEXT");
}