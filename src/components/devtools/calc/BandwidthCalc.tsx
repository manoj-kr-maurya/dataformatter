"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { computeBandwidth, formatBytesPrecise } from "@/lib/devcalc/estimators";

export function BandwidthCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [rps, setRps] = useState("5000");
  const [reqKB, setReqKB] = useState("0");
  const [respKB, setRespKB] = useState("20");

  const rpsNum = Number(rps);
  const reqBytes = Number(reqKB) * 1000;
  const respBytes = Number(respKB) * 1000;

  const result = useMemo(() => {
    if (!Number.isFinite(rpsNum) || !Number.isFinite(reqBytes) || !Number.isFinite(respBytes) || rpsNum < 0 || reqBytes < 0 || respBytes < 0) {
      return { data: null, error: "All inputs must be non-negative numbers." };
    }
    return { data: computeBandwidth(rpsNum, reqBytes, respBytes), error: null as string | null };
  }, [rpsNum, reqBytes, respBytes]);

  useCalcLog(onLog, `${rps} RPS · req ${reqKB} KB · resp ${respKB} KB`, result.data ? `≈ ${formatBytesPrecise(result.data.mbPerSec * 1e6)}/s` : null);

  return (
    <>
      <Toolbox title="Traffic" actions={<ClearButton onClick={() => { setRps(""); setReqKB(""); setRespKB(""); }} disabled={rps.length === 0 && reqKB.length === 0 && respKB.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Requests/sec" value={rps} onChange={setRps} placeholder="5000" inputMode="decimal" width="w-24" />
          <NumberField label="Request" value={reqKB} onChange={setReqKB} placeholder="0" inputMode="decimal" width="w-20" unit="KB" />
          <NumberField label="Response" value={respKB} onChange={setRespKB} placeholder="20" inputMode="decimal" width="w-20" unit="KB" />
        </div>
        <Hint>KB here are 1,000 bytes. Bandwidth = RPS × (request + response) size. Rough for planning — real-world has protocol overhead.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.data ? (
        <>
          <Toolbox title="Bandwidth" actions={<StatusChip label="per second" value={formatBytesPrecise(result.data.mbPerSec * 1e6)} tone="ok" />}>
            <BigValue value={formatBytesPrecise(result.data.mbPerSec * 1e6)} copy={`${result.data.bytesPerSec} bytes/s`} tone="ok" />
          </Toolbox>
          <Toolbox title="Throughput" actions={<CopyButton text={`${result.data.bytesPerSec} bytes/s`} label="Copy all" />}>
            <ResultGrid>
              <ResultRow label="Bytes / sec" value={result.data.bytesPerSec} copy={String(result.data.bytesPerSec)} />
              <ResultRow label="KB / sec" value={formatBytesPrecise(result.data.kbPerSec * 1000)} copy={`${result.data.kbPerSec} KB/s`} />
              <ResultRow label="MB / sec" value={formatBytesPrecise(result.data.mbPerSec * 1e6)} copy={`${result.data.mbPerSec} MB/s`} />
              <ResultRow label="GB / day" value={formatBytesPrecise(result.data.gbPerDay * 1e9)} copy={`${result.data.gbPerDay} GB/day`} />
              <ResultRow label="GB / month" value={formatBytesPrecise(result.data.gbPerMonth * 1e9)} copy={`${result.data.gbPerMonth} GB/month`} />
              <ResultRow label="TB / month" value={formatBytesPrecise(result.data.tbPerMonth * 1e12)} copy={`${result.data.tbPerMonth} TB/month`} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}