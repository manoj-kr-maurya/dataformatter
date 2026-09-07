"use client";

import { useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  inputClass,
  Hint,
  Stat,
} from "@/components/devtools/shared";
import {
  ErrBox,
  WarnBox,
  CopyRow,
  KeyValue,
} from "@/components/devtools/timestamp/kit";
import { parseTimestampText, epochFromNs } from "@/lib/time/parse";
import { wallToInstant, formatWall } from "@/lib/time/zones";
import { formatZoned, zoneLine } from "@/lib/time/inspect";
import {
  difference,
  compareTimestamps,
  evaluateArithmetic,
  epochUnits,
} from "@/lib/time/analyze";
import type { TimestampMode, PanelCtx } from "@/components/devtools/timestamp/kit";

const IST = "Asia/Kolkata";

function optsOf(ctx: PanelCtx) {
  return { primaryTz: ctx.primaryTz };
}

function fmtMs(ms: number | null): string {
  return ms === null ? "—" : `${formatZoned("UTC", ms)} UTC`;
}

export function MultiPanels({ mode, ctx }: { mode: TimestampMode; ctx: PanelCtx }) {
  switch (mode) {
    case "difference":
      return <DifferencePanel ctx={ctx} />;
    case "compare":
      return <ComparePanel ctx={ctx} />;
    case "batch":
      return <BatchPanel ctx={ctx} />;
    case "generator":
      return <GeneratorPanel />;
    case "live":
      return <LiveClockPanel ctx={ctx} />;
    case "arithmetic":
      return <ArithmeticPanel ctx={ctx} />;
    default:
      return null;
  }
}

function DifferencePanel({ ctx }: { ctx: PanelCtx }) {
  const [a, setA] = useState("2026-09-01T12:00:00Z");
  const [b, setB] = useState("2026-09-07T16:00:00Z");

  const pa = useMemo(() => parseTimestampText(a, optsOf(ctx)), [a, ctx]);
  const pb = useMemo(() => parseTimestampText(b, optsOf(ctx)), [b, ctx]);
  const diff = useMemo(() => difference(pa, pb), [pa, pb]);

  const ma = pa.ok && pa.ns !== undefined ? epochFromNs(pa.ns).msNumber : null;
  const mb = pb.ok && pb.ns !== undefined ? epochFromNs(pb.ns).msNumber : null;

  return (
    <Toolbox title="Difference · A − B">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor="diff-a" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            A
          </label>
          <input id="diff-a" className={inputClass} value={a} onChange={(e) => setA(e.target.value)} />
          {!pa.ok && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{pa.error}</p>}
        </div>
        <div>
          <label htmlFor="diff-b" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            B
          </label>
          <input id="diff-b" className={inputClass} value={b} onChange={(e) => setB(e.target.value)} />
          {!pb.ok && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{pb.error}</p>}
        </div>
      </div>

      {pa.ok && pb.ok && diff && (
        <>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <KeyValue label="A · UTC" value={fmtMs(ma)} />
            <KeyValue label="B · UTC" value={fmtMs(mb)} />
            <KeyValue label="A · IST" value={ma === null ? "—" : `${formatZoned(IST, ma)} IST`} />
            <KeyValue label="B · IST" value={mb === null ? "—" : `${formatZoned(IST, mb)} IST`} />
          </div>
          <div className="mt-3 space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
            <Stat label="B − A" value={diff.human} tone={diff.future ? "default" : "warn"} />
            <dl className="mt-2 flex flex-col gap-1.5">
              <KeyValue label="Total seconds" value={diff.totalSeconds} />
              <KeyValue label="Total milliseconds" value={diff.totalMilliseconds} />
              <KeyValue label="Total minutes" value={diff.totalMinutes} />
              <KeyValue label="Total hours" value={diff.totalHours} />
              <KeyValue label="Total days" value={diff.totalDays} />
            </dl>
            <div className="flex gap-2">
              <CopyButton text={diff.human} label="Copy duration" />
              <CopyButton
                text={`A: ${diff.aRaw}\nB: ${diff.bRaw}\nB − A: ${diff.human} (${diff.totalSeconds}s)`}
                label="Copy report"
              />
            </div>
          </div>
        </>
      )}
    </Toolbox>
  );
}

function ComparePanel({ ctx }: { ctx: PanelCtx }) {
  const [text, setText] = useState("2026-09-01T12:00:00Z\n1736956800000\n2026-09-07 09:30:00\n0");
  const result = useMemo(() => compareTimestamps(text, optsOf(ctx)), [text, ctx]);

  const csv = useMemo(() => {
    if (result.rows.length === 0) return "";
    const header = ["label", "input", "valid", "unix_s", "unix_ms", "utc"];
    const lines = result.rows.map((r) =>
      [r.label, `"${r.raw.replace(/"/g, '""')}"`, String(r.valid), r.valid ? epochUnits(r.ns).seconds : "", r.valid ? epochUnits(r.ns).milliseconds : "", r.valid && r.date ? r.date.toISOString() : ""].join(","),
    );
    return [header.join(","), ...lines].join("\n");
  }, [result]);

  return (
    <Toolbox
      title="Compare · chronological order"
      actions={<CopyButton text={csv} label="Copy CSV" disabled={result.rows.length === 0} />}
    >
      <textarea
        className={`${inputClass} min-h-28 w-full font-mono text-xs`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="One timestamp per line (up to 100)."
        aria-label="Timestamps to compare"
        spellCheck={false}
      />
      {result.rows.length > 0 ? (
        <>
          <div className="mt-2 space-y-1">
            <KeyValue label="Chronological" value={result.chronological} />
            <KeyValue label="Earliest" value={result.earliest} caption="unix seconds" />
            <KeyValue label="Latest" value={result.latest} caption="unix seconds" />
            <KeyValue label="Span" value={result.spanHuman} />
            {result.invalidCount > 0 && <KeyValue label="Unparseable" value={`${result.invalidCount} line(s)`} caption="shown in grey below" />}
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  <th className="py-1 pr-2 font-medium">#</th>
                  <th className="py-1 pr-2 font-medium">Input</th>
                  <th className="py-1 pr-2 font-medium">UTC</th>
                  <th className="py-1 pr-2 font-medium">IST</th>
                  <th className="py-1 pr-2 font-medium">Unix s</th>
                  <th className="py-1 pr-2 font-medium">Order</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={`${row.label}-${row.raw}`} className={`border-t border-zinc-100 dark:border-zinc-800 ${row.valid ? "" : "text-zinc-400 dark:text-zinc-600"}`}>
                    <td className="py-1 pr-2 font-semibold">{row.label}</td>
                    <td className="max-w-40 truncate py-1 pr-2 font-mono">{row.raw}</td>
                    <td className="py-1 pr-2 font-mono whitespace-nowrap">{row.valid && row.date ? row.date.toISOString() : row.error ?? "—"}</td>
                    <td className="py-1 pr-2 font-mono whitespace-nowrap">{row.valid && row.date ? formatZoned(IST, row.date.getTime()) : "—"}</td>
                    <td className="py-1 pr-2 font-mono">{row.valid ? epochUnits(row.ns).seconds : "—"}</td>
                    <td className="py-1 pr-2 whitespace-nowrap">
                      {!row.valid ? (
                        <span className="text-[10px]">invalid</span>
                      ) : row.outOfOrder ? (
                        <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">out of order</span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">{row.order}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <Hint>Add at least one timestamp above.</Hint>
      )}
    </Toolbox>
  );
}

interface BatchRow {
  line: number;
  raw: string;
  ok: boolean;
  error?: string;
  unixS?: string;
  unixMs?: string;
  unixUs?: string;
  unixNs?: string;
  utc?: string;
  ist?: string;
}

function BatchPanel({ ctx }: { ctx: PanelCtx }) {
  const [text, setText] = useState("2026-09-07T16:00:00Z\n1736956800000\n1699999999\nnot a date");
  const [columns, setColumns] = useState<"default" | "full">("default");
  const limit = 5000;

  const rows = useMemo<BatchRow[]>(() => {
    const out: BatchRow[] = [];
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (i >= limit) break;
      const raw = lines[i].trim();
      if (!raw) continue;
      const parsed = parseTimestampText(raw, optsOf(ctx));
      if (parsed.ok && parsed.ns !== undefined) {
        const cache = epochFromNs(parsed.ns);
        const u = epochUnits(parsed.ns);
        out.push({
          line: i + 1,
          raw,
          ok: true,
          unixS: u.seconds,
          unixMs: u.milliseconds,
          unixUs: u.microseconds,
          unixNs: u.nanoseconds,
          utc: cache.msNumber !== null ? formatZoned("UTC", cache.msNumber) : "—",
          ist: cache.msNumber !== null ? formatZoned(IST, cache.msNumber) : "—",
        });
      } else {
        out.push({ line: i + 1, raw, ok: false, error: parsed.error });
      }
    }
    return out;
  }, [text, ctx]);

  const validCount = rows.filter((r) => r.ok).length;

  const exportText = useMemo(() => {
    if (rows.length === 0) return "";
    const header = ["line", "input", "ok", "unix_s", "unix_ms", "unix_us", "unix_ns", "utc", "ist"];
    const body = rows.map((r) =>
      [
        String(r.line),
        `"${r.raw.replace(/"/g, '""')}"`,
        String(r.ok),
        r.unixS ?? "",
        r.unixMs ?? "",
        r.unixUs ?? "",
        r.unixNs ?? "",
        `"${r.utc ?? ""}"`,
        `"${r.ist ?? ""}"`,
      ].join(","),
    );
    return [header.join(","), ...body].join("\n");
  }, [rows]);

  const jsonText = useMemo(() => JSON.stringify(rows, null, 2), [rows]);

  const markdown = useMemo(() => {
    if (rows.length === 0) return "";
    const head = "| Line | Input | Opens at UTC | IST | Unix ms |";
    const sep = "|---|---|---|---|---|";
    const body = rows.map((r) => `| ${r.line} | ${r.raw.replace(/\|/g, "\\|")} | ${r.utc ?? r.error ?? "—"} | ${r.ist ?? "—"} | ${r.unixMs ?? "—"} |`);
    return [head, sep, ...body].join("\n");
  }, [rows]);

  return (
    <Toolbox
      title="Batch · one per line"
      actions={
        <>
          <button
            type="button"
            className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] text-zinc-500 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-300"
            onClick={() => setColumns((c) => (c === "default" ? "full" : "default"))}
          >
            {columns === "default" ? "More columns" : "Fewer columns"}
          </button>
          <DownloadButton filename="batch.csv" text={exportText} label=".csv" mimeType="text/csv;charset=utf-8" disabled={rows.length === 0} />
          <DownloadButton filename="batch.json" text={jsonText} label=".json" mimeType="application/json;charset=utf-8" disabled={rows.length === 0} />
          <DownloadButton filename="batch.md" text={markdown} label=".md" mimeType="text/markdown;charset=utf-8" disabled={rows.length === 0} />
          <CopyButton text={exportText} label="Copy CSV" disabled={rows.length === 0} />
        </>
      }
    >
      <textarea
        className={`${inputClass} min-h-32 w-full font-mono text-xs`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"One timestamp per line. Mixed units and formats are detected individually.\nExample:\n1736956800\n2026-09-07T16:00:00Z"}
        aria-label="Batch timestamps"
        spellCheck={false}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Stat label="parsed" value={String(validCount)} tone={validCount === rows.length && rows.length > 0 ? "ok" : "warn"} />
        <Stat label="invalid" value={String(rows.length - validCount)} tone={rows.length - validCount > 0 ? "warn" : "default"} />
        {rows.length >= limit && <Hint>Stopped at {limit} lines.</Hint>}
      </div>
      {rows.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                <th className="py-1 pr-2 font-medium">Line</th>
                <th className="py-1 pr-2 font-medium">Input</th>
                <th className="py-1 pr-2 font-medium">UTC</th>
                <th className="py-1 pr-2 font-medium">IST</th>
                <th className="py-1 pr-2 font-medium">Unix ms</th>
                {columns === "full" && (
                  <>
                    <th className="py-1 pr-2 font-medium">Unix s</th>
                    <th className="py-1 pr-2 font-medium">Unix us</th>
                    <th className="py-1 pr-2 font-medium">Unix ns</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.line} className={`border-t border-zinc-100 dark:border-zinc-800 ${r.ok ? "" : "text-zinc-400 dark:text-zinc-600"}`}>
                  <td className="py-1 pr-2 text-right font-mono">{r.line}</td>
                  <td className="max-w-40 truncate py-1 pr-2 font-mono" title={r.raw}>{r.raw}</td>
                  <td className="py-1 pr-2 font-mono whitespace-nowrap">{r.utc ?? r.error ?? "—"}</td>
                  <td className="py-1 pr-2 font-mono whitespace-nowrap">{r.ist ?? "—"}</td>
                  <td className="py-1 pr-2 font-mono">{r.unixMs ?? "—"}</td>
                  {columns === "full" && (
                    <>
                      <td className="py-1 pr-2 font-mono">{r.unixS ?? "—"}</td>
                      <td className="py-1 pr-2 font-mono">{r.unixUs ?? "—"}</td>
                      <td className="py-1 pr-2 font-mono">{r.unixNs ?? "—"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Toolbox>
  );
}

const UNIT_OPTIONS = [
  { unit: "s", label: "Unix seconds", divides: 1n },
  { unit: "ms", label: "Unix milliseconds", divides: 1_000_000n },
  { unit: "us", label: "Unix microseconds", divides: 1_000n },
  { unit: "ns", label: "Unix nanoseconds", divides: 1n },
] as const;

function GeneratorPanel() {
  const [value, setValue] = useState("1736956800");
  const [unit, setUnit] = useState<(typeof UNIT_OPTIONS)[number]["unit"]>("s");

  const ns = useMemo(() => {
    if (!/^[+-]?\d+$/.test(value.trim())) return null;
    return BigInt(value.trim()) * UNIT_OPTIONS.find((u) => u.unit === unit)!.divides;
  }, [value, unit]);

  const cache = useMemo(() => (ns === null ? null : epochFromNs(ns)), [ns]);
  const iso = cache?.date?.toISOString() ?? null;
  const utc = cache?.msNumber !== null && cache?.msNumber !== undefined ? `${formatZoned("UTC", cache.msNumber)} UTC` : "—";
  const ist = cache?.msNumber !== null && cache?.msNumber !== undefined ? `${formatZoned(IST, cache.msNumber)} IST` : "—";

  const allText = useMemo(() => {
    if (ns === null) return "";
    const u = epochUnits(ns);
    return `unix_s=${u.seconds}\nunix_ms=${u.milliseconds}\nunix_us=${u.microseconds}\nunix_ns=${u.nanoseconds}\n${iso ? `iso=${iso}` : ""}\nutc=${utc}\nist=${ist}`;
  }, [ns, iso, utc, ist]);

  const jsonText = useMemo(() => {
    if (ns === null) return "";
    const u = epochUnits(ns);
    return JSON.stringify({ unix_s: u.seconds, unix_ms: u.milliseconds, unix_us: u.microseconds, unix_ns: u.nanoseconds, iso, utc, ist }, null, 2);
  }, [ns, iso, utc, ist]);

  const envText = useMemo(() => {
    if (ns === null) return "";
    const u = epochUnits(ns);
    return [`UNIX_SECONDS=${u.seconds}`, `UNIX_MILLISECONDS=${u.milliseconds}`, iso ? `ISO8601=${iso}` : "", `UTC_TIME=${utc}`].filter(Boolean).join("\n");
  }, [ns, iso, utc]);

  return (
    <Toolbox
      title="Generator · value to formats"
      actions={
        <>
          <CopyButton text={allText} label="Copy all" disabled={allText.length === 0} />
          <CopyButton text={jsonText} label="JSON" disabled={jsonText.length === 0} />
          <CopyButton text={envText} label="Env vars" disabled={envText.length === 0} />
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1">
          <label htmlFor="gen-value" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Value
          </label>
          <input id="gen-value" className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} spellCheck={false} />
        </div>
        <div className="min-w-32">
          <label htmlFor="gen-unit" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Unit
          </label>
          <select id="gen-unit" className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value as (typeof UNIT_OPTIONS)[number]["unit"])}>
            {UNIT_OPTIONS.map((u) => (
              <option key={u.unit} value={u.unit}>{u.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
          onClick={() => setValue(String(Math.floor(Date.now() / 1000)))}
        >
          Use now
        </button>
      </div>
      {ns !== null ? (
        <dl className="mt-3 flex flex-col gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
          <CopyRow label="Unix seconds" value={ns !== null ? epochUnits(ns).seconds : "—"} />
          <CopyRow label="Unix milliseconds" value={ns !== null ? epochUnits(ns).milliseconds : "—"} />
          <CopyRow label="Unix microseconds" value={ns !== null ? epochUnits(ns).microseconds : "—"} />
          <CopyRow label="Unix nanoseconds" value={ns !== null ? epochUnits(ns).nanoseconds : "—"} />
          <CopyRow label="ISO-8601" value={iso ?? "outside Date range"} />
          <CopyRow label="UTC" value={utc} />
          <CopyRow label="IST" value={ist} caption="Asia/Kolkata" />
        </dl>
      ) : (
        <Hint>Enter an integer in the selected unit.</Hint>
      )}
    </Toolbox>
  );
}

function LiveClockPanel({ ctx }: { ctx: PanelCtx }) {
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const ms = pausedAt ?? ctx.nowMs;

  const utcText = `${formatZoned("UTC", ms)} UTC`;
  const istText = `${formatZoned(IST, ms)} IST`;
  const primary = ctx.primaryTz === IST ? null : `${formatZoned(ctx.primaryTz, ms)} ${ctx.primaryTz.replace("_", " ")}`;

  return (
    <Toolbox
      title="Live clock"
      actions={
        <button
          type="button"
          className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-300"
          onClick={() => setPausedAt((prev) => (prev === null ? ctx.nowMs : null))}
        >
          {pausedAt === null ? "Pause" : "Resume"}
        </button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-100" suppressHydrationWarning>
          {istText}
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <span className="font-mono text-sm text-zinc-600 dark:text-zinc-300" suppressHydrationWarning>{utcText}</span>
          {primary && (
            <span className="font-mono text-sm text-zinc-600 dark:text-zinc-300" suppressHydrationWarning>{primary}</span>
          )}
          <CopyButton text={`${utcText}\n${istText}`} label="Copy both" />
        </div>
      </div>
    </Toolbox>
  );
}

const ARITH_SAMPLES = ["now + 2h", "now - 30m", "2026-09-07T10:00:00Z + 5d", "now + 1w 2d", "1736956800 + 90m"];

function ArithmeticPanel({ ctx }: { ctx: PanelCtx }) {
  const [expr, setExpr] = useState("now + 2h 30m");
  const result = useMemo(() => evaluateArithmetic(expr, optsOf(ctx), ctx.nowMs), [expr, ctx]);
  const cache = useMemo(() => (result.nsAfter !== undefined ? epochFromNs(result.nsAfter) : null), [result]);

  return (
    <Toolbox title="Arithmetic · now ± value" actions={<ClearButton onClick={() => setExpr("")} disabled={expr.length === 0} />}>
      <input className={inputClass} value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="e.g. now + 2d or 2026-09-07T10:00:00Z + 90m" spellCheck={false} />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ARITH_SAMPLES.map((sample) => (
          <button
            key={sample}
            type="button"
            className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-300"
            onClick={() => setExpr(sample)}
          >
            {sample}
          </button>
        ))}
      </div>

      {result.error ? (
        <div className="mt-3"><ErrBox>{result.error}</ErrBox></div>
      ) : (
        cache && (
          <div className="mt-3 space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
            <Stat label="base" value={result.baseText} tone="default" />
            {result.ops.length > 0 && <Stat label="operations" value={result.ops.join(" ")} tone="default" />}
            <KeyValue label="Result UTC" value={cache.msNumber !== null ? `${formatZoned("UTC", cache.msNumber)} UTC` : "—"} />
            <KeyValue label="Result IST" value={cache.msNumber !== null ? `${formatZoned(IST, cache.msNumber)} IST` : "—"} />
            <KeyValue label="Unix seconds" value={cache.msNumber !== null ? epochUnits(BigInt(cache.ns)).seconds : "—"} />
            <CopyButton text={`${result.expr} → ${cache.msNumber !== null ? formatZoned("UTC", cache.msNumber) : "out of range"}`} label="Copy result" />
          </div>
        )
      )}
      <Hint>Units: ns, us, ms, s, m, h, d, w. Combine like: now + 1w 2d 30m.</Hint>
    </Toolbox>
  );
}

/** Standalone DST debugger: nonexistent / ambiguous local times using real rules. */
export function DstDebugger({ ctx }: { ctx: PanelCtx }) {
  const [zone, setZone] = useState("America/New_York");
  const [wall, setWall] = useState("2026-03-08 02:30");

  const result = useMemo(() => {
    const m = wall.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    return wallToInstant(zone, Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]) ? Number(m[6]) : 0);
  }, [zone, wall]);

  return (
    <Toolbox title="DST debugger · nonexistent & ambiguous wall times">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor="dst-zone" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Zone
          </label>
          <input id="dst-zone" className={inputClass} value={zone} onChange={(e) => setZone(e.target.value)} placeholder="America/New_York" spellCheck={false} />
        </div>
        <div>
          <label htmlFor="dst-wall" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Wall time
          </label>
          <input id="dst-wall" className={inputClass} value={wall} onChange={(e) => setWall(e.target.value)} placeholder="2026-03-08 02:30" spellCheck={false} />
        </div>
      </div>

      {result === null ? (
        <Hint>Enter a wall time as YYYY-MM-DD HH:MM[:SS].</Hint>
      ) : result.state === "unique" ? (
        <div className="mt-3 space-y-2">
          <KeyValue label="State" value="unique — ordinary local time" />
          <KeyValue label="Resolved" value={`${formatZoned("UTC", result.instant)} UTC`} />
          <KeyValue label="IST" value={`${formatZoned(IST, result.instant)} IST`} />
        </div>
      ) : (
        <WarnBox title={result.text ?? "DST transition"}>
          {result.state === "ambiguous" ? (
            <ul className="mt-1.5 space-y-1">
              {(result.ambiguousInstants ?? []).map((t) => (
                <li key={t} className="font-mono text-[11px]">
                  {formatZoned(zone, t)} {zone} → {formatZoned("UTC", t)} UTC → {formatZoned(IST, t)} IST
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[11px]">
              Resolved (forward) to {formatZoned("UTC", result.instant)} UTC / {formatZoned(IST, result.instant)} IST.
            </p>
          )}
        </WarnBox>
      )}
      <Hint>
        Examples: <span className="font-mono">2026-03-08 02:30</span> (US spring-forward gap),{" "}
        <span className="font-mono">2026-11-01 01:30</span> (US fall-back overlap), east of {formatWall({ hour: 0, minute: 0, second: 0 })}...{" "}
        {zoneLine(zone, ctx.nowMs)}.
      </Hint>
    </Toolbox>
  );
}