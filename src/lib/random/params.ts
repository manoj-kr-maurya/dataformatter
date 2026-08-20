/** Parse a count from user input; falls back to `fallback` when blank/invalid. */
export function parseCount(input: string, fallback = 5): number {
  const trimmed = input.trim();
  if (!trimmed) {
    return fallback;
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    return fallback;
  }
  return Math.min(n, 1000);
}

/** Parse "min max" (space/comma separated) into a range; falls back to defaults. */
export function parseRange(
  input: string,
  fallbackMin: number,
  fallbackMax: number,
): [number, number] {
  const parts = input
    .trim()
    .split(/[\s,]+/)
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n));
  if (parts.length >= 2) {
    const min = Math.min(parts[0], parts[1]);
    const max = Math.max(parts[0], parts[1]);
    return [min, max];
  }
  if (parts.length === 1) {
    return [parts[0], Math.max(parts[0], fallbackMax)];
  }
  return [fallbackMin, fallbackMax];
}

/** Parse "WxH" (or "W x H" / "W,H") into dimensions; falls back to defaults. */
export function parseDims(input: string, fallbackWidth = 8, fallbackHeight = 8): [number, number] {
  const parts = input
    .trim()
    .toLowerCase()
    .split(/[x,\s]+/)
    .map((p) => p.replace(/[^0-9]/g, ""))
    .filter((p) => p.length > 0)
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (parts.length >= 2) {
    return [Math.max(1, Math.min(parts[0], 100)), Math.max(1, Math.min(parts[1], 100))];
  }
  if (parts.length === 1) {
    const size = Math.max(1, Math.min(parts[0], 100));
    return [size, size];
  }
  return [fallbackWidth, fallbackHeight];
}