"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { ResultGrid, ResultRow, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { computeStats, formatNumber } from "@/lib/devcalc/stats";

export function StatsCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [text, setText] = useState("10\n20\n30\n40\n50");

  const result = useMemo(() => {
    const values = text.split(/[,\s]+/).filter((t) => t !== "");
    let skipped = 0;
    for (const t of values) if (Number.isNaN(Number(t))) skipped++;
    const stats = computeStats(text);
    return { stats, skipped };
  }, [text]);

  useCalcLog(onLog, `stats (${text.split(/[,\s]+/).filter((t) => t !== "" && !Number.isNaN(Number(t))).length} values)`, result.stats ? `mean ${formatNumber(result.stats.mean)}` : null);

  const summary = result.stats ? `n=${result.stats.count} mean=${formatNumber(result.stats.mean)} median=${result.stats.median} p95=${formatNumber(result.stats.p95)}` : "";

  return (
    <>
      <Toolbox
        title="Numbers"
        actions={
          result.skipped > 0 ? (
            <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              skipped {result.skipped} invalid
            </span>
          ) : (
            <ClearButton onClick={() => setText("")} disabled={text.length === 0} />
          )
        }
      >
        <textarea
          className="min-h-[120px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Numbers"
          spellCheck={false}
        />
        <Hint>Comma-, space- or newline-separated numbers. Invalid tokens are skipped with a warning.</Hint>
      </Toolbox>

      {result.stats ? (
        <>
          <Toolbox title="Summary" actions={result.stats.mode.length ? <CopyButton text={summary} label="Copy all" /> : undefined}>
            <ResultGrid>
              <ResultRow label="Count" value={result.stats.count} copy={String(result.stats.count)} />
              <ResultRow label="Sum" value={formatNumber(result.stats.sum)} copy={String(result.stats.sum)} />
              <ResultRow label="Mean" value={formatNumber(result.stats.mean)} copy={String(result.stats.mean)} />
              <ResultRow label="Median" value={formatNumber(result.stats.median)} copy={String(result.stats.median)} />
              <ResultRow label="Mode" value={result.stats.mode.length ? result.stats.mode.join(", ") : "none"} copy={result.stats.mode.join(", ") || undefined} />
              <ResultRow label="Min" value={result.stats.min} copy={String(result.stats.min)} />
              <ResultRow label="Max" value={result.stats.max} copy={String(result.stats.max)} />
              <ResultRow label="Range" value={formatNumber(result.stats.range)} copy={String(result.stats.range)} />
            </ResultGrid>
          </Toolbox>
          <Toolbox title="Spread" actions={<StatusChip label="σ" value={formatNumber(result.stats.stdDev)} tone="ok" />}>
            <ResultGrid>
              <ResultRow label="Variance (sample)" value={formatNumber(result.stats.variance)} copy={String(result.stats.variance)} />
              <ResultRow label="Std dev" value={formatNumber(result.stats.stdDev)} copy={String(result.stats.stdDev)} />
            </ResultGrid>
          </Toolbox>
          <Toolbox title="Percentiles">
            <ResultGrid>
              <ResultRow label="P50" value={formatNumber(result.stats.p50)} copy={String(result.stats.p50)} />
              <ResultRow label="P90" value={formatNumber(result.stats.p90)} copy={String(result.stats.p90)} />
              <ResultRow label="P95" value={formatNumber(result.stats.p95)} copy={String(result.stats.p95)} />
              <ResultRow label="P99" value={formatNumber(result.stats.p99)} copy={String(result.stats.p99)} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : (
        <p className="px-1 text-sm text-zinc-500 dark:text-zinc-400">Paste at least one number to compute statistics.</p>
      )}
    </>
  );
}