"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  Stat,
  Field,
  inputClass,
  Hint,
} from "@/components/devtools/shared";
import { parseTimestamp, toParts, nowInZone } from "@/lib/timestamp/convert";

const ZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
];

export function TimestampWorkbench() {
  const [text, setText] = useState("1736956800000");
  const [now, setNow] = useState(() => Date.now());
  const [zone, setZone] = useState("UTC");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parsed = useMemo(() => parseTimestamp(text), [text]);
  const parts = useMemo(() => (parsed.valid && parsed.ms != null ? toParts(parsed.ms, now) : null), [parsed, now]);
  const zoneNow = useMemo(() => nowInZone(zone, now), [zone, now]);

  const report = useMemo(() => {
    if (!parts) return "";
    return [
      `Unix ms:  ${parts.milliseconds}`,
      `Unix sec: ${parts.seconds}`,
      `ISO-8601: ${parts.iso}`,
      `UTC:      ${parts.utc}`,
      `Local:    ${parts.local}`,
      `Relative: ${parts.relative}`,
      "",
      `Now in ${zone}: ${zoneNow.date} ${zoneNow.time} (offset ${zoneNow.offsetMinutes >= 0 ? "+" : ""}${zoneNow.offsetMinutes} min)`,
    ].join("\n");
  }, [parts, zone, zoneNow]);

  const presets = [
    { label: "Now", value: () => String(Date.now()) },
    { label: "Today 09:00 local", value: () => { const d = new Date(); d.setHours(9, 0, 0, 0); return String(d.getTime()); } },
    { label: "Unix 0", value: () => "0" },
    { label: "Last year", value: () => String(Date.now() - 365 * 86_400_000) },
    { label: "ISO sample", value: () => "2026-01-31T14:30:00Z" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {parts && (
          <>
            <Stat label={parts.isFuture ? "future" : "past"} value={parts.relative} tone="default" suppressHydrationWarning />
          </>
        )}
        {zoneNow && (
          <Stat label={`now in ${zone}`} value={`${zoneNow.date} ${zoneNow.time}`} suppressHydrationWarning />
        )}
        <div className="ml-auto flex items-center gap-2">
          <CopyButton text={report} label="Copy" />
          <DownloadButton filename="timestamp.txt" text={report} label="Download" />
        </div>
      </div>

      <Toolbox title="Timestamp" actions={<ClearButton onClick={() => setText("")} disabled={text.length === 0} />}>
        <input
          className={`${inputClass} w-full text-sm`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste an ISO string, Unix seconds (like 1736956800) or milliseconds…"
          aria-label="Timestamp"
          spellCheck={false}
        />
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-300"
              onClick={() => setText(preset.value())}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Hint>Auto-detects ISO-8601, Unix seconds (≤ 11 digits), Unix milliseconds (13 digits) and RFC-1123 dates.</Hint>
      </Toolbox>

      {!parsed.valid ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{parsed.reason}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Clock reference">
              <span className={inputClass} aria-hidden suppressHydrationWarning>{new Date(now).toISOString()}</span>
            </Field>
            <Field label="Reference zone">
              <select className={inputClass} value={zone} onChange={(event) => setZone(event.target.value)} aria-label="Reference zone">
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </Field>
          </div>

          {parts && (
            <Toolbox
              title="Conversions"
              actions={
                <span className="font-mono text-[10px] text-zinc-400" suppressHydrationWarning>
                  {parts.isFuture ? `in ${parts.relative}` : `${parts.relative} ago`}
                </span>
              }
            >
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {[
                  ["Milliseconds", String(parts.milliseconds)],
                  ["Seconds", String(parts.seconds)],
                  ["Microseconds", String(parts.microseconds)],
                  ["Nanoseconds", String(parts.nanoseconds)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3 border-b border-zinc-100 pb-1 dark:border-zinc-800/60">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</dt>
                    <dd className="font-mono text-xs text-zinc-700 dark:text-zinc-200">{value}</dd>
                  </div>
                ))}
                <ConversionRow label="ISO-8601" value={parts.iso} />
                <ConversionRow label="UTC" value={parts.utc} />
                <div className="sm:col-span-2">
                  <ConversionRow label="Your local time" value={parts.local} suppressHydrationWarning />
                </div>
              </dl>
            </Toolbox>
          )}
        </>
      )}
    </div>
  );
}

function ConversionRow({ label, value, suppressHydrationWarning = false }: { label: string; value: string; suppressHydrationWarning?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-zinc-100 pb-1 sm:col-span-2 dark:border-zinc-800/60">
      <dt className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="truncate font-mono text-xs text-zinc-700 dark:text-zinc-200" suppressHydrationWarning={suppressHydrationWarning}>{value}</dd>
    </div>
  );
}