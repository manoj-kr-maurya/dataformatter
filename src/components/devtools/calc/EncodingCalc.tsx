"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { ResultGrid, ResultRow, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { encodingBreakdown, encodingSizeComparison } from "@/lib/devcalc/encoding";
import { humanBytes } from "@/lib/devcalc/engine";

export function EncodingCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [text, setText] = useState("Hello");

  const result = useMemo(() => encodingBreakdown(text), [text]);
  const comparison = useMemo(() => encodingSizeComparison(text), [text]);

  useCalcLog(onLog, `encoding "${text.slice(0, 24)}${text.length > 24 ? "…" : ""}"`, `${result.utf8Bytes} UTF-8 bytes`);

  return (
    <>
      <Toolbox title="Text" actions={<ClearButton onClick={() => setText("")} disabled={text.length === 0} />}>
        <textarea
          className="min-h-[90px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Encoding input"
          spellCheck={false}
        />
        <Hint>Byte counts for each encoding. Characters ≠ bytes: e.g. &quot;€&quot; is 1 character but 3 UTF-8 bytes.</Hint>
      </Toolbox>

      <Toolbox title="Sizes" actions={<CopyButton text={`UTF-8 ${result.utf8Bytes} B · Base64 ${result.base64Bytes} B`} label="Copy all" />}>
        <ResultGrid>
          <ResultRow label="UTF-8 bytes" value={`${result.utf8Bytes} B`} copy={String(result.utf8Bytes)} />
          <ResultRow label="UTF-16 code units" value={result.utf16Units} copy={String(result.utf16Units)} />
          <ResultRow label="UTF-16 bytes" value={`${result.utf16Bytes} B`} copy={String(result.utf16Bytes)} />
          <ResultRow label="ASCII bytes" value={result.asciiBytes == null ? "not ASCII" : `${result.asciiBytes} B`} tone={result.asciiBytes == null ? "warn" : "default"} copy={result.asciiBytes == null ? undefined : String(result.asciiBytes)} />
          <ResultRow label="Hex" value={`${result.hexChars} hex chars`} copy={result.hex} />
          <ResultRow label="Base64" value={`${result.base64Bytes} B`} copy={result.base64} />
          <ResultRow label="URL-encoded" value={`${result.urlChars} chars`} copy={result.url} />
        </ResultGrid>
      </Toolbox>

      {comparison.length > 1 && (
        <Toolbox title="Size comparison" actions={<CopyButton text={comparison.map((r) => `${r.label}: ${r.size} B (+${r.pct != null ? r.pct.toFixed(1) : "–"}%)`).join(", ")} label="Copy all" />}>
          <ResultGrid>
            {comparison.map((row) => (
              <ResultRow
                key={row.label}
                label={row.label}
                value={`${humanBytes(row.size)} · +${row.pct != null ? row.pct.toFixed(1) : "–"}%`}
                tone={row.pct === 0 ? "ok" : "warn"}
                copy={row.pct != null ? `${row.label} ${row.size} bytes (+${row.pct.toFixed(1)}% vs UTF-8)` : undefined}
              />
            ))}
          </ResultGrid>
          <p className="mt-2 px-1 text-xs text-zinc-500 dark:text-zinc-400">Increase vs the UTF-8 byte size of the source. Some encodings can be smaller for non-ASCII text (e.g. UTF-16 LE for €).</p>
        </Toolbox>
      )}

      {result.base64 && (
        <Toolbox title="Encoded values">
          <div className="grid grid-cols-1 gap-2">
            <ResultRow label="Base64" value={result.base64} copy={result.base64} />
            <ResultRow label="Hex" value={result.hex} copy={result.hex} />
            <ResultRow label="URL" value={result.url} copy={result.url} />
          </div>
        </Toolbox>
      )}
    </>
  );
}