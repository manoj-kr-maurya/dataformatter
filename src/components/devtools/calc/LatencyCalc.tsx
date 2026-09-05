"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, SelectField, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";

const UNIT_FACTOR: Record<string, number> = {
  ns: 1e-6,
  "μs": 1e-3,
  ms: 1,
  s: 1000,
  min: 60000,
};

const UNIT_ORDER = ["ns", "μs", "ms", "s", "min"] as const;
const UNIT_OPTIONS = [...UNIT_ORDER];

function fmt(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function LatencyCalc({ onLog, initValue }: { onLog?: (entry: CalcLogEntry) => void; initValue?: string }) {
  const [value, setValue] = useState(() => initValue?.split(":")[0] ?? "150");
  const [unit, setUnit] = useState(() => {
    if (initValue) {
      const nu = initValue.split(":")[1];
      if (nu != null && (UNIT_ORDER as readonly string[]).includes(nu)) return nu;
    }
    return "ms";
  });

  const result = useMemo(() => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return { ms: null, error: "Enter a non-negative number of " + unit + "." };
    const ms = amount * (UNIT_FACTOR[unit] ?? 1);
    return { ms, error: null as string | null };
  }, [value, unit]);

  const ms = result.ms;

  const conversions = useMemo(() => {
    if (ms == null) return null;
    return {
      ns: ms * 1e6,
      us: ms * 1e3,
      ms,
      s: ms / 1e3,
      min: ms / 6e4,
    };
  }, [ms]);

  useCalcLog(onLog, `latency ${value} ${unit}`, ms != null ? `${fmt(ms)} ms` : null);

  return (
    <>
      <Toolbox title="Latency" actions={<ClearButton onClick={() => setValue("")} disabled={value.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Value" value={value} onChange={setValue} placeholder="150" inputMode="decimal" width="w-28" />
          <SelectField label="Unit" value={unit} onChange={setUnit} options={UNIT_OPTIONS} width="w-24" />
        </div>
        <Hint>Convert a latency across nanoseconds to minutes. 1 s = 1,000 ms = 1,000,000 μs = 1,000,000,000 ns.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : conversions ? (
        <>
          <Toolbox title="Result" actions={ms != null ? <CopyButton text={`${fmt(ms)} ms`} label="Copy" /> : undefined}>
            <BigValue value={`${ms != null ? fmt(ms) : ""} ms`} copy={ms != null ? `${ms} ms` : undefined} tone="ok" />
          </Toolbox>
          <Toolbox title="Conversions" actions={<CopyButton text={`${value} ${unit} = ${fmt(conversions.ns)} ns = ${fmt(conversions.us)} μs = ${fmt(conversions.s)} s`} label="Copy all" />}>
            <ResultGrid>
              <ResultRow label="Nanoseconds" value={fmt(conversions.ns)} copy={String(conversions.ns)} />
              <ResultRow label="Microseconds" value={fmt(conversions.us)} copy={String(conversions.us)} />
              <ResultRow label="Milliseconds" value={fmt(conversions.ms)} copy={String(conversions.ms)} />
              <ResultRow label="Seconds" value={fmt(conversions.s)} copy={String(conversions.s)} />
              <ResultRow label="Minutes" value={fmt(conversions.min)} copy={String(conversions.min)} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}