"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, SelectField, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { computeApiTraffic, formatBytesPrecise } from "@/lib/devcalc/estimators";

const SIZE_UNITS = ["B", "KB", "MB", "KiB", "MiB"] as const;
const SIZE_MULT: Record<string, number> = { B: 1, KB: 1e3, MB: 1e6, KiB: 1024, MiB: 1024 ** 2 };
const SIZE_OPTIONS = [...SIZE_UNITS];

export function ApiTrafficCalc({ onLog, initValue }: { onLog?: (entry: CalcLogEntry) => void; initValue?: string }) {
  const [requests, setRequests] = useState(() => initValue?.split(":")[0] ?? "1000000");
  const [reqSize, setReqSize] = useState(() => initValue?.split(":")[1] ?? "1");
  const [reqUnit, setReqUnit] = useState<string>(() => {
    if (initValue) {
      const nu = initValue.split(":")[2];
      if (nu != null && (SIZE_UNITS as readonly string[]).includes(nu)) return nu;
    }
    return "KB";
  });
  const [respSize, setRespSize] = useState(() => initValue?.split(":")[3] ?? "20");
  const [respUnit, setRespUnit] = useState<string>(() => {
    if (initValue) {
      const nu = initValue.split(":")[4];
      if (nu != null && (SIZE_UNITS as readonly string[]).includes(nu)) return nu;
    }
    return "KB";
  });

  const requestsPerDay = Number(requests);
  const requestBytes = Number(reqSize) * (SIZE_MULT[reqUnit] ?? 1);
  const responseBytes = Number(respSize) * (SIZE_MULT[respUnit] ?? 1);

  const result = useMemo(() => {
    if (!Number.isFinite(requestsPerDay) || !Number.isFinite(requestBytes) || !Number.isFinite(responseBytes) || requestsPerDay < 0 || requestBytes < 0 || responseBytes < 0) {
      return { data: null, error: "All inputs must be non-negative numbers." };
    }
    return { data: computeApiTraffic(requestsPerDay, requestBytes, responseBytes), error: null as string | null };
  }, [requestsPerDay, requestBytes, responseBytes]);

  useCalcLog(onLog, `${requests} req/day · req ${reqSize} ${reqUnit} · resp ${respSize} ${respUnit}`, result.data ? `≈ ${formatBytesPrecise(result.data.bytesPerSec)}/s` : null);

  return (
    <>
      <Toolbox title="Daily traffic" actions={<ClearButton onClick={() => { setRequests(""); setReqSize(""); setRespSize(""); }} disabled={requests.length === 0 && reqSize.length === 0 && respSize.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Requests / day" value={requests} onChange={setRequests} placeholder="1000000" inputMode="decimal" width="w-28" />
          <NumberField label="Request" value={reqSize} onChange={setReqSize} placeholder="1" inputMode="decimal" width="w-20" />
          <SelectField label="Unit" value={reqUnit} onChange={setReqUnit} options={SIZE_OPTIONS} width="w-20" />
          <NumberField label="Response" value={respSize} onChange={setRespSize} placeholder="20" inputMode="decimal" width="w-20" />
          <SelectField label="Unit" value={respUnit} onChange={setRespUnit} options={SIZE_OPTIONS} width="w-20" />
        </div>
        <Hint>Monthly rows assume 30-day months. Use B, KB/MB (×1,000) or KiB/MiB (×1,024) freely; request and response sizes can differ.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.data ? (
        <>
          <Toolbox title="Throughput" actions={<StatusChip label="per second" value={formatBytesPrecise(result.data.bytesPerSec)} tone="ok" />}>
            <BigValue value={formatBytesPrecise(result.data.bytesPerSec)} copy={`${result.data.bytesPerSec} bytes/s`} tone="ok" />
          </Toolbox>
          <Toolbox title="Traffic" actions={<CopyButton text={`${result.data.requestsPerDay} req/day · ${formatBytesPrecise(result.data.bytesPerSec)}/s`} label="Copy all" />}>
            <ResultGrid>
              <ResultRow label="Requests / sec" value={result.data.requestsPerSec.toLocaleString("en-US", { maximumFractionDigits: 2 })} copy={String(result.data.requestsPerSec)} />
              <ResultRow label="Bytes / sec" value={result.data.bytesPerSec.toLocaleString("en-US")} copy={String(result.data.bytesPerSec)} />
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