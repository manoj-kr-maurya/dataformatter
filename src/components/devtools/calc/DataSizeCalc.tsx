"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultRow, SelectField, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { sizeConversions, exactBytes, DECIMAL_UNITS, BINARY_UNITS, type SizeRow } from "@/lib/devcalc/units";

function UnitTable({ rows }: { rows: SizeRow[] }) {
  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {rows.map((row) => (
        <ResultRow key={row.system + row.unit} label={row.unit} value={row.rendered} copy={row.rendered} />
      ))}
    </dl>
  );
}

export function DataSizeCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState("KiB");

  const result = useMemo(() => {
    try {
      return { rows: sizeConversions(Number(value), unit), error: null as string | null };
    } catch (cause) {
      return { rows: null, error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [value, unit]);

  const bytes = result.rows?.[0].bytes;

  useCalcLog(onLog, `${value} ${unit}`, bytes != null && Number.isInteger(bytes) ? `${value} ${unit} = ${exactBytes(bytes)} bytes` : null);

  const decimalRows = result.rows?.filter((r) => r.system === "decimal") ?? [];
  const binaryRows = result.rows?.filter((r) => r.system === "binary") ?? [];

  return (
    <>
      <Toolbox title="Data size" actions={<ClearButton onClick={() => setValue("")} disabled={value.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Value" value={value} onChange={setValue} placeholder="1" inputMode="decimal" width="w-28" />
          <SelectField label="Unit" value={unit} onChange={setUnit} options={[...DECIMAL_UNITS, ...BINARY_UNITS]} width="w-24" />
        </div>
        <Hint>Decimal units (KB, MB…) use powers of 1,000; binary units (KiB, MiB…) use powers of 1,024. 1 KB = 1,000 bytes ⇔ 1 KiB = 1,024 bytes.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : (
        <>
          {bytes != null && (
            <Toolbox title="Exact size" actions={<StatusChip label="bytes" value={exactBytes(bytes)} tone="ok" />}>
              <BigValue value={exactBytes(bytes)} copy={exactBytes(bytes)} tone="ok" />
            </Toolbox>
          )}
          <Toolbox title="Decimal (×1000)" actions={<CopyButton text={decimalRows.map((r) => `${r.unit}: ${r.rendered}`).join(", ")} label="Copy all" />}>
            <UnitTable rows={decimalRows} />
          </Toolbox>
          <Toolbox title="Binary (×1024)" actions={<CopyButton text={binaryRows.map((r) => `${r.unit}: ${r.rendered}`).join(", ")} label="Copy all" />}>
            <UnitTable rows={binaryRows} />
          </Toolbox>
        </>
      )}
    </>
  );
}