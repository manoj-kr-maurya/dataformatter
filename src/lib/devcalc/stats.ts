/**
 * Statistics calculator — comma/whitespace/newline separated numbers with
 * graceful handling of junk tokens. Uses the sample variance (n-1) and
 * linearly-interpolated percentiles.
 */

export interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  variance: number;
  stdDev: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export function parseNumberList(text: string): { values: number[]; skipped: number } {
  const values: number[] = [];
  let skipped = 0;
  for (const token of text.split(/[,\s]+/)) {
    if (token === "") continue;
    const value = Number(token);
    if (Number.isNaN(value)) {
      skipped++;
      continue;
    }
    values.push(value);
  }
  return { values, skipped };
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * q;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
}

export function computeStats(text: string): StatsResult | null {
  const { values } = parseNumberList(text);
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;
  const median = percentile(sorted, 0.5);
  const min = sorted[0];
  const max = sorted[count - 1];
  const range = max - min;

  const frequencies = new Map<number, number>();
  for (const v of values) frequencies.set(v, (frequencies.get(v) ?? 0) + 1);
  let modeFreq = 0;
  for (const freq of frequencies.values()) modeFreq = Math.max(modeFreq, freq);
  const mode = modeFreq > 1 ? [...frequencies.entries()].filter(([, f]) => f === modeFreq).map(([v]) => v) : [];

  const variance = count > 1 ? values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (count - 1) : 0;
  const stdDev = Math.sqrt(variance);

  return {
    count,
    sum,
    mean,
    median,
    mode,
    min,
    max,
    range,
    variance,
    stdDev,
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
  };
}

export function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "∞";
  return Number(value.toFixed(digits)).toLocaleString("en-US", { maximumFractionDigits: digits });
}