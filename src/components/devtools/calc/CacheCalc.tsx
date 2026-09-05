"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { estimateCache, formatBytesPrecise } from "@/lib/devcalc/estimators";

export function CacheCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [keys, setKeys] = useState("100000");
  const [keyBytes, setKeyBytes] = useState("32");
  const [valueBytes, setValueBytes] = useState("512");
  const [overhead, setOverhead] = useState("100");
  const [replication, setReplication] = useState("2");
  const [headroom, setHeadroom] = useState("20");

  const result = useMemo(() => {
    const keysN = Number(keys);
    const keyBN = Number(keyBytes);
    const valueBN = Number(valueBytes);
    const overheadN = Number(overhead);
    const replicationN = Number(replication);
    const headroomN = Number(headroom);
    if (!Number.isFinite(keysN) || !Number.isFinite(keyBN) || !Number.isFinite(valueBN) || keysN < 0 || keyBN < 0 || valueBN < 0) {
      return { data: null, error: "Keys and sizes must be non-negative numbers." };
    }
    if (!Number.isFinite(overheadN) || !Number.isFinite(replicationN) || !Number.isFinite(headroomN) || overheadN < 0 || replicationN < 1 || headroomN < 0) {
      return { data: null, error: "Overhead/headroom must be ≥ 0 and replication ≥ 1." };
    }
    return {
      data: estimateCache({ keys: keysN, keyBytes: keyBN, valueBytes: valueBN, overheadPct: overheadN, replication: replicationN, headroomPct: headroomN }),
      error: null as string | null,
    };
  }, [keys, keyBytes, valueBytes, overhead, replication, headroom]);

  useCalcLog(onLog, `${keys} keys · k${keyBytes}B v${valueBytes}B`, result.data ? `estimated ${result.data.estimatedLabel}` : null);

  return (
    <>
      <Toolbox title="Cache profile" actions={<ClearButton onClick={() => { setKeys(""); setKeyBytes(""); setValueBytes(""); setOverhead(""); setReplication(""); setHeadroom(""); }} disabled={keys.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Keys" value={keys} onChange={setKeys} placeholder="100000" inputMode="decimal" width="w-28" />
          <NumberField label="Key size" value={keyBytes} onChange={setKeyBytes} placeholder="32" inputMode="decimal" width="w-20" unit="B" />
          <NumberField label="Value size" value={valueBytes} onChange={setValueBytes} placeholder="512" inputMode="decimal" width="w-20" unit="B" />
          <NumberField label="Overhead" value={overhead} onChange={setOverhead} placeholder="100" inputMode="decimal" width="w-20" unit="%" />
          <NumberField label="Replication" value={replication} onChange={setReplication} placeholder="2" inputMode="decimal" width="w-16" unit="×" />
          <NumberField label="Headroom" value={headroom} onChange={setHeadroom} placeholder="20" inputMode="decimal" width="w-20" unit="%" />
        </div>
        <Hint>Estimate only — actual Redis/object memory depends on implementation details (dict overhead, allocators, encoding). Sizing headroom is recommended.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.data ? (
        <>
          <Toolbox title="Recommended" actions={<StatusChip label="estimate" value={result.data.recommendedLabel} tone="warn" />}>
            <BigValue value={result.data.recommendedLabel} copy={String(result.data.recommendedBytes)} tone="warn" />
          </Toolbox>
          <Toolbox title="Memory" actions={<CopyButton text={`recommended ${result.data.recommendedLabel}`} label="Copy all" />}>
            <ResultGrid>
              <ResultRow label="Raw data" value={`${result.data.rawLabel} (${result.data.rawSizeBytes.toLocaleString("en-US")} B)`} copy={String(result.data.rawSizeBytes)} />
              <ResultRow label="Estimated (overhead)" value={formatBytesPrecise(result.data.overheadBytes)} copy={String(result.data.overheadBytes)} />
              <ResultRow label="Replicated" value={formatBytesPrecise(result.data.replicatedBytes)} copy={String(result.data.replicatedBytes)} />
              <ResultRow label="Recommended (headroom)" value={result.data.recommendedLabel} copy={String(result.data.recommendedBytes)} />
              <ResultRow label="Per key (est.)" value={formatBytesPrecise(result.data.perKeyBytes)} copy={String(result.data.perKeyBytes)} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}