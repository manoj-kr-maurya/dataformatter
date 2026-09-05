"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, ResultGrid, ResultRow, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { analyzeJson, textBreakdown } from "@/lib/devcalc/textsize";
import { humanBytes } from "@/lib/devcalc/engine";

const DEFAULT_JSON = '{"name":"DataFormatter","tags":["dev","tools"],"open":true,"meta":{"id":42,"ok":null}}';

export function JsonSizeCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [text, setText] = useState(DEFAULT_JSON);

  const result = useMemo(() => analyzeJson(text), [text]);
  const metrics = useMemo(() => textBreakdown(text), [text]);

  const jsonLabel = result.valid
    ? `pretty ${humanBytes(result.prettyBytes)} · minified ${humanBytes(result.minifiedBytes)} · save ${humanBytes(result.savingsBytes)}`
    : null;

  useCalcLog(onLog, `JSON (${metrics.codePoints} chars)`, jsonLabel);

  return (
    <>
      <Toolbox title="JSON / text" actions={<ClearButton onClick={() => setText("")} disabled={text.length === 0} />}>
        <textarea
          className="min-h-[150px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="JSON input"
          spellCheck={false}
        />
        <Hint>Valid JSON unlocks the pretty/minified size comparison. Character and byte counts are always shown and kept separate.</Hint>
      </Toolbox>

      <Toolbox title="Text metrics" actions={<StatusChip label="chars" value={metrics.codePoints} tone="ok" />}>
        <ResultGrid>
          <ResultRow label="Characters" value={metrics.characters} copy={String(metrics.characters)} />
          <ResultRow label="Code points" value={metrics.codePoints} copy={String(metrics.codePoints)} />
          <ResultRow label="UTF-8 bytes" value={metrics.utf8Bytes} copy={String(metrics.utf8Bytes)} />
          <ResultRow label="UTF-16 units" value={metrics.utf16Units} copy={String(metrics.utf16Units)} />
          <ResultRow label="Lines" value={metrics.lines} copy={String(metrics.lines)} />
          <ResultRow label="Words" value={metrics.words} copy={String(metrics.words)} />
        </ResultGrid>
      </Toolbox>

      {result.valid ? (
        <>
          <Toolbox
            title="JSON size"
            actions={
              <>
                <CopyButton text={result.minified} label="Copy minified" />
                <CopyButton text={result.pretty} label="Copy pretty" />
              </>
            }
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <ResultRow label="Pretty" value={humanBytes(result.prettyBytes)} copy={`${result.prettyBytes} bytes`} />
              <ResultRow label="Minified" value={humanBytes(result.minifiedBytes)} copy={`${result.minifiedBytes} bytes`} />
              <ResultRow label="Savings" value={`− ${humanBytes(result.savingsBytes)}`} copy={`${result.savingsBytes} bytes`} tone="ok" />
            </div>
            <div className="mt-3">
              <BigValue value={humanBytes(result.prettyBytes)} copy={String(result.prettyBytes)} tone="ok" />
            </div>
          </Toolbox>
        </>
      ) : (
        <ErrorBox message={result.error} />
      )}
    </>
  );
}