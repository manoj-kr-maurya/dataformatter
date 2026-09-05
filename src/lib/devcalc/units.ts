/**
 * Data-size conversions — decimal (KB = 1000 B) vs binary (KiB = 1024 B)
 * clearly separated. Values are exact for common ranges and displayed with
 * grouped thousands when integral.
 */

export const DECIMAL_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
export const BINARY_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;

export const DECIMAL_MULT: Record<string, number> = {
  B: 1,
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
  PB: 1e15,
};

export const BINARY_MULT: Record<string, number> = {
  B: 1,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
  PiB: 1024 ** 5,
};

export interface SizeRow {
  system: "decimal" | "binary";
  unit: string;
  bytes: number;
  value: number;
  rendered: string;
}

/** Format a quantity with grouped thousands; decimals at sensible precision. */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  if (Number.isInteger(value)) return value.toLocaleString("en-US");
  if (Math.abs(value) >= 100) return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return value.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

/** All conversions for `value` expressed in `fromUnit` (any known unit). */
export function sizeConversions(value: number, fromUnit: string): SizeRow[] {
  if (!Number.isFinite(value) || value < 0) throw new Error("Enter a non-negative number.");
  const fromKey = fromUnit.trim();
  const isBytesInput = fromKey === "" || fromKey === "B";
  const mult = isBytesInput ? 1 : DECIMAL_MULT[fromKey] ?? BINARY_MULT[fromKey];
  if (!isBytesInput && mult === undefined) throw new Error(`Unknown unit "${fromUnit}".`);
  const bytes = value * mult;

  const rows: SizeRow[] = [];
  for (const unit of DECIMAL_UNITS) {
    const amount = bytes / DECIMAL_MULT[unit];
    rows.push({ system: "decimal", unit, bytes, value: amount, rendered: formatQuantity(amount) });
  }
  for (const unit of BINARY_UNITS) {
    const amount = bytes / BINARY_MULT[unit];
    rows.push({ system: "binary", unit, bytes, value: amount, rendered: formatQuantity(amount) });
  }
  return rows;
}

export function exactBytes(bytes: number): string {
  return Number.isInteger(bytes) ? bytes.toLocaleString("en-US") : bytes.toLocaleString("en-US", { maximumFractionDigits: 3 });
}