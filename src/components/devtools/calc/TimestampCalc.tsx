"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { Button } from "@/components/ui/button";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, SelectField, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { parseTimestamp } from "@/lib/timestamp/convert";

const UNIT_MS: Record<string, number> = { seconds: 1000, minutes: 60000, hours: 3600000, days: 86400000, weeks: 604800000 };

interface Parts {
  milliseconds: number;
  seconds: number;
  microseconds: number;
  nanoseconds: number;
  iso: string;
  utc: string;
  local: string;
}

function toParts(ms: number): Parts {
  const date = new Date(ms);
  return {
    milliseconds: ms,
    seconds: Math.floor(ms / 1000),
    microseconds: Math.floor(ms / 1000) * 1_000_000,
    nanoseconds: Math.floor(ms / 1000) * 1_000_000_000,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
  };
}

function humanDuration(ms: number): string {
  return ms
    .toLocaleString("en-US")
    .concat(` ms (~${(ms / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 })} s)`);
}

export function TimestampCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [value, setValue] = useState("1750000000");
  const [mode, setMode] = useState("from-timestamp");
  const [duration, setDuration] = useState("1");
  const [durationUnit, setDurationUnit] = useState("days");
  const [addSubtract, setAddSubtract] = useState("add");
  const [durationBase, setDurationBase] = useState("1750000000");

  const result = useMemo(() => {
    if (mode === "from-timestamp") {
      const parsed = parseTimestamp(value);
      if (!parsed.valid) return { parts: null, error: parsed.reason ?? "Cannot parse that value." };
      return { parts: toParts(parsed.ms as number), error: null as string | null };
    }
    const base = parseTimestamp(durationBase);
    if (!base.valid || base.ms == null) return { parts: null, error: base.reason ?? "Cannot parse the base date." };
    const amount = Number(duration);
    if (!Number.isFinite(amount)) return { parts: null, error: "Enter a numeric duration." };
    const delta = amount * (UNIT_MS[durationUnit] ?? 1000) * (addSubtract === "subtract" ? -1 : 1);
    return { parts: toParts(base.ms + delta), error: null as string | null };
  }, [mode, value, duration, durationUnit, addSubtract, durationBase]);

  useCalcLog(onLog, mode === "from-timestamp" ? `timestamp ${value}` : `${addSubtract} ${duration} ${durationUnit} to ${durationBase}`, result.parts ? result.parts.iso : null);

  const setNow = () => setValue(String(Date.now()));
  const setNowBase = () => setDurationBase(String(Date.now()));

  const durationMs = UNIT_MS[durationUnit];
  const durationSeconds =
    mode === "duration" && Number.isFinite(Number(duration))
      ? Math.abs(Number(duration)) * durationMs
      : 0;

  return (
    <>
      <Toolbox
        title={mode === "from-timestamp" ? "Timestamp → date" : "Date + duration"}
        actions={
          <ClearButton
            onClick={() => (mode === "from-timestamp" ? setValue("") : setDuration(""))}
            disabled={mode === "from-timestamp" ? value.length === 0 : duration.length === 0}
          />
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <SelectField label="Mode" value={mode} onChange={setMode} options={["from-timestamp", "duration"]} width="w-40" />
          {mode === "from-timestamp" ? (
            <>
              <NumberField label="Value" value={value} onChange={setValue} placeholder="1750000000" inputMode="text" width="w-44" />
              <Button variant="secondary" size="sm" onClick={setNow}>
                Now
              </Button>
            </>
          ) : (
            <>
              <NumberField label="Start date" value={durationBase} onChange={setDurationBase} placeholder="2025-01-15T16:00:00Z" inputMode="text" width="w-52" />
              <NumberField label="Duration" value={duration} onChange={setDuration} placeholder="1" inputMode="decimal" width="w-20" />
              <SelectField label="Unit" value={durationUnit} onChange={setDurationUnit} options={["seconds", "minutes", "hours", "days", "weeks"]} width="w-24" />
              <SelectField label="Operation" value={addSubtract} onChange={setAddSubtract} options={["add", "subtract"]} width="w-28" />
              <Button variant="secondary" size="sm" onClick={setNowBase}>
                Start from now
              </Button>
            </>
          )}
        </div>
        <Hint>Accepts Unix seconds (≤11 digits), Unix milliseconds (13), ISO 8601 and HTTP dates. UTC and local are labelled; local follows your browser.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.parts ? (
        <>
          <Toolbox title="Converted date" actions={<CopyButton text={result.parts.iso} label="Copy ISO" />}>
            <BigValue value={result.parts.iso} copy={result.parts.iso} tone="ok" />
            <p className="mt-2 px-1 text-xs text-zinc-500 dark:text-zinc-400">{result.parts.utc} (UTC)</p>
          </Toolbox>
          <Toolbox title="All epochs">
            <ResultGrid>
              <ResultRow label="Seconds" value={result.parts.seconds} copy={String(result.parts.seconds)} />
              <ResultRow label="Milliseconds" value={result.parts.milliseconds} copy={String(result.parts.milliseconds)} />
              <ResultRow label="Microseconds" value={result.parts.microseconds} copy={String(result.parts.microseconds)} />
              <ResultRow label="Nanoseconds" value={result.parts.nanoseconds} copy={String(result.parts.nanoseconds)} />
              <ResultRow label="UTC" value={result.parts.utc} copy={result.parts.utc} />
              <ResultRow label="Local" value={result.parts.local} copy={result.parts.local} suppressHydrationWarning />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}

      {mode === "duration" && (
        <Toolbox title="Duration equivalences">
          <ResultGrid>
            <ResultRow label="Milliseconds" value={humanDuration(durationSeconds)} copy={String(durationSeconds)} />
            <ResultRow label="Seconds" value={durationSeconds / 1000} copy={String(durationSeconds / 1000)} />
            <ResultRow label="Minutes" value={durationSeconds / 60000} copy={String(durationSeconds / 60000)} />
            <ResultRow label="Hours" value={durationSeconds / 3600000} copy={String(durationSeconds / 3600000)} />
            <ResultRow label="Days" value={durationSeconds / 86400000} copy={String(durationSeconds / 86400000)} />
          </ResultGrid>
        </Toolbox>
      )}
    </>
  );
}