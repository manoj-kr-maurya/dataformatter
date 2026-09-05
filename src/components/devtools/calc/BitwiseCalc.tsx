"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, ResultGrid, ResultRow, SelectField, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { evaluateBitwise, bitwiseBreakdown, bitwiseTower, type SignedWidth } from "@/lib/devcalc/bits";

function TowerRow({ label, cell }: { label?: string; cell: { binary: string; hex: string; decimal: string } }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="w-8 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label ?? "="}</span>
      <code className="min-w-0 break-all font-mono text-xs text-zinc-800 dark:text-zinc-200">{cell.binary}</code>
      <span className="shrink-0 text-right font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
        {cell.hex} · {cell.decimal}
      </span>
    </div>
  );
}

export function BitwiseCalc({ onLog, initValue }: { onLog?: (entry: CalcLogEntry) => void; initValue?: string }) {
  const [expr, setExpr] = useState(() => initValue ?? "42 & 15");
  const [width, setWidth] = useState("32");

  const result = useMemo(() => {
    const signedWidth = Number(width) as SignedWidth;
    try {
      const value = evaluateBitwise(expr, signedWidth);
      let tower = null;
      try {
        tower = bitwiseTower(expr, signedWidth);
      } catch {
        /* tower is optional — fall back to result breakdown only */
      }
      return { value, breakdown: bitwiseBreakdown(value, signedWidth), tower, error: null as string | null };
    } catch (cause) {
      return { value: 0n, breakdown: null, tower: null, error: cause instanceof Error ? cause.message : String(cause) };
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
        <Hint>Operators: &amp; | ^ ~ &lt;&lt; &gt;&gt; &gt;&gt;&gt; with parentheses. Values are masked to the chosen width.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.breakdown ? (
        <>
          {result.tower && (
            <Toolbox title="Binary view">
              <div className="flex flex-col gap-2">
                <TowerRow label="A" cell={result.tower.left} />
                <div className="flex items-center justify-between gap-3">
                  <span className="w-8 text-xs font-semibold text-violet-500">{result.tower.op}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">operand B</span>
                </div>
                <TowerRow label="B" cell={result.tower.right} />
                <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700" />
                <TowerRow cell={result.tower.result} />
              </div>
            </Toolbox>
          )}
          <Toolbox title="Result" actions={result.breakdown.overflow ? <ErrorBox message={`Masked to ${width} bits — truncated`} /> : undefined}>
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
