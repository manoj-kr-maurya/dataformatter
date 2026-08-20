import { okResult } from "@/lib/transformers/builders";
import { parseCount, parseRange } from "@/lib/random/params";
import { randomFloat, randomFraction, randomInt, randomPrime } from "@/lib/random/random";
import type { TransformationResult } from "@/types/transformation";

export function randomNumberGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const [min, max] = parseRange(input, 0, 1000);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomFloat(min, max).toFixed(2));
  }
  return okResult(input, parts.join("\n"), "RANDOM_NUMBER", "TEXT", "Random numbers generated", "TEXT");
}

export function randomFractionGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomFraction());
  }
  return okResult(input, parts.join("\n"), "RANDOM_FRACTION", "TEXT", "Random fractions generated", "TEXT");
}

export function randomIntegerGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(String(randomInt(0, 100_000)));
  }
  return okResult(input, parts.join("\n"), "RANDOM_INTEGER", "TEXT", "Random integers generated", "TEXT");
}

export function randomIntegerRangeGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const [min, max] = parseRange(input, 0, 100);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(String(randomInt(min, max)));
  }
  return okResult(
    input,
    parts.join("\n"),
    "RANDOM_INTEGER_RANGE",
    "TEXT",
    "Random integers generated in range",
    "TEXT",
  );
}

export function randomDecimalGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const [min, max] = parseRange(input, 0, 100);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomFloat(min, max).toFixed(6));
  }
  return okResult(input, parts.join("\n"), "RANDOM_DECIMAL", "TEXT", "Random decimals generated", "TEXT");
}

export function randomPrimeGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(String(randomPrime(1000)));
  }
  return okResult(input, parts.join("\n"), "RANDOM_PRIME", "TEXT", "Random primes generated", "TEXT");
}