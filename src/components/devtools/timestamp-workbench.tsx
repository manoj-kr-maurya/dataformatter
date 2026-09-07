"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  Stat,
  inputClass,
  Hint,
} from "@/components/devtools/shared";
import { Button } from "@/components/ui/button";
import { PasteIcon } from "@/components/ui/icons";
import {
  ModeTabs,
  ErrBox,
  WarnBox,
  ZoneRows,
  TimeZonePicker,
  CopyRow,
  KeyValue,
  Accordion,
  type TimestampMode,
  type PanelCtx,
} from "@/components/devtools/timestamp/kit";
import { MultiPanels, DstDebugger } from "@/components/devtools/timestamp/modes";
import { ExtractionPanels } from "@/components/devtools/timestamp/extract";
import {
  parseTimestampText,
  epochFromNs,
  KIND_LABELS,
  type ParsedTimestamp,
  type TimestampKind,
} from "@/lib/time/parse";
import { isValidZone, wallToInstant, wallParts, zoneOffsetMinutes, DEFAULT_PRIMARY_TZ } from "@/lib/time/zones";
import {
  calendarInfo,
  formatZoned,
  precisionReport,
  relativePhrase,
  unixRangeReport,
  zoneLine,
} from "@/lib/time/inspect";
import { epochUnits } from "@/lib/time/analyze";

const DEFAULT_INPUT = "1736956800000";
const STORAGE_KEY = "df.timestamp.state.v1";
const IST = "Asia/Kolkata";

interface PersistedState {
  tz?: string;
  zones?: string[];
}

function decodeHashState(hash: string): { ts: string | null; tz: string | null; mode: TimestampMode | null; zones: string[] } {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : "");
  const modeValue = params.get("mode") ?? "";
  const known = (MODE_VALUES as readonly string[]).includes(modeValue) ? (modeValue as TimestampMode) : null;
  const zones = (params.get("zones") ?? "").split(",").filter(isValidZone);
  return { ts: params.get("ts"), tz: params.get("tz"), mode: known, zones };
}

const MODE_VALUES: TimestampMode[] = [
  "convert", "inspect", "zones", "difference", "compare", "batch", "generator", "live", "arithmetic", "extract", "jwt", "http", "developer", "ranges",
];

export function TimestampWorkbench() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [mode, setMode] = useState<TimestampMode>("convert");
  const [primaryTz, setPrimaryTz] = useState<string>(DEFAULT_PRIMARY_TZ);
  const [extraZones, setExtraZones] = useState<string[]>(["America/New_York", "Europe/London", "Asia/Tokyo"]);
  const [overrideKind, setOverrideKind] = useState<TimestampKind | null>(null);
  const [now, setNow] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  // One-time sync of saved preferences and any #hash= share state from the URL.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let tz = DEFAULT_PRIMARY_TZ;
    let zones: string[] = [];
    let m: TimestampMode | undefined;
    let tsOverride: string | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedState;
        if (parsed.tz && isValidZone(parsed.tz)) tz = parsed.tz;
        if (Array.isArray(parsed.zones)) zones = parsed.zones.filter(isValidZone);
      }
    } catch {
      /* ignore corrupt storage */
    }
    const hash = decodeHashState(window.location.hash);
    if (hash.tz && isValidZone(hash.tz)) tz = hash.tz;
    if (hash.zones.length > 0) zones = hash.zones;
    if (hash.mode) m = hash.mode;
    tsOverride = hash.ts;

    if (!isValidZone(tz)) tz = DEFAULT_PRIMARY_TZ;
    setPrimaryTz(tz);
    setExtraZones(zones);
    if (m) setMode(m);
    if (tsOverride !== null) setInput(tsOverride);
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tz: primaryTz, zones: extraZones } satisfies PersistedState));
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams();
    params.set("ts", input);
    params.set("tz", primaryTz);
    params.set("mode", mode);
    if (extraZones.length > 0) params.set("zones", extraZones.join(","));
    window.history.replaceState(null, "", `#${params.toString()}`);
  }, [input, primaryTz, mode, extraZones, mounted]);

  const parsed = useMemo(() => parseTimestampText(input, { primaryTz }), [input, primaryTz]);

  const effective: ParsedTimestamp = useMemo(() => {
    if (!overrideKind || !parsed.ok || !parsed.ambiguity || parsed.kind === overrideKind) return parsed;
    const alt = parsed.ambiguity.find((a) => a.label === KIND_LABELS[overrideKind]);
    if (alt) {
      return {
        ...parsed,
        kind: overrideKind,
        label: KIND_LABELS[overrideKind],
        ns: alt.ns,
        date: epochFromNs(alt.ns).date,
        ambiguity: undefined,
      };
    }
    return parsed;
  }, [parsed, overrideKind]);

  const ms = useMemo(() => (effective.ok && effective.ns !== undefined ? epochFromNs(effective.ns).msNumber : null), [effective]);

  const units = useMemo(() => (effective.ok && effective.ns !== undefined ? epochUnits(effective.ns) : null), [effective]);
  const iso = useMemo(() => (ms !== null && effective.date ? effective.date.toISOString() : null), [ms, effective]);
  const rfc = useMemo(() => (ms !== null && effective.date ? effective.date.toUTCString() : null), [ms, effective]);

  const presets: { label: string; value: () => string }[] = [
    { label: "Now", value: () => String(Date.now()) },
    {
      label: "Today 09:00 local",
      value: () => {
        const w = wallParts(primaryTz, Date.now());
        const r = wallToInstant(primaryTz, w.year, w.month, w.day, 9, 0, 0);
        return new Date(r.instant).toISOString();
      },
    },
    { label: "Unix 0", value: () => "0" },
    { label: "Last year", value: () => String(Date.now() - 365 * 86_400_000) },
    { label: "ISO sample", value: () => "2026-01-31T14:30:00Z" },
  ];

  const ctx: PanelCtx = { primaryTz, nowMs: now, mounted };

  const report = useMemo(() => {
    if (!effective.ok || ms === null || !units || !iso || !rfc) return "";
    const nowLine = mounted ? `Now in ${primaryTz}: ${formatZoned(primaryTz, now)}` : "";
    return [
      `Unix sec:  ${units.seconds}`,
      `Unix ms:   ${units.milliseconds}`,
      `ISO-8601:  ${iso}`,
      `RFC 1123:  ${rfc}`,
      `UTC:       ${formatZoned("UTC", ms)} UTC`,
      `${zoneLine(IST, ms)}: ${formatZoned(IST, ms)}`,
      nowLine,
    ].filter(Boolean).join("\n");
  }, [effective, units, iso, rfc, ms, primaryTz, mounted, now]);

  const handleInput = (value: string) => {
    setOverrideKind(null);
    setInput(value);
  };

  async function handlePaste() {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) return;
    try {
      const pasted = await navigator.clipboard.readText();
      if (pasted.trim()) handleInput(pasted);
    } catch {
      /* clipboard permission denied */
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-3 p-3 lg:flex-row">
      {/* Left · timestamp input */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 lg:w-1/2">
        <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
          <span className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Timestamp input
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => void handlePaste()} title="Paste from the clipboard">
              <PasteIcon className="h-3.5 w-3.5" />
              Paste
            </Button>
            <ClearButton onClick={() => handleInput("")} disabled={input.length === 0} />
          </div>
        </div>
        <textarea
          className="w-full flex-1 resize-y bg-transparent px-3 py-2 font-mono text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-500"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Paste an ISO string, Unix seconds, milliseconds, microseconds or nanoseconds…"
          aria-label="Timestamp input"
          spellCheck={false}
        />
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-300"
              onClick={() => handleInput(preset.value())}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
          <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {effective.ok
              ? `${effective.label ?? effective.kind ?? "auto-detect"}${effective.confidence !== undefined ? ` · ${effective.confidence}% confidence` : ""}`
              : "auto-detect"}
          </span>
          <span className="min-w-0 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
            UTC first, IST second. Zone-less times are read in {mounted ? zoneLine(primaryTz, ms ?? now) : "IST"}.
          </span>
        </div>
      </section>

      {/* Right · controls + output */}
      <div className="flex min-h-0 flex-col gap-3 lg:w-1/2">
        <ModeTabs mode={mode} onChange={setMode} />

        <div className="flex flex-wrap items-center gap-2">
          {effective.ok && ms !== null && mounted && (
            <Stat
              label="relative"
              value={relativePhrase(ms - now)}
              tone={ms > now ? "default" : "ok"}
              suppressHydrationWarning
            />
          )}
          <div className="ml-auto flex gap-2">
            <CopyButton text={report} label="Copy report" disabled={!report} />
            <DownloadButton filename="timestamp.txt" text={report} label="Download" disabled={!report} />
          </div>
        </div>

        <Toolbox title={`Primary timezone · ${primaryTz}`}>
          <TimeZonePicker value={primaryTz} onChange={setPrimaryTz} label="Primary timezone" />
          <Hint>UTC and IST are always shown first. Zone-less wall times you enter are interpreted in this timezone, and your choice is remembered.</Hint>
        </Toolbox>

        <div className="flex flex-col gap-3">
          {mode === "convert" && (
            <ConvertPanel
              parsed={effective}
              ms={ms}
              units={units}
              iso={iso}
              rfc={rfc}
              primaryTz={primaryTz}
              overrideKind={overrideKind}
              onOverride={(kind) => setOverrideKind(kind)}
              nowMs={now}
            />
          )}
          {mode === "inspect" && <InspectPanel ctx={ctx} parsed={effective} ms={ms} primaryTz={primaryTz} />}
          {mode === "zones" && (
            <ZonesPanel
              ms={ms}
              primaryTz={primaryTz}
              extraZones={extraZones}
              nowMs={now}
              onExtra={(z) => setExtraZones((prev) => (prev.includes(z) ? prev : [...prev]))}
              onRemove={(z) => setExtraZones((prev) => prev.filter((x) => x !== z))}
            />
          )}
          {mode === "ranges" && <RangesPanel parsed={effective} ms={ms} />}
          <MultiPanels mode={mode} ctx={ctx} />
          <ExtractionPanels mode={mode} ctx={ctx} sharedMs={ms} sharedIso={iso} />
        </div>
      </div>
    </div>
  );
}

interface Units {
  seconds: string;
  milliseconds: string;
  microseconds: string;
  nanoseconds: string;
}

function kindFromLabel(label: string): TimestampKind {
  for (const entry of Object.entries(KIND_LABELS)) {
    if (entry[1] === label) return entry[0] as TimestampKind;
  }
  return "unix-seconds";
}

const chipClass =
  "rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 transition-colors hover:border-violet-500 hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20";

function ConvertPanel({
  parsed,
  ms,
  units,
  iso,
  rfc,
  primaryTz,
  overrideKind,
  onOverride,
  nowMs,
}: {
  parsed: ParsedTimestamp;
  ms: number | null;
  units: Units | null;
  iso: string | null;
  rfc: string | null;
  primaryTz: string;
  overrideKind: TimestampKind | null;
  onOverride: (kind: TimestampKind) => void;
  nowMs: number;
}) {
  if (!parsed.ok) {
    return (
      <>
        <ErrBox>{parsed.error ?? "Invalid timestamp"}</ErrBox>
        <Hint>
          Try Unix seconds (1736956800), Unix milliseconds (1736956800000), ISO-8601 (2026-09-07T16:00:00Z), RFC 1123,
          or a date like 09/07/2026 4:00 PM.
        </Hint>
      </>
    );
  }

  const calendar = ms !== null ? calendarInfo(primaryTz, ms) : null;
  const precision = parsed.kind && parsed.ns !== undefined ? precisionReport(parsed.kind, parsed.ns) : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Stat label="detected" value={parsed.label ?? parsed.kind} tone="default" />
        {parsed.confidence !== undefined && <Stat label="confidence" value={`${parsed.confidence}%`} />}
        {parsed.wall && <Stat label={`read in ${parsed.wall.tz}`} value="wall time" tone="warn" />}
      </div>

      {parsed.ambiguity && parsed.ambiguity.length > 0 && (
        <WarnBox title="⚠ Multiple interpretations possible">
          <p>This digit count fits more than one Unix unit. Choose the intended interpretation:</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {parsed.ambiguity.map((candidate) => (
              <button
                key={`${candidate.label}-${candidate.ns}`}
                type="button"
                aria-pressed={overrideKind === kindFromLabel(candidate.label)}
                className={chipClass}
                onClick={() => onOverride(kindFromLabel(candidate.label))}
              >
                {candidate.label} · ≈{typeof candidate.year === "number" ? candidate.year : "out of range"}
              </button>
            ))}
          </div>
        </WarnBox>
      )}

      {ms === null ? (
        <WarnBox title="Outside the JavaScript Date range">
          The exact epoch values below are still correct. A calendar conversion would exceed the maximum representable
          Date instant (about year 275760).
        </WarnBox>
      ) : (
        <>
          <ZoneRows ms={ms} primaryTz={primaryTz} accent />
          {parsed.dstWarn && (
            <WarnBox title={parsed.dstWarn.text ?? "DST transition"}>
              {parsed.dstWarn.state === "ambiguous" && parsed.dstWarn.ambiguousInstants && (
                <ul className="mt-1 space-y-0.5">
                  {parsed.dstWarn.ambiguousInstants.map((t) => (
                    <li key={t} className="flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>UTC: {formatZoned("UTC", t)}</span>
                      <span>IST: {formatZoned(IST, t)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </WarnBox>
          )}
        </>
      )}

      <Toolbox title="Conversions">
        {units && (
          <dl className="flex flex-col gap-2">
            <CopyRow label="Unix seconds" value={units.seconds} caption="floor(total / 1e9)" />
            <CopyRow label="Unix milliseconds" value={units.milliseconds} caption="floor(total / 1e6)" />
            <CopyRow label="Unix microseconds" value={units.microseconds} caption="floor(total / 1e3)" />
            <CopyRow label="Unix nanoseconds" value={units.nanoseconds} />
            {iso && <CopyRow label="ISO-8601" value={iso} />}
            {rfc && <CopyRow label="RFC 1123" value={rfc} />}
          </dl>
        )}
      </Toolbox>

      <Accordion title="Timestamp inspector">
        <InspectGrid parsed={parsed} calendar={calendar} precision={precision} />
      </Accordion>

      {calendar && (
        <Accordion title={`Calendar · ${zoneLine(primaryTz, ms!)} (primary timezone)`}>
          <CalendarGrid calendar={calendar} />
        </Accordion>
      )}

      {precision && (
        <Accordion title="Precision & BigInt analyzer">
          <PrecisionGrid precision={precision} />
        </Accordion>
      )}

      {ms !== null && (
        <Accordion title="Relative time">
          <CopyRow label="From now" value={relativePhrase(ms - nowMs)} />
        </Accordion>
      )}
    </>
  );
}

function InspectPanel({
  parsed,
  ms,
  primaryTz,
  ctx,
}: {
  parsed: ParsedTimestamp;
  ms: number | null;
  primaryTz: string;
  ctx: PanelCtx;
}) {
  if (!parsed.ok) return <ErrBox>{parsed.error ?? "Invalid timestamp"}</ErrBox>;
  const calendar = ms !== null ? calendarInfo(primaryTz, ms) : null;
  const precision = parsed.kind && parsed.ns !== undefined ? precisionReport(parsed.kind, parsed.ns) : null;

  return (
    <>
      <Toolbox title="Timestamp inspector" actions={<CopyButton text={JSON.stringify(parsed)} label="Copy raw" />}>
        <dl className="flex flex-col gap-2">
          <KeyValue label="Input type" value={parsed.label ?? parsed.kind} caption={parsed.confidence !== undefined ? `${parsed.confidence}% confidence` : undefined} />
          {ms !== null && (
            <>
              <KeyValue label="UTC" value={`${formatZoned("UTC", ms)} UTC`} />
              <KeyValue label="IST" value={`${formatZoned(IST, ms)} IST`} />
              <KeyValue label="Primary timezone" value={`${formatZoned(primaryTz, ms)}`} caption={zoneLine(primaryTz, ms)} />
            </>
          )}
          {parsed.wall && <KeyValue label="Interpretation zone" value={parsed.wall.tz} caption="wall-clock input" />}
        </dl>
        <InspectGrid parsed={parsed} calendar={calendar} precision={precision} />
      </Toolbox>
      <DstDebugger ctx={ctx} />
    </>
  );
}

function InspectGrid({
  parsed,
  calendar,
  precision,
}: {
  parsed: ParsedTimestamp;
  calendar: ReturnType<typeof calendarInfo> | null;
  precision: ReturnType<typeof precisionReport> | null;
}) {
  const units = parsed.ns !== undefined ? epochUnits(parsed.ns) : null;
  return (
    <dl className="flex flex-col gap-2">
      <KeyValue label="Unix seconds" value={units?.seconds ?? "—"} />
      <KeyValue label="Unix milliseconds" value={units?.milliseconds ?? "—"} />
      <KeyValue label="Unix microseconds" value={units?.microseconds ?? "—"} />
      <KeyValue label="Unix nanoseconds" value={units?.nanoseconds ?? "—"} />
      {calendar ? (
        <>
          <KeyValue label="Day" value={`${calendar.weekdayName}, ${calendar.year}-${String(calendar.month).padStart(2, "0")}-${String(calendar.day).padStart(2, "0")}`} />
          <KeyValue label="Day of year" value={String(calendar.dayOfYear)} caption={`of ${calendar.leapYear ? 366 : 365}`} />
          <KeyValue label="ISO week" value={`${calendar.isoWeekYear}-W${String(calendar.isoWeek).padStart(2, "0")}`} />
          <KeyValue label="Quarter" value={calendar.quarter ? `Q${calendar.quarter}` : "—"} />
          <KeyValue label="Leap year" value={calendar.leapYear ? "yes" : "no"} />
        </>
      ) : (
        <KeyValue label="Calendar" value="outside Date range" />
      )}
      {precision && <KeyValue label="Precision" value={precision.unitLabel} />}
    </dl>
  );
}

function CalendarGrid({ calendar }: { calendar: NonNullable<ReturnType<typeof calendarInfo>> }) {
  return (
    <dl className="flex flex-col gap-2">
      <KeyValue label="Year" value={String(calendar.year)} caption={calendar.leapYear ? "leap year" : "common year"} />
      <KeyValue label="Month" value={calendar.monthName} />
      <KeyValue label="Day" value={`${calendar.day} ${calendar.weekdayName}`} />
      <KeyValue label="Day of year" value={`${calendar.dayOfYear} of ${calendar.leapYear ? 366 : 365}`} />
      <KeyValue label="ISO week" value={`${calendar.isoWeekYear}-W${String(calendar.isoWeek).padStart(2, "0")}-${calendar.weekdayName.slice(0, 2)}`} />
      <KeyValue label="Quarter" value={`Q${calendar.quarter}`} />
    </dl>
  );
}

function PrecisionGrid({ precision }: { precision: ReturnType<typeof precisionReport> }) {
  return (
    <dl className="flex flex-col gap-2">
      <KeyValue label="Epoch precision" value={precision.unitLabel} />
      <KeyValue
        label="JavaScript Number"
        value={precision.jsNumberSafe === null ? "—" : precision.jsNumberSafe ? "✓ Safe" : "⚠ Precision may be lost"}
      />
      <KeyValue label="JavaScript Date" value={precision.jsDateSafe === null ? "—" : precision.jsDateSafe ? "✓ Safe" : "⚠ Outside Date range"} />
      <KeyValue label="JavaScript BigInt" value="✓ Safe" caption="exact integer" />
      <KeyValue label="Python / Java / Go (int64)" value={precision.int64Fits ? "✓ Safe" : "⚠ Overflow" } />
      <KeyValue label="Signed 32-bit seconds" value={precision.int32SecondsFits ? "✓ Fits" : "✕ Overflow (±68 years from 1970)"} />
    </dl>
  );
}

function dstObserved(zone: string, ms: number | null): boolean {
  if (ms === null) return false;
  const year = wallParts(zone, ms).year;
  const probes = [0, 3, 6, 9].map((mo) => Date.UTC(year, mo, 15));
  const offsets = probes.map((t) => zoneOffsetMinutes(zone, t));
  return new Set(offsets).size > 1;
}

function ZonesPanel({
  ms,
  primaryTz,
  extraZones,
  nowMs,
  onExtra,
  onRemove,
}: {
  ms: number | null;
  primaryTz: string;
  extraZones: string[];
  nowMs: number;
  onExtra: (zone: string) => void;
  onRemove: (zone: string) => void;
}) {
  const [addValue, setAddValue] = useState("");
  const zones = [...new Set(["UTC", IST, primaryTz, ...extraZones])];
  const base = ms ?? nowMs;

  return (
    <Toolbox
      title="Timezone matrix"
      actions={<span className="text-[10px] text-zinc-400 dark:text-zinc-500">UTC and IST are always pinned at the top</span>}
    >
      {zones.length === 0 ? (
        <ErrBox>No timezones selected.</ErrBox>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                <th className="py-1 pr-2 font-medium">Zone</th>
                <th className="py-1 pr-2 font-medium">Local time</th>
                <th className="py-1 pr-2 font-medium">Offset</th>
                <th className="py-1 pr-2 font-medium">DST</th>
                <th className="py-1 pr-2 text-right font-medium">Copy</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => {
                if (!isValidZone(zone)) return null;
                const w = wallParts(zone, base);
                const pinned = zone === "UTC" || zone === IST;
                return (
                  <tr key={zone} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-1 pr-2 whitespace-nowrap">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">{zone === IST ? "IST" : zone === "UTC" ? "UTC" : w.shortName}</span>
                      {!pinned && (
                        <span className="ml-1 text-[10px] text-zinc-400">{zone}</span>
                      )}
                      {!pinned && (
                        <button
                          type="button"
                          aria-label={`Remove ${zone}`}
                          className="ml-1.5 rounded px-1 text-[10px] text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                          onClick={() => onRemove(zone)}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                    <td className="py-1 pr-2 whitespace-nowrap font-mono text-zinc-700 dark:text-zinc-200">
                      {formatZoned(zone, base)} {zone === IST ? "IST" : w.shortName}
                    </td>
                    <td className="py-1 pr-2 whitespace-nowrap text-zinc-500 dark:text-zinc-400">{w.offsetLabel}</td>
                    <td className="py-1 pr-2 whitespace-nowrap">
                      {zone === "UTC" ? (
                        <span className="text-[10px] text-zinc-400">—</span>
                      ) : dstObserved(zone, base) ? (
                        <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">DST</span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">no</span>
                      )}
                    </td>
                    <td className="py-1 pr-2 text-right whitespace-nowrap">
                      <CopyButton text={`${formatZoned(zone, base)} ${zone === IST ? "IST" : w.shortName}`} label="Copy" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="add-zone" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Add timezone
          </label>
          <input
            id="add-zone"
            list="add-zone-list"
            className={inputClass}
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            placeholder="e.g. Pacific/Auckland"
          />
          <datalist id="add-zone-list">
            {["UTC", IST, ...extraZones, ...ZONE_CANDIDATES].map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </div>
        <button
          type="button"
          className="rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
          onClick={() => {
            if (isValidZone(addValue)) onExtra(addValue);
            setAddValue("");
          }}
          disabled={!isValidZone(addValue)}
        >
          Add
        </button>
      </div>
    </Toolbox>
  );
}

const ZONE_CANDIDATES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Denver",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Asia/Karachi",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function RangesPanel({ parsed, ms }: { parsed: ParsedTimestamp; ms: number | null }) {
  if (!parsed.ok) return <ErrBox>{parsed.error ?? "Invalid timestamp"}</ErrBox>;
  if (parsed.ns === undefined) return <ErrBox>No epoch value to analyze.</ErrBox>;
  const range = unixRangeReport(parsed.ns);
  const precision = parsed.kind ? precisionReport(parsed.kind, parsed.ns) : null;

  return (
    <Toolbox title="Unix range & overflow analyzer">
      <dl className="flex flex-col gap-2">
        {ms !== null && <CopyRow label="You are at" value={`${formatZoned("UTC", ms)} UTC`} />}
        <CopyRow label="Signed 32-bit min" value={range.int32MinS} caption={range.int32MinDate} />
        <CopyRow label="Signed 32-bit max" value={range.int32MaxS} caption={`${range.int32MaxDate} — the 2038 problem`} />
        <KeyValue label="Fits signed 32-bit seconds (until 2038)?" value={range.int32 ? "yes" : "no"} />
        <KeyValue label="Fits signed 64-bit seconds?" value={range.int64 ? "yes" : "no"} />
        <KeyValue label="Year of input" value={range.yearOfInput} />
      </dl>
      <Accordion title="Why 2038?">
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Unix time is conventionally stored as a signed 32-bit integer. That counter overflows on{" "}
          <span className="font-mono">2038-01-19T03:14:07Z</span>. Any system still using 32-bit seconds will fail
          unless it switches to 64-bit (safe for ~292 billion years) or unsigned 32-bit (until 2106).
        </p>
      </Accordion>
      {precision && <PrecisionGrid precision={precision} />}
    </Toolbox>
  );
}