"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, NumberField, ResultGrid, ResultRow, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { estimateQueue, formatBytesPrecise } from "@/lib/devcalc/estimators";

export function QueueCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [eventsPerSec, setEventsPerSec] = useState("1000");
  const [eventKB, setEventKB] = useState("2");
  const [retention, setRetention] = useState("7");
  const [replication, setReplication] = useState("3");

  const events = Number(eventsPerSec);
  const eventBytes = Number(eventKB) * 1000;

  const result = useMemo(() => {
    if (!Number.isFinite(events) || !Number.isFinite(eventBytes) || events < 0 || eventBytes < 0) {
      return { data: null, error: "Events/sec and event size must be non-negative numbers." };
    }
    const retentionDays = Number(retention);
    const replicationN = Number(replication);
    if (!Number.isFinite(retentionDays) || retentionDays < 0) return { data: null, error: "Retention must be a non-negative number of days." };
    if (!Number.isFinite(replicationN) || replicationN < 1) return { data: null, error: "Replication must be at least 1." };
    return {
      data: estimateQueue({ eventsPerSec: events, eventBytes, retentionDays, replication: replicationN }),
      error: null as string | null,
    };
  }, [events, eventBytes, retention, replication]);

  useCalcLog(onLog, `${events} events/s · ${eventKB} KB · ${retention} d · ×${replication}`, result.data ? `retained ${result.data.retainedLabel}` : null);

  return (
    <>
      <Toolbox title="Event stream" actions={<ClearButton onClick={() => { setEventsPerSec(""); setEventKB(""); setRetention(""); setReplication(""); }} disabled={eventsPerSec.length === 0} />}>
        <div className="flex flex-wrap items-end gap-3">
          <NumberField label="Events/sec" value={eventsPerSec} onChange={setEventsPerSec} placeholder="1000" inputMode="decimal" width="w-24" />
          <NumberField label="Event size" value={eventKB} onChange={setEventKB} placeholder="2" inputMode="decimal" width="w-20" unit="KB" />
          <NumberField label="Retention" value={retention} onChange={setRetention} placeholder="7" inputMode="decimal" width="w-20" unit="days" />
          <NumberField label="Replication" value={replication} onChange={setReplication} placeholder="3" inputMode="decimal" width="w-16" unit="×" />
        </div>
        <Hint>Generic queue/event-stream estimate (Kafka, RabbitMQ, pipelines). Not a vendor-exact capacity figure.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.data ? (
        <>
          <Toolbox title="Retained storage" actions={<StatusChip label="retained" value={result.data.retainedLabel} tone="ok" />}>
            <BigValue value={result.data.retainedLabel} copy={String(result.data.retainedBytes)} tone="ok" />
          </Toolbox>
          <Toolbox title="Volume" actions={<CopyButton text={`${result.data.eventsPerDayLabel} events/day · ${result.data.retainedLabel}`} label="Copy all" />}>
            <ResultGrid>
              <ResultRow label="Events / day" value={result.data.eventsPerDayLabel} copy={result.data.eventsPerDayLabel} />
              <ResultRow label="Events / month" value={result.data.eventsPerMonthLabel} copy={result.data.eventsPerMonthLabel} />
              <ResultRow label="Ingest / day" value={result.data.rawPerDayLabel} copy={formatBytesPrecise(result.data.rawPerDayBytes)} />
              <ResultRow label="Raw / month" value={formatBytesPrecise(result.data.rawPerMonthBytes)} copy={String(result.data.rawPerMonthBytes)} />
              <ResultRow label="Retained (× replication)" value={result.data.retainedLabel} copy={String(result.data.replicatedBytes)} />
              <ResultRow label="Throughput" value={formatBytesPrecise(result.data.throughputPerSecBytes)} copy={`${result.data.throughputPerSecBytes} bytes/s`} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}