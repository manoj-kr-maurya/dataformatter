"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, ResultGrid, ResultRow, SelectField, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { evaluateBitwise, bitwiseBreakdown, type SignedWidth } from "@/lib/devcalc/bits";

export function BitwiseCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [expr, setExpr] = useState("42 & 15");
  const [width, setWidth] = useState("32");

  const result = useMemo(() => {
    const signedWidth = Number(width) as SignedWidth;
    try {
      const value = evaluateBitwise(expr, signedWidth);
      return { value, breakdown: bitwiseBreakdown(value, signedWidth), error: null as string | null };
    } catch (cause) {
      return { value: 0n, breakdown: null, error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [expr, width]);

  const primary = result.breakdown
    ? `${result.breakdown.decimal}\n0x${result.breakdown.hex.slice(2)}\n${result.breakdown.binary}\nsigned: ${result.breakdown.signed}`
    : "";

  useCalcLog(onLog, `${expr} @${width}-bit`, result.breakdown ? primary : null);

  return (
    <>
      <Toolbox title="Bitwise expression" actions={<ClearButton onClick={() => setExpr("")} disabled={expr.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <input
            className="w-full min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-[13px] text-zinc-800 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 sm:w-auto"
            value={expr}
            onChange={(event) => setExpr(event.target.value)}
            placeholder="42 & 15"
            aria-label="Bitwise expression"
            spellCheck={false}
          />
          <SelectField label="Bit width" value={width} onChange={setWidth} options={["8", "16", "32", "64"]} />
        </div>
        <Hint>Operators: &amp; | ^ ~ &lt;&lt; &gt;&gt; &gt;&gt;&gt; with parentheses. Results are truncated to the chosen width.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.breakdown ? (
        <>
          <Toolbox title="Result" actions={result.breakdown.overflow ? <ErrorBox message={`Truncated to ${width} bits`} /> : undefined}>
            <BigValue value={result.breakdown.signed.toString()} copy={primary} tone={result.breakdown.overflow ? "warn" : "ok"} />
          </Toolbox>
          <Toolbox title="Breakdown" actions={<CopyButton text={primary} label="Copy all" />}>
            <ResultGrid>
              <ResultRow label="Decimal" value={result.breakdown.decimal} copy={result.breakdown.decimal} />
              <ResultRow label="Hex" value={result.breakdown.hex} copy={result.breakdown.hex} />
              <ResultRow label="Binary" value={result.breakdown.binary} copy={result.breakdown.binary} />
              <ResultRow label="Signed (two's complement)" value={result.breakdown.signed.toString()} copy={result.breakdown.signed.toString()} />
              <ResultRow label="Unsigned" value={result.breakdown.unsigned.toString()} copy={result.breakdown.unsigned.toString()} />
              <ResultRow label="Overflow" value={result.breakdown.overflow ? "yes" : "no"} tone={result.breakdown.overflow ? "error" : "ok"} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}