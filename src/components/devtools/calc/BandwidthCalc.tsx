"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, SelectField, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { computeBandwidth, formatBytesPrecise } from "@/lib/devcalc/estimators";

const SIZE_UNITS = ["KB (×1,000)", "KiB (×1,024)"] as const;
const SIZE_MULT: Record<string, number> = { "KB (×1,000)": 1_000, "KiB (×1,024)": 1024 };

export function BandwidthCalc({ onLog, initValue }: { onLog?: (entry: CalcLogEntry) => void; initValue?: string }) {
  const [sizeUnit, setSizeUnit] = useState<string>("KB (×1,000)");
  const sizeUnitOptions = [...SIZE_UNITS] as string[];
  const [rps, setRps] = useState(() => initValue?.split(":")[0] ?? "5000");
  const [reqKB, setReqKB] = useState(() => initValue?.split(":")[1] ?? "0");
  const [respKB, setRespKB] = useState(() => initValue?.split(":")[2] ?? "20");

  const rpsNum = Number(rps);
  const multiplier = SIZE_MULT[sizeUnit] ?? 1_000;
  const reqBytes = Number(reqKB) * multiplier;
  const respBytes = Number(respKB) * multiplier;

  const result = useMemo(() => {
    if (!Number.isFinite(rpsNum) || !Number.isFinite(reqBytes) || !Number.isFinite(respBytes) || rpsNum < 0 || reqBytes < 0 || respBytes < 0) {
      return { data: null, error: "All inputs must be non-negative numbers." };
    }
    return { data: computeBandwidth(rpsNum, reqBytes, respBytes), error: null as string | null };
  }, [rpsNum, reqBytes, respBytes]);

  const direction = useMemo(() => {
    if (reqBytes > 0 === false && respBytes > 0 === false) return null;
    const incoming = reqBytes > 0 ? computeBandwidth(rpsNum, reqBytes, 0) : null;
    const outgoing = respBytes > 0 ? computeBandwidth(rpsNum, 0, respBytes) : null;
    return { incoming, outgoing };
  }, [rpsNum, reqBytes, respBytes]);

  useCalcLog(onLog, `${rps} RPS · req ${reqKB} ${sizeUnit} · resp ${respKB} ${sizeUnit}`, result.data ? `≈ ${formatBytesPrecise(result.data.mbPerSec * 1e6)}/s` : null);

  return (
    <>
      <Toolbox title="Traffic" actions={<ClearButton onClick={() => { setRps(""); setReqKB(""); setRespKB(""); }} disabled={rps.length === 0 && reqKB.length === 0 && respKB.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Requests/sec" value={rps} onChange={setRps} placeholder="5000" inputMode="decimal" width="w-24" />
          <NumberField label="Request" value={reqKB} onChange={setReqKB} placeholder="0" inputMode="decimal" width="w-20" />
          <NumberField label="Response" value={respKB} onChange={setRespKB} placeholder="20" inputMode="decimal" width="w-20" />
          <SelectField label="Size units" value={sizeUnit} onChange={setSizeUnit} options={sizeUnitOptions} width="w-36" />
        </div>
        <Hint>Bandwidth = RPS × (request + response) size. Pick decimal KB (×1,000) or binary KiB (×1,024). Month rows assume a 30-day month; real-world traffic has protocol overhead.</Hint>
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
          {direction && (
            <Toolbox title="Incoming & outgoing" actions={<CopyButton text={`in ${direction.incoming?.mbPerSec != null ? direction.incoming.mbPerSec.toFixed(2) + " MB/s" : "0 MB/s"} · out ${direction.outgoing?.mbPerSec != null ? direction.outgoing.mbPerSec.toFixed(2) + " MB/s" : "0 MB/s"}`} label="Copy all" />}>
              <ResultGrid>
                <ResultRow label="Request (in) MB/s" value={direction.incoming ? formatBytesPrecise(direction.incoming.mbPerSec * 1e6) : "—"} copy={direction.incoming ? String(direction.incoming.mbPerSec) : undefined} />
                <ResultRow label="Response (out) MB/s" value={direction.outgoing ? formatBytesPrecise(direction.outgoing.mbPerSec * 1e6) : "—"} copy={direction.outgoing ? String(direction.outgoing.mbPerSec) : undefined} />
                <ResultRow label="Request (in) GB/day" value={direction.incoming ? formatBytesPrecise(direction.incoming.gbPerDay * 1e9) : "—"} copy={direction.incoming ? String(direction.incoming.gbPerDay) : undefined} />
                <ResultRow label="Response (out) GB/day" value={direction.outgoing ? formatBytesPrecise(direction.outgoing.gbPerDay * 1e9) : "—"} copy={direction.outgoing ? String(direction.outgoing.gbPerDay) : undefined} />
                <ResultRow label="Request (in) GB/month" value={direction.incoming ? formatBytesPrecise(direction.incoming.gbPerMonth * 1e9) : "—"} copy={direction.incoming ? String(direction.incoming.gbPerMonth) : undefined} />
                <ResultRow label="Response (out) GB/month" value={direction.outgoing ? formatBytesPrecise(direction.outgoing.gbPerMonth * 1e9) : "—"} copy={direction.outgoing ? String(direction.outgoing.gbPerMonth) : undefined} />
              </ResultGrid>
            </Toolbox>
          )}
        </>
      ) : null}
    </>
  );
}