"use client";

import { useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  ClearButton,
  Segmented,
  Field,
  inputClass,
  Stat,
  Hint,
} from "@/components/devtools/shared";
import { radixOf, bytesOf, percentBetween, crc32, humanBytes, evaluateExpression } from "@/lib/devcalc/engine";

type Tab = "expression" | "radix" | "bytes" | "percent" | "crc32";

export function DevCalcWorkbench() {
  const [tab, setTab] = useState<Tab>("expression");
  const [expr, setExpr] = useState("((1024 * 1024) % 65521) + 0xFF");
  const [radixInput, setRadixInput] = useState("255");
  const [signedWidth, setSignedWidth] = useState<"8" | "16" | "32" | undefined>(undefined);
  const [bytesText, setBytesText] = useState("hello world");
  const [percentA, setPercentA] = useState("12");
  const [percentB, setPercentB] = useState("48");
  const [crcText, setCrcText] = useState("hello");

  const exprResult = useMemo(() => {
    try {
      return { value: evaluateExpression(expr), error: null };
    } catch (cause) {
      return { value: null, error: `${cause instanceof Error ? cause.message : cause}` };
    }
  }, [expr]);

  const radixResult = useMemo(() => {
    let input = 0;
    try {
      const trimmed = radixInput.trim().toLowerCase();
      input = trimmed.startsWith("0x")
        ? parseInt(trimmed.slice(2), 16)
        : trimmed.startsWith("0b")
          ? parseInt(trimmed.slice(2), 2)
          : trimmed.startsWith("0o")
            ? parseInt(trimmed.slice(2), 8)
            : parseInt(trimmed, 10);
      return { result: radixOf(input, signedWidth), error: null };
    } catch (cause) {
      return { result: null, error: `${cause instanceof Error ? cause.message : cause}` };
    }
  }, [radixInput, signedWidth]);

  const byteResult = useMemo(() => bytesOf(bytesText), [bytesText]);
  const percentResult = useMemo(() => {
    const a = Number(percentA);
    const b = Number(percentB);
    return { percent: percentBetween(a, b), a, b };
  }, [percentA, percentB]);
  const crcResult = useMemo(() => {
    try {
      return { value: crc32(crcText), error: null };
    } catch (cause) {
      return { value: null, error: `${cause instanceof Error ? cause.message : cause}` };
    }
  }, [crcText]);

  const crcHex = crcResult.error == null && crcResult.value != null
    ? `0x${crcResult.value.toString(16).padStart(8, "0")}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          ariaLabel="Calculator mode"
          value={tab}
          onChange={setTab}
          options={[
            { value: "expression", label: "Expression" },
            { value: "radix", label: "Radix" },
            { value: "bytes", label: "Bytes" },
            { value: "percent", label: "Percent" },
            { value: "crc32", label: "CRC32" },
          ]}
        />
      </div>

      {tab === "expression" && (
        <>
          <Toolbox title="Expression" actions={<ClearButton onClick={() => setExpr("")} disabled={expr.length === 0} />}>
            <input
              className={`${inputClass} w-full text-sm`}
              value={expr}
              onChange={(event) => setExpr(event.target.value)}
              placeholder="2 + 3 * 4"
              aria-label="Arithmetic expression"
              spellCheck={false}
            />
            <Hint>Operators + - * / % **, parentheses, and hex/binary/octal literals (0xFF, 0b1010, 0o17).</Hint>
          </Toolbox>
          {exprResult.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{exprResult.error}</p>
          ) : (
            <Toolbox
              title="Result"
              actions={
                <>
                  <CopyButton text={String(exprResult.value)} label="Copy" />
                </>
              }
            >
              <p className="px-1 py-2 font-mono text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {exprResult.value}
              </p>
            </Toolbox>
          )}
        </>
      )}

      {tab === "radix" && (
        <>
          <Toolbox title="Number" actions={<ClearButton onClick={() => setRadixInput("")} disabled={radixInput.length === 0} />}>
            <div className="flex flex-wrap items-center gap-3">
              <input
                className={`${inputClass} w-48 text-sm`}
                value={radixInput}
                onChange={(event) => setRadixInput(event.target.value)}
                placeholder="255 or 0xFF"
                aria-label="Number to convert"
                spellCheck={false}
              />
              <Field label="Signed width">
                <select
                  className={inputClass}
                  value={signedWidth ?? ""}
                  onChange={(event) => setSignedWidth((event.target.value || undefined) as "8" | "16" | "32" | undefined)}
                  aria-label="Signed width"
                >
                  <option value="">Full range</option>
                  <option value="8">8-bit</option>
                  <option value="16">16-bit</option>
                  <option value="32">32-bit</option>
                </select>
              </Field>
            </div>
          </Toolbox>
          {radixResult.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{radixResult.error}</p>
          ) : radixResult.result && (
            <Toolbox title="Radix breakdown" actions={<Stat label="dec" value={radixResult.result.decimal} tone="ok" />}>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  ["Decimal", radixResult.result.decimal],
                  ["Hexadecimal", radixResult.result.hex],
                  ["Binary", radixResult.result.binary],
                  ["Octal", radixResult.result.octal],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3 rounded-md border border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</dt>
                    <dd className="truncate font-mono text-xs text-zinc-800 dark:text-zinc-200">{value}</dd>
                  </div>
                ))}
              </dl>
              {radixResult.result.char && (
                <p className="mt-3 px-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Printable ASCII: <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-lg dark:bg-zinc-800">{radixResult.result.char}</code>
                </p>
              )}
            </Toolbox>
          )}
        </>
      )}

      {tab === "bytes" && (
        <>
          <Toolbox title="Text" actions={<ClearButton onClick={() => setBytesText("")} disabled={bytesText.length === 0} />}>
            <textarea
              className="min-h-[110px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              value={bytesText}
              onChange={(event) => setBytesText(event.target.value)}
              aria-label="Text to measure"
              spellCheck={false}
            />
          </Toolbox>
          <Toolbox title="Size" actions={<Stat label="bytes" value={byteResult.bytes} tone="ok" />}>
            <div className="flex flex-col gap-3">
              <p className="px-1 font-mono text-lg font-semibold text-zinc-800 dark:text-zinc-200">{humanBytes(byteResult.bytes)}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <CopyBox label="UTF-8 hex" value={byteResult.hex} />
                <CopyBox label="Base64" value={byteResult.base64} />
              </div>
            </div>
          </Toolbox>
        </>
      )}

      {tab === "percent" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toolbox title="A is what % of B?" actions={<ClearButton onClick={() => { setPercentA(""); setPercentB(""); }} disabled={percentA.length === 0 && percentB.length === 0} />}>
            <div className="flex items-end gap-3">
              <Field label="A">
                <input className={`${inputClass} w-24`} value={percentA} onChange={(e) => setPercentA(e.target.value)} inputMode="numeric" aria-label="Percent value A" />
              </Field>
              <Field label="B">
                <input className={`${inputClass} w-24`} value={percentB} onChange={(e) => setPercentB(e.target.value)} inputMode="numeric" aria-label="Percent value B" />
              </Field>
            </div>
            <p className="mt-3 px-1 font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {percentResult.percent == null ? (
                <span className="text-base font-normal text-red-600 dark:text-red-400">B must not be zero.</span>
              ) : (
                `${percentResult.percent}%`
              )}
            </p>
          </Toolbox>
        </div>
      )}

      {tab === "crc32" && (
        <>
          <Toolbox title="Input" actions={<ClearButton onClick={() => setCrcText("")} disabled={crcText.length === 0} />}>
            <input
              className={`${inputClass} w-full text-sm`}
              value={crcText}
              onChange={(event) => setCrcText(event.target.value)}
              placeholder="hello"
              aria-label="CRC32 input"
              spellCheck={false}
            />
            <Hint>CRC-32 (IEEE 802.3 polynomial 0xEDB88320), returning the unsigned 32-bit value.</Hint>
          </Toolbox>
          {crcResult.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{crcResult.error}</p>
          ) : (
            <Toolbox title="CRC-32" actions={crcHex && <CopyButton text={crcHex} label="Copy hex" />}>
              <div className="flex flex-col gap-2 px-1">
                <p className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50">{crcResult.value}</p>
                <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
                  {crcHex} — 32-bit unsigned
                </p>
              </div>
            </Toolbox>
          )}
        </>
      )}
    </div>
  );
}

function CopyBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-zinc-100 px-3 py-2 dark:border-zinc-800">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</span>
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">{value}</code>
      <CopyButton text={value} label="Copy" />
    </div>
  );
}