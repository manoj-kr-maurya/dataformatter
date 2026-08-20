import { failResult, okResult } from "@/lib/transformers/builders";
import { ntlmHash } from "@/lib/hash/md4";
import { parseCount } from "@/lib/random/params";
import { randomChoice } from "@/lib/random/random";
import type { TransformationResult } from "@/types/transformation";

const RANDOM_WORDS = [
  "alpha", "beta", "gamma", "delta", "echo", "foxtrot", "hotel", "india",
  "juliet", "kilo", "lima", "mike", "november", "oscar", "papa", "quebec",
  "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "xray", "yankee",
  "zulu", "apple", "banana", "cherry", "dragon", "elephant", "falcon", "gorilla",
];

const PASSWORD_LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const PASSWORD_UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PASSWORD_DIGITS = "0123456789";
const PASSWORD_SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?";

export function randomWordGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(randomChoice(RANDOM_WORDS));
  }
  return okResult(input, words.join("\n"), "RANDOM_WORD", "TEXT", "Random words generated", "TEXT");
}

/** Generate one password guaranteed to contain lower, upper, digit and symbol. */
function makePassword(length: number): string {
  const choose = () => {
    const r = Math.random();
    if (r < 0.34) return randomChoice(PASSWORD_LOWERCASE);
    if (r < 0.62) return randomChoice(PASSWORD_UPPERCASE);
    if (r < 0.85) return randomChoice(PASSWORD_DIGITS);
    return randomChoice(PASSWORD_SYMBOLS);
  };
  const chars = [
    randomChoice(PASSWORD_LOWERCASE),
    randomChoice(PASSWORD_UPPERCASE),
    randomChoice(PASSWORD_DIGITS),
    randomChoice(PASSWORD_SYMBOLS),
  ];
  for (let i = chars.length; i < length; i++) {
    chars.push(choose());
  }
  // Shuffle so the guaranteed character classes aren't grouped at the front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function passwordGenerator(input: string): TransformationResult {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/).filter((p) => p !== "");
  const count = parts.length > 0 ? parseCount(parts[0]) : 5;
  const length = parts.length > 1 ? parseCount(parts[1], 16) : 16;
  const passwords: string[] = [];
  for (let i = 0; i < count; i++) {
    passwords.push(makePassword(Math.max(4, length)));
  }
  return okResult(input, passwords.join("\n"), "PASSWORD_GENERATOR", "TEXT", "Passwords generated", "TEXT");
}

export function ntlmHashGenerator(input: string): TransformationResult {
  if (!input.trim()) {
    return failResult(input, "Enter a password to hash.", "TEXT", "TEXT");
  }
  // NTLM hashes the exact typed bytes (including trailing newline only when present in the raw value).
  return okResult(input, ntlmHash(input), "NTLM_HASH", "TEXT", "NTLM hash generated", "TEXT");
}