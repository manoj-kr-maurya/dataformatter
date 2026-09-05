"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, SelectField, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { INTEGER_TYPES, parseIntegerLiteral, interpretSigned, type IntegerType, type SignedWidth } from "@/lib/devcalc/bits";

const TYPE_KEYS = Object.keys(INTEGER_TYPES) as (keyof typeof INTEGER_TYPES)[];

export function IntegerTypesCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [value, setValue] = useState("256");
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
      };
    } catch (cause) {
      return { raw: 0n, info: null, signed: null, unsigned: null, overflow: false, hex: "", binary: "", error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [value, typeKey]);

  useCalcLog(onLog, `${result.info ? result.info.label : ""} ${value}`, result.unsigned != null ? `${result.info?.label} ${value} → ${result.signed}${result.overflow ? " (overflow)" : ""}` : null);

  return (
    <>
      <Toolbox title="Integer value" actions={<ClearButton onClick={() => setValue("")} disabled={value.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Value" value={value} onChange={setValue} placeholder="256" inputMode="text" width="w-32" />
          <SelectField label="Type" value={typeKey} onChange={setTypeKey} options={TYPE_KEYS} width="w-24" />
        </div>
        <Hint>Try 256 as UInt8 to see overflow, or -42 as Int8. Select any of the eight integer types.</Hint>
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
          </Toolbox>
          <Toolbox title="Type metadata">
            <ResultGrid>
              <ResultRow label="Bits" value={result.info.bits} copy={String(result.info.bits)} />
              <ResultRow label="Bytes" value={result.info.bytes} copy={String(result.info.bytes)} />
              <ResultRow label="Signed / unsigned" value={result.info.sign} copy={result.info.sign} mono={false} />
              <ResultRow label="Min" value={result.info.min.toString()} copy={result.info.min.toString()} />
              <ResultRow label="Max" value={result.info.max.toString()} copy={result.info.max.toString()} />
            </ResultGrid>
          </Toolbox>
          <Toolbox title="Current value">
            <ResultGrid>
              <ResultRow label="Stored (as typed)" value={result.raw.toString()} copy={result.raw.toString()} />
              <ResultRow label="Interpreted" value={result.signed != null ? result.signed.toString() : ""} copy={result.signed != null ? result.signed.toString() : ""} />
              <ResultRow label="Hex" value={result.hex} copy={result.hex} />
              <ResultRow label="Binary" value={result.binary} copy={result.binary} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}