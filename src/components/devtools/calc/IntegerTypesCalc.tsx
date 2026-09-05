"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, SelectField, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { INTEGER_TYPES, parseIntegerLiteral, interpretSigned, fittingTypes, wrapMessage, type IntegerType, type SignedWidth } from "@/lib/devcalc/bits";

const TYPE_KEYS = Object.keys(INTEGER_TYPES) as (keyof typeof INTEGER_TYPES)[];

export function IntegerTypesCalc({ onLog, initValue }: { onLog?: (entry: CalcLogEntry) => void; initValue?: string }) {
  const [value, setValue] = useState(() => initValue ?? "256");
  const [typeKey, setTypeKey] = useState("UInt8");

  const result = useMemo(() => {
    try {
      const raw = parseIntegerLiteral(value);
      const info: IntegerType = INTEGER_TYPES[typeKey as keyof typeof INTEGER_TYPES];
      const width = info.bits as SignedWidth;
      const unsigned = raw & ((1n << BigInt(width)) - 1n);
      const signed = info.sign === "signed" ? interpretSigned(unsigned, width) : unsigned;
      const overflow = raw < info.min || raw > info.max;
      const hexDigits = Math.ceil(width / 4);
      return {
        raw,
        info,
        signed,
        unsigned,
        overflow,
        hex: `0x${unsigned.toString(16).padStart(hexDigits, "0").slice(-hexDigits).toUpperCase()}`,
        binary: unsigned.toString(2).padStart(width, "0").slice(-width),
        fits: fittingTypes(raw),
        error: null as string | null,
      };
    } catch (cause) {
      return { raw: 0n, info: null, signed: null, unsigned: null, overflow: false, hex: "", binary: "", fits: [] as string[], error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [value, typeKey]);

  useCalcLog(onLog, `${result.info ? result.info.label : ""} ${value}`, result.unsigned != null ? `${result.info?.label} ${value} → ${result.signed}${result.overflow ? " (overflow)" : ""}` : null);

  const toggleBit = (index: number) => {
    if (result.unsigned == null || result.info == null) return;
    const width = result.info.bits;
    const nextPattern = result.unsigned ^ (1n << BigInt(width - 1 - index));
    const nextRaw = result.info.sign === "signed" ? interpretSigned(nextPattern, width) : nextPattern;
    setValue(nextRaw.toString());
  };

  return (
    <>
      <Toolbox title="Integer value" actions={<ClearButton onClick={() => setValue("")} disabled={value.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Value" value={value} onChange={setValue} placeholder="256" inputMode="text" width="w-32" />
          <SelectField label="Type" value={typeKey} onChange={setTypeKey} options={TYPE_KEYS} width="w-24" />
        </div>
        <Hint>Try 256 as UInt8 to see overflow, or -42 as Int8. Click a bit below to flip it. A real type just means one you could store the value in.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.info ? (
        <>
          <Toolbox
            title={result.info.label}
            actions={
              result.overflow ? (
                <span className="rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">Overflow</span>
              ) : (
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">In range</span>
              )
            }
          >
            <BigValue value={result.signed != null ? result.signed.toString() : ""} tone={result.overflow ? "warn" : "ok"} copy={result.hex} />
            {result.overflow && <p className="mt-2 px-1 text-xs text-red-600 dark:text-red-400">{wrapMessage(result.raw, result.info)}</p>}
          </Toolbox>
          <Toolbox title="Type metadata">
            <ResultGrid>
              <ResultRow label="Bits" value={result.info.bits} copy={String(result.info.bits)} />
              <ResultRow label="Bytes" value={result.info.bytes} copy={String(result.info.bytes)} />
              <ResultRow label="Signed / unsigned" value={result.info.sign} copy={result.info.sign} mono={false} />
              <ResultRow label="Min" value={result.info.min.toString()} copy={result.info.min.toString()} />
              <ResultRow label="Max" value={result.info.max.toString()} copy={result.info.max.toString()} />
            </ResultGrid>
            <div className="mt-3">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Fits in</span>
              <div className="flex flex-wrap gap-1.5">
                {result.fits.length > 0 ? (
                  result.fits.map((label) => (
                    <span key={label} className="rounded-md bg-violet-50 px-2 py-0.5 font-mono text-xs text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">fits no built-in type (use Int64/UInt64 width manually)</span>
                )}
              </div>
            </div>
          </Toolbox>
          <Toolbox title="Current value">
            <ResultGrid>
              <ResultRow label="Stored (as typed)" value={result.raw.toString()} copy={result.raw.toString()} />
              <ResultRow label="Interpreted" value={result.signed != null ? result.signed.toString() : ""} copy={result.signed != null ? result.signed.toString() : ""} />
              <ResultRow label="Hex" value={result.hex} copy={result.hex} />
              <ResultRow label="Binary" value={result.binary} copy={result.binary} />
              <ResultRow label="Bits set" value={result.binary.split("").filter((b) => b === "1").length} copy={String(result.binary.split("").filter((b) => b === "1").length)} />
            </ResultGrid>
          </Toolbox>
          <Toolbox title="Bit view" actions={<span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">click a bit to toggle</span>}>
            <div className="flex flex-wrap items-center gap-1 font-mono text-xs" role="group" aria-label="Bit view">
              {result.binary.split("").map((bit, i) => (
                <button
                  key={`${result.info.bits}-${i}`}
                  type="button"
                  title={`Bit ${result.binary.length - 1 - i} (2^${result.binary.length - 1 - i})`}
                  aria-label={`Bit ${result.binary.length - 1 - i}`}
                  aria-pressed={bit === "1"}
                  onClick={() => toggleBit(i)}
                  className={`h-7 w-7 rounded border font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                    bit === "1"
                      ? "border-violet-300 bg-violet-600 text-white shadow-sm shadow-violet-600/30 dark:border-violet-700"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  {bit}
                </button>
              ))}
            </div>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}