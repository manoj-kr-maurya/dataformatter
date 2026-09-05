"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { Button } from "@/components/ui/button";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, SelectField, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { parseTimestamp } from "@/lib/timestamp/convert";
import { parseDurationString, breakdownDuration, formatDurationBreakdown } from "@/lib/devcalc/time";

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
  const [diffStart, setDiffStart] = useState("1750000000");
  const [diffEnd, setDiffEnd] = useState("1750068000");

  const durationMsParsed = useMemo(() => {
    if (!/^\d+(\.\d+)?$/.test(duration.trim())) {
      try {
        return { ms: parseDurationString(duration), compound: true as const };
      } catch {
        return { ms: null as number | null, compound: true as const };
      }
    }
    return { ms: Number(duration) * (UNIT_MS[durationUnit] ?? 1000), compound: false as const };
  }, [duration, durationUnit]);

  const result = useMemo(() => {
    if (mode === "from-timestamp") {
      const parsed = parseTimestamp(value);
      if (!parsed.valid) return { parts: null, error: parsed.reason ?? "Cannot parse that value." };
      return { parts: toParts(parsed.ms as number), error: null as string | null };
    }
    if (mode === "difference") {
      const start = parseTimestamp(diffStart);
      const end = parseTimestamp(diffEnd);
      if (!start.valid || start.ms == null) return { parts: null, error: start.reason ?? "Cannot parse the start date." };
      if (!end.valid || end.ms == null) return { parts: null, error: end.reason ?? "Cannot parse the end date." };
      const delta = end.ms - start.ms;
      return { parts: null, error: null as string | null, difference: { delta, start: start.ms, end: end.ms } };
    }
    const base = parseTimestamp(durationBase);
    if (!base.valid || base.ms == null) return { parts: null, error: base.reason ?? "Cannot parse the base date." };
    if (durationMsParsed.ms == null) return { parts: null, error: `Cannot read "${duration}". Use 2h 35m 20s or a number.` };
    const delta = durationMsParsed.ms * (addSubtract === "subtract" ? -1 : 1);
    return { parts: toParts(base.ms + delta), error: null as string | null, difference: null };
  }, [mode, value, duration, addSubtract, durationBase, diffStart, diffEnd, durationMsParsed.ms]);

  useCalcLog(
    onLog,
    mode === "from-timestamp"
      ? `timestamp ${value}`
      : mode === "difference"
        ? `difference ${diffStart} → ${diffEnd}`
        : `${addSubtract} ${duration}${durationMsParsed.compound ? "" : " " + durationUnit} to ${durationBase}`,
    mode === "difference" && result.difference
      ? `elapsed ${formatDurationBreakdown(Math.abs(result.difference.delta))}`
      : result.parts
        ? result.parts.iso
        : null,
  );

  const setNow = () => setValue(String(Date.now()));
  const setNowBase = () => setDurationBase(String(Date.now()));
  const setNowStart = () => setDiffStart(String(Date.now()));
  const setNowEnd = () => setDiffEnd(String(Date.now()));

  return (
    <>
      <Toolbox
        title={mode === "from-timestamp" ? "Timestamp → date" : mode === "difference" ? "Timestamp difference" : "Date + duration"}
        actions={
          <ClearButton
            onClick={() => (mode === "from-timestamp" ? setValue("") : mode === "difference" ? setDiffStart("") : setDuration(""))}
            disabled={mode === "from-timestamp" ? value.length === 0 : mode === "difference" ? diffStart.length === 0 : duration.length === 0}
          />
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <SelectField label="Mode" value={mode} onChange={setMode} options={["from-timestamp", "duration", "difference"]} width="w-40" />
          {mode === "from-timestamp" ? (
            <>
              <NumberField label="Value" value={value} onChange={setValue} placeholder="1750000000" inputMode="text" width="w-44" />
              <Button variant="secondary" size="sm" onClick={setNow}>
                Now
              </Button>
            </>
          ) : mode === "difference" ? (
            <>
              <NumberField label="Start" value={diffStart} onChange={setDiffStart} placeholder="2025-01-15T16:00:00Z" inputMode="text" width="w-52" />
              <Button variant="secondary" size="sm" onClick={setNowStart}>
                Now
              </Button>
              <NumberField label="End" value={diffEnd} onChange={setDiffEnd} placeholder="2025-01-15T18:00:00Z" inputMode="text" width="w-52" />
              <Button variant="secondary" size="sm" onClick={setNowEnd}>
                Now
              </Button>
            </>
          ) : (
            <>
              <NumberField label="Start date" value={durationBase} onChange={setDurationBase} placeholder="2025-01-15T16:00:00Z" inputMode="text" width="w-52" />
              <NumberField label="Duration" value={duration} onChange={setDuration} placeholder="2h 35m 20s" inputMode="text" width="w-28" />
              <SelectField label="Unit" value={durationUnit} onChange={setDurationUnit} options={["seconds", "minutes", "hours", "days", "weeks"]} width="w-24" />
              <SelectField label="Operation" value={addSubtract} onChange={setAddSubtract} options={["add", "subtract"]} width="w-28" />
              <Button variant="secondary" size="sm" onClick={setNowBase}>
                Start from now
              </Button>
            </>
          )}
        </div>
        <Hint>
          {mode === "duration"
            ? "Accept plain numbers (x the unit) or compound durations like 2h 35m 20s / 1w 2d. When compound, the unit selector is ignored."
            : mode === "difference"
              ? "Two timestamps → elapsed time. Each accepts Unix seconds (≤11 digits), Unix milliseconds (13), ISO 8601 or HTTP dates."
              : "Accepts Unix seconds (≤11 digits), Unix milliseconds (13), ISO 8601 and HTTP dates. UTC and local are labelled; local follows your browser."}
        </Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : mode === "difference" && result.difference ? (
        <>
          <Toolbox title="Elapsed" actions={<CopyButton text={formatDurationBreakdown(Math.abs(result.difference.delta))} label="Copy" />}>
            <BigValue
              value={`${result.difference.delta >= 0 ? "" : "-"}${formatDurationBreakdown(Math.abs(result.difference.delta))}`}
              copy={formatDurationBreakdown(Math.abs(result.difference.delta))}
              tone={result.difference.delta >= 0 ? "ok" : "warn"}
            />
            <p className="mt-2 px-1 text-xs text-zinc-500 dark:text-zinc-400">
              {result.difference.end >= result.difference.start ? "End is after start" : "End is before start"} · start {new Date(result.difference.start).toISOString()} → end {new Date(result.difference.end).toISOString()}
            </p>
          </Toolbox>
          <Toolbox title="Breakdown">
            <ResultGrid>
              <ResultRow label="Milliseconds" value={Math.abs(result.difference.delta).toLocaleString("en-US")} copy={String(Math.abs(result.difference.delta))} />
              <ResultRow label="Seconds" value={(Math.abs(result.difference.delta) / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 })} copy={String(Math.abs(result.difference.delta) / 1000)} />
              <ResultRow label="Minutes" value={(Math.abs(result.difference.delta) / 60000).toLocaleString("en-US", { maximumFractionDigits: 3 })} copy={String(Math.abs(result.difference.delta) / 60000)} />
              <ResultRow label="Hours" value={(Math.abs(result.difference.delta) / 3600000).toLocaleString("en-US", { maximumFractionDigits: 3 })} copy={String(Math.abs(result.difference.delta) / 3600000)} />
              <ResultRow label="Days" value={(Math.abs(result.difference.delta) / 86400000).toLocaleString("en-US", { maximumFractionDigits: 3 })} copy={String(Math.abs(result.difference.delta) / 86400000)} />
              <ResultRow label="Weeks" value={(Math.abs(result.difference.delta) / 604800000).toLocaleString("en-US", { maximumFractionDigits: 3 })} copy={String(Math.abs(result.difference.delta) / 604800000)} />
            </ResultGrid>
          </Toolbox>
        </>
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

      {mode === "duration" && durationMsParsed.ms != null && (
        <Toolbox
          title="Duration equivalences"
          actions={<CopyButton text={`${formatDurationBreakdown(durationMsParsed.ms)} = ${durationMsParsed.ms} ms`} label="Copy all" />}
        >
          <ResultGrid>
            <ResultRow label="Compact" value={formatDurationBreakdown(durationMsParsed.ms)} copy={breakdownDuration(durationMsParsed.ms).days + "d " + breakdownDuration(durationMsParsed.ms).hours + "h"} />
            <ResultRow label="Milliseconds" value={humanDuration(durationMsParsed.ms)} copy={String(durationMsParsed.ms)} />
            <ResultRow label="Seconds" value={durationMsParsed.ms / 1000} copy={String(durationMsParsed.ms / 1000)} />
            <ResultRow label="Minutes" value={durationMsParsed.ms / 60000} copy={String(durationMsParsed.ms / 60000)} />
            <ResultRow label="Hours" value={durationMsParsed.ms / 3600000} copy={String(durationMsParsed.ms / 3600000)} />
            <ResultRow label="Days" value={durationMsParsed.ms / 86400000} copy={String(durationMsParsed.ms / 86400000)} />
            <ResultRow label="Weeks" value={durationMsParsed.ms / 604800000} copy={String(durationMsParsed.ms / 604800000)} />
          </ResultGrid>
        </Toolbox>
      )}
    </>
  );
}