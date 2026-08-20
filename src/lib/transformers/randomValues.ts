import { failResult, okResult } from "@/lib/transformers/builders";
import { parseCount } from "@/lib/random/params";
import {
  randomBinary,
  randomDate,
  randomHex,
  randomIpv4,
  randomInt,
  randomMac,
  randomTime,
  randomUuid,
} from "@/lib/random/random";
import type { TransformationResult } from "@/types/transformation";

export function randomIp(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomIpv4());
  }
  return okResult(input, parts.join("\n"), "RANDOM_IP", "TEXT", "Random IP addresses generated", "TEXT");
}

export function randomTimeGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomTime());
  }
  return okResult(input, parts.join("\n"), "RANDOM_TIME", "TEXT", "Random times generated", "TEXT");
}

export function randomUuidGenerator(input: string): TransformationResult {
  const count = parseCount(input, 5);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomUuid());
  }
  return okResult(input, parts.join("\n"), "RANDOM_UUID", "TEXT", "Random UUIDs generated", "TEXT");
}

export function randomMacGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomMac(":"));
  }
  return okResult(input, parts.join("\n"), "RANDOM_MAC", "TEXT", "Random MAC addresses generated", "TEXT");
}

export function randomHexGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomHex(32));
  }
  return okResult(input, parts.join("\n"), "RANDOM_HEX", "TEXT", "Random hex generated", "TEXT");
}

export function randomDateGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomDate());
  }
  return okResult(input, parts.join("\n"), "RANDOM_DATE", "TEXT", "Random dates generated", "TEXT");
}

export function randomBinaryGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomBinary(8));
  }
  return okResult(input, parts.join("\n"), "RANDOM_BINARY", "TEXT", "Random binary generated", "TEXT");
}

export function randomByteGenerator(input: string): TransformationResult {
  const count = parseCount(input);
  if (count > 1000) {
    return failResult(input, "Keep the count at or under 1000.", "TEXT", "TEXT");
  }
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(String(randomInt(0, 255)));
  }
  return okResult(input, parts.join("\n"), "RANDOM_BYTE", "TEXT", "Random bytes generated", "TEXT");
}