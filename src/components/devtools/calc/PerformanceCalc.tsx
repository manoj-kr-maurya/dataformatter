"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { computeConcurrency, rpsPerUnit } from "@/lib/devcalc/estimators";

export function PerformanceCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [rps, setRps] = useState("2000");
  const [latency, setLatency] = useState("150");

  const rpsNum = Number(rps);
  const latencyNum = Number(latency);

  const result = useMemo(() => {
    if (!Number.isFinite(rpsNum) || !Number.isFinite(latencyNum) || rpsNum < 0 || latencyNum < 0) {
      return { concurrency: null, units: null, error: "RPS and latency must be non-negative numbers." };
    }
    return { concurrency: computeConcurrency(rpsNum, latencyNum), units: rpsPerUnit(rpsNum), error: null as string | null };
  }, [rpsNum, latencyNum]);

  useCalcLog(onLog, `${rps} RPS · ${latency} ms latency`, result.concurrency != null ? `${result.concurrency} concurrent requests` : null);

  const summary = result.concurrency != null ? `Concurrency = ${rps} × ${latencyNum / 1000} s = ${result.concurrency}` : "";

  return (
    <>
      <Toolbox title="Inputs" actions={<ClearButton onClick={() => { setRps(""); setLatency(""); }} disabled={rps.length === 0 && latency.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Requests/sec" value={rps} onChange={setRps} placeholder="2000" inputMode="decimal" width="w-28" />
          <NumberField label="Avg latency" value={latency} onChange={setLatency} placeholder="150" inputMode="decimal" width="w-24" unit="ms" />
        </div>
        <Hint>Concurrency = RPS × latency (seconds). This is Little&apos;s law: the average number of in-flight requests the system must sustain.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : (
        <>
          <Toolbox title="Concurrency" actions={result.concurrency != null ? <StatusChip label="in-flight" value={result.concurrency} tone="ok" /> : undefined}>
            <BigValue value={result.concurrency != null ? result.concurrency.toLocaleString("en-US") : ""} copy={summary} tone="ok" />
          </Toolbox>
          <Toolbox title="Request rate" actions={result.units ? <CopyButton text={summary} label="Copy all" /> : undefined}>
            <ResultGrid>
              <ResultRow label="Per second" value={result.units ? rpsNum.toLocaleString("en-US") : ""} copy={String(rpsNum)} />
              <ResultRow label="Per minute" value={result.units ? result.units.perMinute.toLocaleString("en-US") : ""} copy={String(result.units?.perMinute)} />
              <ResultRow label="Per hour" value={result.units ? result.units.perHour.toLocaleString("en-US") : ""} copy={String(result.units?.perHour)} />
              <ResultRow label="Per day" value={result.units ? result.units.perDay.toLocaleString("en-US") : ""} copy={String(result.units?.perDay)} />
            </ResultGrid>
          </Toolbox>
        </>
      )}
    </>
  );
}