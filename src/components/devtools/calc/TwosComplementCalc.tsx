"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, SelectField, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { parseIntegerLiteral, toTwosComplement, type SignedWidth } from "@/lib/devcalc/bits";

export function TwosComplementCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [value, setValue] = useState("-42");
  const [width, setWidth] = useState("8");

  const result = useMemo(() => {
    try {
      return { data: toTwosComplement(parseIntegerLiteral(value), Number.isNaN(Number(width)) ? 32 : (Number(width) as SignedWidth)), error: null as string | null };
    } catch (cause) {
      return { data: null, error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [value, width]);

  useCalcLog(onLog, `two's complement ${value} @${width}-bit`, result.data ? `${value} @${width}-bit → 0x${result.data.hex} (${result.data.bits})` : null);

  return (
    <>
      <Toolbox title="Value" actions={<ClearButton onClick={() => setValue("")} disabled={value.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Value" value={value} onChange={setValue} placeholder="-42" inputMode="text" width="w-28" />
          <SelectField label="Bit width" value={width} onChange={setWidth} options={["8", "16", "32", "64"]} />
        </div>
        <Hint>Two&apos;s complement is how signed integers are stored: invert every bit and add one. Widths below the value&apos;s range report overflow but still show the truncated bits.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.data ? (
        <>
          <Toolbox
            title={`${result.data.width}-bit representation`}
            actions={
              result.data.overflowSigned ? (
                <span className="rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">Overflows signed range</span>
              ) : (
                <CopyButton text={result.data.bits} label="Copy bits" />
              )
            }
          >
            <BigValue value={result.data.bits} copy={result.data.bits} tone={result.data.overflowSigned ? "warn" : "ok"} />
          </Toolbox>
          <Toolbox title="Interpretation" actions={<CopyButton text={result.data.hex} label="Copy hex" />}>
            <ResultGrid>
              <ResultRow label="Hex" value={result.data.hex} copy={result.data.hex} />
              <ResultRow label="Signed value" value={result.data.signed.toString()} copy={result.data.signed.toString()} />
              <ResultRow label="Unsigned bits" value={result.data.unsigned.toString()} copy={result.data.unsigned.toString()} />
              <ResultRow label="Overflow (signed)" value={result.data.overflowSigned ? "yes" : "no"} tone={result.data.overflowSigned ? "error" : "ok"} />
              <ResultRow label="Overflow (unsigned)" value={result.data.overflowUnsigned ? "yes" : "no"} tone={result.data.overflowUnsigned ? "error" : "ok"} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}