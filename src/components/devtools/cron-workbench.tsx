"use client";

import { useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  Stat,
  Segmented,
  Field,
  inputClass,
  Hint,
} from "@/components/devtools/shared";
import { parseCron, describeCron, nextRuns, previousRuns } from "@/lib/cron/engine";

const ZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Kyiv",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Pacific/Auckland",
];

const PRESETS = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Hourly at :00", expr: "0 * * * *" },
  { label: "Daily 02:30", expr: "30 2 * * *" },
  { label: "Weekly Mon 09:00", expr: "0 9 * * 1" },
  { label: "Weekdays 08:15", expr: "15 8 * * 1-5" },
  { label: "Seconds (6-field)", expr: "*/20 0 * * * *" },
];

function formatRun(ms: number, tz: string): string {
  const local = new Date(ms);
  return `${humanDate(local, tz)}  ${humanTime(local, tz)}`;
}

function humanDate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  })
    .format(date)
    .replace(", ", "");
}

function humanTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function CronWorkbench() {
  const [expr, setExpr] = useState("30 2 * * *");
  const [tz, setTz] = useState("UTC");
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [count, setCount] = useState(8);
  const [includeSeconds, setIncludeSeconds] = useState(false);

  const effectiveExpr = useMemo(() => {
    if (!includeSeconds || expr.split(/\s+/).filter(Boolean).length === 6) return expr;
    const fields = expr.split(/\s+/).filter(Boolean);
    return fields.length === 5 ? `0 ${fields.join(" ")}` : expr;
  }, [expr, includeSeconds]);

  const parsed = useMemo(() => parseCron(effectiveExpr), [effectiveExpr]);
  const valid = useMemo(() => !("error" in parsed), [parsed]);

  const description = useMemo(() => {
    if (!valid) return null;
    try {
      return describeCron(effectiveExpr);
    } catch {
      return null;
    }
  }, [effectiveExpr, valid]);

  const runs = useMemo(() => {
    if (!valid) return null;
    try {
      const anchor = new Date();
      const msList =
        direction === "next"
          ? nextRuns(effectiveExpr, anchor, count, tz)
          : previousRuns(effectiveExpr, anchor, count, tz);
      return msList.map((ms) => ({
        ms,
        zone: formatRun(ms, tz),
        local: formatRun(ms, Intl.DateTimeFormat().resolvedOptions().timeZone),
      }));
    } catch {
      return null;
    }
  }, [effectiveExpr, valid, direction, count, tz]);

  const report = useMemo(() => {
    if (!runs) return "";
    const lines = [
      `Expression: ${effectiveExpr}`,
      `Description: ${description ?? "—"}`,
      `Time zone: ${tz}`,
      "",
      ...runs.map((run, index) => `${String(index + 1).padStart(2, " ")}. ${run.zone}  (${run.local} local)`),
    ];
    return lines.join("\n");
  }, [effectiveExpr, description, tz, runs]);

  return (
    <div className="flex flex-col gap-3">
      <Toolbox
        title="Cron expression"
        actions={
          <div className="flex flex-wrap items-center gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.expr}
                type="button"
                className="rounded-md border border-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-300"
                onClick={() => setExpr(preset.expr)}
                title={preset.label}
              >
                {preset.label}
              </button>
            ))}
            <ClearButton onClick={() => setExpr("")} disabled={expr.length === 0} />
          </div>
        }
      >
        <input
          className={`${inputClass} w-full text-sm`}
          value={expr}
          onChange={(event) => setExpr(event.target.value)}
          placeholder="minute hour day-of-month month day-of-week — e.g. 30 2 * * *"
          aria-label="Cron expression"
          spellCheck={false}
        />
        <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <input
            type="checkbox"
            checked={includeSeconds}
            onChange={(event) => setIncludeSeconds(event.target.checked)}
            className="h-3.5 w-3.5 accent-violet-600"
          />
          Include seconds (6-field — adds &quot;0 &quot; prefix when needed)
        </label>
        <Hint>Five fields is standard. Names like JAN or mon also work, as do ranges, lists and steps.</Hint>
      </Toolbox>

      <div className="flex flex-wrap items-center gap-2">
        {valid ? (
          <Stat label="valid" value="yes" tone="ok" />
        ) : (
          <Stat label="valid" value="no" tone="error" />
        )}
        {valid && !("error" in parsed) && (
          <Stat
            label={parsed.hasSeconds ? "6 fields" : "5 fields"}
            value={parsed.hasSeconds ? "seconds" : "min · hr"}
          />
        )}
      </div>

      {!valid && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{"error" in parsed ? parsed.error : ""}</p>}

      {valid && (
        <Toolbox title="What it means" actions={<span className="text-[10px] text-zinc-400">describeCron</span>}>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">{description ?? "Runs when all fields match."}</p>
        </Toolbox>
      )}

      {valid && (
        <div className="flex flex-wrap items-center gap-4">
          <Field label="Time zone">
            <select className={inputClass} value={tz} onChange={(event) => setTz(event.target.value)} aria-label="Time zone">
              {ZONES.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </Field>
          <Field label="Direction">
            <Segmented
              ariaLabel="Run direction"
              value={direction}
              onChange={setDirection}
              options={[
                { value: "next", label: "Next runs" },
                { value: "previous", label: "Previous runs" },
              ]}
            />
          </Field>
          <Field label="Count">
            <input
              className={`${inputClass} w-16`}
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(event) => setCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
              aria-label="Run count"
            />
          </Field>
          <div className="ml-auto">
            <CopyButton text={report} label="Copy runs" />
            <DownloadButton filename="cron-runs.txt" text={report} label="Download" />
          </div>
        </div>
      )}

      {valid && (
        <Toolbox title={direction === "next" ? "Next runs" : "Previous runs"} actions={<span className="font-mono text-[10px] text-zinc-400">relative to now</span>}>
          {runs === null ? (
            <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              Could not compute runs for this expression in {tz}. (The engine validates each candidate date against the local wall time and skips DST gaps.)
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="py-1.5 pr-3 font-semibold">#</th>
                  <th className="py-1.5 pr-3 font-semibold">In {tz}</th>
                  <th className="py-1.5 font-semibold">Your local time</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, index) => (
                  <tr key={run.ms} className="border-b border-zinc-100 font-mono text-xs dark:border-zinc-800/60">
                    <td className="py-1.5 pr-3 text-zinc-400 dark:text-zinc-500">{index + 1}</td>
                    <td className="py-1.5 pr-3 text-zinc-700 dark:text-zinc-200">{run.zone}</td>
                    <td className="py-1.5 text-zinc-400 dark:text-zinc-500">{run.local}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Toolbox>
      )}
    </div>
  );
}