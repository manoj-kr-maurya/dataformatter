"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ResultGrid, ResultRow, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { textBreakdown } from "@/lib/devcalc/textsize";

export function StringAnalyzerCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [text, setText] = useState("Hello 👋");

  const result = useMemo(() => textBreakdown(text), [text]);

  useCalcLog(onLog, `string analysis`, `${result.codePoints} code points · ${result.utf8Bytes} UTF-8 B`);

  const summary = `chars ${result.characters} · code points ${result.codePoints} · UTF-8 ${result.utf8Bytes} B · UTF-16 ${result.utf16Units} units`;

  return (
    <>
      <Toolbox title="Text" actions={<ClearButton onClick={() => setText("")} disabled={text.length === 0} />}>
        <textarea
          className="min-h-[90px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="String input"
          spellCheck={false}
        />
        <Hint>&quot;Characters&quot; counts grapheme clusters (what you see); &quot;code points&quot; counts Unicode scalars; UTF-8 bytes and UTF-16 units are the storage sizes. Emoji often span several — try &quot;€&quot; or &quot;😀&quot;.</Hint>
      </Toolbox>

      <Toolbox title="Breakdown" actions={<StatusChip label="chars" value={result.characters} tone="ok" />}>
        <BigValue value={result.characters} copy={String(result.characters)} tone="ok" />
      </Toolbox>
      <Toolbox title="Detailed counts" actions={<CopyButton text={summary} label="Copy all" />}>
        <ResultGrid>
          <ResultRow label="Characters (graphemes)" value={result.characters} copy={String(result.characters)} />
          <ResultRow label="Unicode code points" value={result.codePoints} copy={String(result.codePoints)} />
          <ResultRow label="UTF-8 bytes" value={result.utf8Bytes} copy={String(result.utf8Bytes)} />
          <ResultRow label="UTF-16 code units" value={result.utf16Units} copy={String(result.utf16Units)} />
          <ResultRow label="Lines" value={result.lines} copy={String(result.lines)} />
          <ResultRow label="Words" value={result.words} copy={String(result.words)} />
          <ResultRow label="Digits" value={result.digits} copy={String(result.digits)} />
          <ResultRow label="Whitespace" value={result.whitespace} copy={String(result.whitespace)} />
          <ResultRow label="Special chars" value={result.special} copy={String(result.special)} />
        </ResultGrid>
      </Toolbox>
    </>
  );
}