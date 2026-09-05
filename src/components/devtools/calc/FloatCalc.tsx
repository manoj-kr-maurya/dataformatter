"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, SelectField, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { floatDetails, floatLayout, type FloatWidth } from "@/lib/devcalc/float";

export function FloatCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [value, setValue] = useState("3.14");
  const [width, setWidth] = useState("32");

  const result = useMemo(() => {
    const parsed = Number(value);
    if (value.trim() === "" || Number.isNaN(parsed)) return { data: null, error: "Enter a finite number or a format like 0.1, 1e3." };
    const floatWidth: FloatWidth = width === "64" ? 64 : 32;
    return { data: floatDetails(parsed, floatWidth), error: null as string | null };
  }, [value, width]);

  useCalcLog(onLog, `float${width} ${value}`, result.data ? `${value} (@float${width}) → ${result.data.hex} [${result.data.kind}]` : null);

  return (
    <>
      <Toolbox title="Number" actions={<ClearButton onClick={() => setValue("")} disabled={value.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Value" value={value} onChange={setValue} placeholder="3.14" inputMode="text" width="w-32" />
          <SelectField label="Precision" value={width} onChange={setWidth} options={["32", "64"]} />
        </div>
        <Hint>IEEE-754 layout. Float32 uses a sign bit, 8 exponent bits and 23 fraction bits; Float64 uses 11 and 52.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.data ? (
        <>
          <Toolbox title="Bit layout" actions={<StatusChip label={result.data.kind} value={result.data.sign === 0 ? "+" : "−"} />}>
            <p className="break-all px-1 font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              {result.data.fullBinary.slice(0, 1)}<span className="text-violet-600 dark:text-violet-400">{result.data.fullBinary.slice(1, 1 + (width === "32" ? 8 : 11))}</span>{result.data.fullBinary.slice(1 + (width === "32" ? 8 : 11))}
            </p>
            <p className="mt-2 px-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              sign | exponent | fraction → {floatLayout(Number(value), width === "64" ? 64 : 32)}
            </p>
            <BigValue value={result.data.valueLabel} copy={result.data.fullBinary} tone="ok" />
          </Toolbox>
          <Toolbox title="Fields" actions={<CopyButton text={result.data.hex} label="Copy hex" />}>
            <ResultGrid>
              <ResultRow label="Sign" value={String(result.data.sign)} copy={String(result.data.sign)} />
              <ResultRow label="Exponent bits" value={result.data.exponentBits} copy={result.data.exponentBits} />
              <ResultRow label="Fraction (mantissa)" value={result.data.fractionBits} copy={result.data.fractionBits} mono={false} />
              <ResultRow label="Exponent (unbiased)" value={String(result.data.exponentValue)} copy={String(result.data.exponentValue)} />
              <ResultRow label="Bias" value={String(result.data.bias)} copy={String(result.data.bias)} />
              <ResultRow label="Hex" value={result.data.hex} copy={result.data.hex} />
              <ResultRow label="Mantissa" value={result.data.mantissaLabel} copy={result.data.mantissaLabel} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}