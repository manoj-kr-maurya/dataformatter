"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { estimateStorage, formatBytesPrecise } from "@/lib/devcalc/estimators";

export function StorageCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [records, setRecords] = useState("10000000");
  const [recordKB, setRecordKB] = useState("2");
  const [growth, setGrowth] = useState("100000");
  const [retention, setRetention] = useState("365");
  const [replication, setReplication] = useState("1");
  const [overhead, setOverhead] = useState("0");

  const values = useMemo(() => {
    const recordsN = Number(records);
    const recordBytesN = Number(recordKB) * 1000;
    const growthN = Number(growth);
    const retentionN = Number(retention);
    const replicationN = Number(replication);
    const overheadN = Number(overhead);
    if (!Number.isFinite(recordsN) || !Number.isFinite(recordBytesN) || recordsN < 0 || recordBytesN < 0) {
      return { data: null, error: "Records and row size must be non-negative numbers." };
    }
    if (!Number.isFinite(growthN) || !Number.isFinite(retentionN) || !Number.isFinite(replicationN) || !Number.isFinite(overheadN) || growthN < 0 || retentionN < 0 || replicationN < 1 || overheadN < 0) {
      return { data: null, error: "Growth/retention must be non-negative and replication ≥ 1." };
    }
    try {
      return {
        data: estimateStorage({ records: recordsN, recordBytes: recordBytesN, dailyGrowthRecords: growthN, retentionDays: retentionN, replication: replicationN, overheadPct: overheadN }),
        error: null as string | null,
      };
    } catch (cause) {
      return { data: null, error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [records, recordKB, growth, retention, replication, overhead]);

  useCalcLog(onLog, `${records} rows · ${recordKB} KB`, values.data ? `raw ${values.data.rawLabel}` : null);

  return (
    <>
      <Toolbox title="Database profile" actions={<ClearButton onClick={() => { setRecords(""); setRecordKB(""); setGrowth(""); setRetention(""); setReplication(""); setOverhead(""); }} disabled={records.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Records" value={records} onChange={setRecords} placeholder="10000000" inputMode="decimal" width="w-28" />
          <NumberField label="Row size" value={recordKB} onChange={setRecordKB} placeholder="2" inputMode="decimal" width="w-20" unit="KB" />
          <NumberField label="Daily growth" value={growth} onChange={setGrowth} placeholder="100000" inputMode="decimal" width="w-28" unit="rows" />
          <NumberField label="Retention" value={retention} onChange={setRetention} placeholder="365" inputMode="decimal" width="w-20" unit="days" />
          <NumberField label="Replication" value={replication} onChange={setReplication} placeholder="1" inputMode="decimal" width="w-16" unit="×" />
          <NumberField label="Overhead" value={overhead} onChange={setOverhead} placeholder="0" inputMode="decimal" width="w-16" unit="%" />
        </div>
        <Hint>Transparent math shown below: raw = rows × size; overhead adds a %, replication multiplies the whole thing.</Hint>
      </Toolbox>

      {values.error ? (
        <ErrorBox message={values.error} />
      ) : values.data ? (
        <>
          <Toolbox title="Storage" actions={<StatusChip label="raw" value={values.data.rawLabel} tone="ok" />}>
            <BigValue value={values.data.rawLabel} copy={String(values.data.rawBytes)} tone="ok" />
          </Toolbox>
          <Toolbox title="Breakdown" actions={<CopyButton text={`raw ${values.data.rawLabel} · retention ${values.data.retentionLabel}`} label="Copy all" />}>
            <ResultGrid>
              <ResultRow label="Raw" value={`${values.data.rawLabel} (${values.data.rawBytes.toLocaleString("en-US")} B)`} copy={String(values.data.rawBytes)} />
              <ResultRow label="With overhead" value={formatBytesPrecise(values.data.overheadBytes)} copy={String(values.data.overheadBytes)} />
              <ResultRow label="Replicated" value={formatBytesPrecise(values.data.replicatedBytes)} copy={String(values.data.replicatedBytes)} />
              <ResultRow label="Daily growth" value={`${values.data.dailyGrowthLabel}/day`} copy={String(values.data.dailyGrowthBytes)} />
              <ResultRow label="Monthly growth" value={`${formatBytesPrecise(values.data.monthlyGrowthBytes)}/mo`} copy={String(values.data.monthlyGrowthBytes)} />
              <ResultRow label="Retention estimate" value={values.data.retentionLabel} copy={String(values.data.retentionBytes)} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}