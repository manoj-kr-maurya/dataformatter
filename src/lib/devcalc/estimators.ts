/**
 * Throughput, storage and capacity estimators — all plain client-side math
 * with the formulas stated in the UI. Clearly estimates, not guarantees.
 */

const DAY_SECONDS = 86400;
const MONTH_SECONDS = 30 * DAY_SECONDS;

/** Binary-prefix size with two decimals (estimators show transparent math). */
export function formatBytesPrecise(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB", "PB"];
  let value = bytes;
  let unit = "B";
  for (const next of units) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  return `${value.toFixed(2)} ${unit}`;
}

/** Little's law: concurrency = RPS × average latency (seconds). */
export function computeConcurrency(rps: number, latencyMs: number): number {
  if (rps < 0 || latencyMs < 0) throw new Error("RPS and latency must not be negative.");
  return rps * (latencyMs / 1000);
}

export function rpsPerUnit(rps: number): { perMinute: number; perHour: number; perDay: number } {
  return { perMinute: rps * 60, perHour: rps * 3600, perDay: rps * DAY_SECONDS };
}

export interface BandwidthResult {
  bytesPerSec: number;
  kbPerSec: number;
  mbPerSec: number;
  gbPerDay: number;
  gbPerMonth: number;
  tbPerMonth: number;
}

export function computeBandwidth(rps: number, requestBytes: number, responseBytes: number): BandwidthResult {
  if (rps < 0 || requestBytes < 0 || responseBytes < 0) throw new Error("Values must not be negative.");
  const perRequest = requestBytes + responseBytes;
  const bytesPerSec = rps * perRequest;
  return {
    bytesPerSec,
    kbPerSec: bytesPerSec / 1e3,
    mbPerSec: bytesPerSec / 1e6,
    gbPerDay: (bytesPerSec * DAY_SECONDS) / 1e9,
    gbPerMonth: (bytesPerSec * MONTH_SECONDS) / 1e9,
    tbPerMonth: (bytesPerSec * MONTH_SECONDS) / 1e12,
  };
}

export interface StorageInput {
  records: number;
  recordBytes: number;
  dailyGrowthRecords: number;
  retentionDays: number;
  replication: number;
  overheadPct: number;
}

export interface StorageResult {
  rawBytes: number;
  overheadBytes: number;
  replicatedBytes: number;
  dailyGrowthBytes: number;
  monthlyGrowthBytes: number;
  retentionBytes: number;
  rawLabel: string;
  retentionLabel: string;
  dailyGrowthLabel: string;
}

export function estimateStorage(input: StorageInput): StorageResult {
  const records = clampNonNegative(input.records, "Records");
  const recordBytes = Math.max(0, input.recordBytes);
  const dailyGrowth = clampNonNegative(input.dailyGrowthRecords, "Daily growth");
  const retention = clampNonNegative(input.retentionDays, "Retention");
  const replication = Math.max(1, input.replication);
  const overheadFactor = 1 + divisor(input.overheadPct, "Overhead");

  const rawBytes = records * recordBytes;
  const overheadBytes = rawBytes * overheadFactor;
  const replicatedBytes = overheadBytes * replication;
  const dailyGrowthBytes = dailyGrowth * recordBytes;
  const monthlyGrowthBytes = dailyGrowthBytes * 30;
  const retentionBytes = dailyGrowthBytes * retention + replicatedBytes;

  return {
    rawBytes,
    overheadBytes,
    replicatedBytes,
    dailyGrowthBytes,
    monthlyGrowthBytes,
    retentionBytes,
    rawLabel: formatBytesPrecise(rawBytes),
    retentionLabel: formatBytesPrecise(retentionBytes),
    dailyGrowthLabel: formatBytesPrecise(dailyGrowthBytes),
  };
}

function clampNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative number.`);
  return value;
}

function divisor(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative number.`);
  return value / 100;
}

export interface CacheInput {
  keys: number;
  keyBytes: number;
  valueBytes: number;
  overheadPct: number;
  replication: number;
  headroomPct: number;
}

export interface CacheResult {
  rawSizeBytes: number;
  perKeyBytes: number;
  overheadBytes: number;
  replicatedBytes: number;
  recommendedBytes: number;
  rawLabel: string;
  estimatedLabel: string;
  recommendedLabel: string;
}

export function estimateCache(input: CacheInput): CacheResult {
  const keys = clampNonNegative(input.keys, "Keys");
  const keyBytes = Math.max(0, input.keyBytes);
  const valueBytes = Math.max(0, input.valueBytes);
  const replication = Math.max(1, input.replication);
  const overheadFactor = 1 + divisor(input.overheadPct, "Overhead");
  const headroomFactor = 1 + divisor(input.headroomPct, "Headroom");

  const perKeyBytes = (keyBytes + valueBytes) * overheadFactor;
  const rawSizeBytes = keys * (keyBytes + valueBytes);
  const overheadBytes = keys * perKeyBytes;
  const replicatedBytes = overheadBytes * replication;
  const recommendedBytes = replicatedBytes * headroomFactor;

  return {
    rawSizeBytes,
    perKeyBytes,
    overheadBytes,
    replicatedBytes,
    recommendedBytes,
    rawLabel: formatBytesPrecise(rawSizeBytes),
    estimatedLabel: formatBytesPrecise(replicatedBytes),
    recommendedLabel: formatBytesPrecise(recommendedBytes),
  };
}

export interface QueueInput {
  eventsPerSec: number;
  eventBytes: number;
  retentionDays: number;
  replication: number;
}

export interface QueueResult {
  eventsPerDay: number;
  eventsPerMonth: number;
  rawPerDayBytes: number;
  rawPerMonthBytes: number;
  retainedBytes: number;
  replicatedBytes: number;
  throughputPerSecBytes: number;
  eventsPerDayLabel: string;
  eventsPerMonthLabel: string;
  rawPerDayLabel: string;
  retainedLabel: string;
}

export function estimateQueue(input: QueueInput): QueueResult {
  const eventsPerSec = clampNonNegative(input.eventsPerSec, "Events/sec");
  const eventBytes = Math.max(0, input.eventBytes);
  const retention = clampNonNegative(input.retentionDays, "Retention");
  const replication = Math.max(1, input.replication);

  const eventsPerDay = eventsPerSec * DAY_SECONDS;
  const eventsPerMonth = eventsPerSec * MONTH_SECONDS;
  const rawPerDayBytes = eventsPerDay * eventBytes;
  const rawPerMonthBytes = eventsPerMonth * eventBytes;
  const retainedBytes = rawPerDayBytes * retention;
  const replicatedBytes = retainedBytes * replication;

  return {
    eventsPerDay,
    eventsPerMonth,
    rawPerDayBytes,
    rawPerMonthBytes,
    retainedBytes,
    replicatedBytes,
    throughputPerSecBytes: eventsPerSec * eventBytes,
    eventsPerDayLabel: eventsPerDay.toLocaleString("en-US"),
    eventsPerMonthLabel: eventsPerMonth.toLocaleString("en-US"),
    rawPerDayLabel: formatBytesPrecise(rawPerDayBytes),
    retainedLabel: formatBytesPrecise(retainedBytes),
  };
}