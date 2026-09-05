"use client";

import { useMemo, useState } from "react";
import { Toolbox, ClearButton, Hint, CopyButton } from "@/components/devtools/shared";
import { BigValue, ErrorBox, ResultGrid, ResultRow, StatusChip, useCalcLog, type CalcLogEntry } from "@/components/devtools/calc/common";
import { cidrBreakdown } from "@/lib/devcalc/network";

export function CidrCalc({ onLog }: { onLog?: (entry: CalcLogEntry) => void }) {
  const [input, setInput] = useState("192.168.1.0/24");

  const result = useMemo(() => {
    try {
      return { cidr: cidrBreakdown(input), error: null as string | null };
    } catch (cause) {
      return { cidr: null, error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [input]);

  useCalcLog(onLog, input, result.cidr ? `${result.cidr.network}/${result.cidr.prefix} · usable ${result.cidr.usableAddresses}` : null);

  const summary = result.cidr
    ? `network ${result.cidr.network}, broadcast ${result.cidr.broadcast}, mask ${result.cidr.subnetMask}, usable ${result.cidr.usableAddresses}`
    : "";

  return (
    <>
      <Toolbox title="CIDR" actions={<ClearButton onClick={() => setInput("")} disabled={input.length === 0} />}>
        <input
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-[13px] text-zinc-800 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="192.168.1.0/24"
          aria-label="CIDR address"
          spellCheck={false}
        />
        <Hint>IPv4 only. /31 and /32 are point-to-point: no network/broadcast subtraction. Structure is ready for IPv6 later.</Hint>
      </Toolbox>

      {result.error ? (
        <ErrorBox message={result.error} />
      ) : result.cidr ? (
        <>
          <Toolbox title="Network" actions={<StatusChip label="usable" value={result.cidr.usableAddresses} tone="ok" />}>
            <BigValue value={`${result.cidr.network}/${result.cidr.prefix}`} copy={summary} tone="ok" />
          </Toolbox>
          <Toolbox title="Address breakdown" actions={<CopyButton text={summary} label="Copy all" />}>
            <ResultGrid>
              <ResultRow label="IP address" value={result.cidr.ip} copy={result.cidr.ip} mono={false} />
              <ResultRow label="Prefix" value={`/${result.cidr.prefix}`} copy={`/${result.cidr.prefix}`} />
              <ResultRow label="Subnet mask" value={result.cidr.subnetMask} copy={result.cidr.subnetMask} />
              <ResultRow label="Wildcard mask" value={result.cidr.wildcardMask} copy={result.cidr.wildcardMask} />
              <ResultRow label="Network" value={result.cidr.network} copy={result.cidr.network} />
              <ResultRow label="Broadcast" value={result.cidr.broadcast} copy={result.cidr.broadcast} />
              <ResultRow label="First usable" value={result.cidr.firstUsable} copy={result.cidr.firstUsable} />
              <ResultRow label="Last usable" value={result.cidr.lastUsable} copy={result.cidr.lastUsable} />
              <ResultRow label="Total addresses" value={result.cidr.totalAddresses} copy={String(result.cidr.totalAddresses)} />
              <ResultRow label="Usable addresses" value={result.cidr.usableAddresses} copy={String(result.cidr.usableAddresses)} />
            </ResultGrid>
          </Toolbox>
          <Toolbox title="Binary">
            <ResultGrid>
              <ResultRow label="IP binary" value={result.cidr.ipBinary} copy={result.cidr.ipBinary} mono={false} />
              <ResultRow label="Network binary" value={result.cidr.networkBinary} copy={result.cidr.networkBinary} mono={false} />
            </ResultGrid>
          </Toolbox>
        </>
      ) : null}
    </>
  );
}