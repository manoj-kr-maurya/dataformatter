/** Return an integer in [min, max] inclusive. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomChoice(values: string | readonly string[]): string {
  const pool = typeof values === "string" ? values : values;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pick(n: number, values: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(randomChoice(values));
  }
  return out;
}

/** Fisher–Yates shuffle. */
export function shuffle<T>(values: readonly T[]): T[] {
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/** Random lowercase hex string of `length` characters. */
export function randomHex(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += randomChoice("0123456789abcdef");
  }
  return out;
}

export function randomDigits(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += randomInt(0, 9).toString();
  }
  return out;
}

export function randomBinary(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += randomInt(0, 1).toString();
  }
  return out;
}

export function randomLetters(length: number): string {
  const pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += randomChoice(pool);
  }
  return out;
}

export function randomAlphanumeric(length: number): string {
  const pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += randomChoice(pool);
  }
  return out;
}

/** RFC 4122 version 4 UUID. */
export function randomUuid(): string {
  const hex = randomHex(32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${randomChoice("89ab")}${hex.slice(17, 20)}-${hex.slice(20)}`;
}

/** Random IPv4 address. */
export function randomIpv4(): string {
  return [randomInt(1, 223), randomInt(0, 255), randomInt(0, 255), randomInt(1, 254)].join(".");
}

/** Random MAC address with the given speaker (byte) separators. */
export function randomMac(separator: ":" | "-" = ":"): string {
  const parts: string[] = [];
  for (let i = 0; i < 6; i++) {
    parts.push(randomHex(2));
  }
  return parts.join(separator);
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

export function randomPrime(limit: number): number {
  for (;;) {
    const n = randomInt(2, limit);
    if (isPrime(n)) {
      return n;
    }
  }
}

/** Random time-of-day formatted HH:MM:SS. */
export function randomTime(): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(randomInt(0, 23))}:${pad(randomInt(0, 59))}:${pad(randomInt(0, 59))}`;
}

/** Random ISO date within roughly the past 50 years. */
export function randomDate(): string {
  const now = Date.now();
  const offset = randomInt(0, 50 * 365 * 24 * 60 * 60 * 1000);
  return new Date(now - offset).toISOString();
}

/** Random fraction string, e.g. "3/7". */
export function randomFraction(): string {
  return `${randomInt(1, 99)}/${randomInt(2, 99)}`;
}