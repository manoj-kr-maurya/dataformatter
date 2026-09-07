"use client";

import { type ReactNode } from "react";
import { CopyButton, inputClass } from "@/components/devtools/shared";
import { AlertIcon, CheckIcon, ChevronIcon } from "@/components/ui/icons";
import { isValidZone, wallParts, COMMON_ZONES, EXTRA_ZONES } from "@/lib/time/zones";
import { formatZoned } from "@/lib/time/inspect";

export type TimestampMode =
  | "convert"
  | "inspect"
  | "zones"
  | "difference"
  | "compare"
  | "batch"
  | "generator"
  | "live"
  | "arithmetic"
  | "extract"
  | "jwt"
  | "http"
  | "developer"
  | "ranges";

/** Shared context handed to panel components. */
export interface PanelCtx {
  primaryTz: string;
  nowMs: number;
  mounted: boolean;
}

export const MODES: { value: TimestampMode; label: string }[] = [
  { value: "convert", label: "Converter" },
  { value: "inspect", label: "Inspector" },
  { value: "zones", label: "Time Zones" },
  { value: "difference", label: "Difference" },
  { value: "compare", label: "Compare" },
  { value: "batch", label: "Batch" },
  { value: "generator", label: "Generator" },
  { value: "live", label: "Live Clock" },
  { value: "arithmetic", label: "Arithmetic" },
  { value: "extract", label: "Log Extractor" },
  { value: "jwt", label: "JWT" },
  { value: "http", label: "HTTP" },
  { value: "developer", label: "Developer" },
  { value: "ranges", label: "Unix Ranges" },
];

export function ModeTabs({ mode, onChange }: { mode: TimestampMode; onChange: (mode: TimestampMode) => void }) {
  return (
    <nav aria-label="Tool modes" className="flex flex-wrap gap-1">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          aria-pressed={mode === m.value}
          onClick={() => onChange(m.value)}
          className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
            mode === m.value
              ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
          }`}
        >
          {m.label}
        </button>
      ))}
    </nav>
  );
}

export function ErrBox({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function WarnBox({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <p className="flex items-start gap-2 font-medium">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{title}</span>
      </p>
      {children && <div className="mt-1.5 text-xs leading-relaxed opacity-90">{children}</div>}
    </div>
  );
}

export function OkBox({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
      <CheckIcon className="h-4 w-4 shrink-0" />
      {children}
    </p>
  );
}

export function HintText({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-snug text-zinc-400 dark:text-zinc-500">{children}</p>;
}

export function CopyRow({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800/60">
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</dt>
        {caption && <dd className="text-[10px] text-zinc-400 dark:text-zinc-500">{caption}</dd>}
        <dd className="truncate font-mono text-xs text-zinc-700 dark:text-zinc-200">{value}</dd>
      </div>
      <CopyButton text={value} label="Copy" />
    </div>
  );
}

export function KeyValue({ label, value, caption }: { label: string; value: ReactNode; caption?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800/60">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="truncate font-mono text-xs text-zinc-700 dark:text-zinc-200" title={String(value)}>
        {value}
        {caption && <span className="ml-1.5 text-[10px] text-zinc-400">{caption}</span>}
      </dd>
    </div>
  );
}

export interface ClockRow {
  zone: string;
  /** Display label override, e.g. "IST". */
  label?: string;
}

/** The primary two-zone readout (UTC first, IST second) plus the user's zone. */
export function ZoneRows({
  ms,
  primaryTz,
  extraZone,
  accent = false,
}: {
  ms: number;
  primaryTz: string;
  extraZone?: string;
  accent?: boolean;
}) {
  const rows: { zone: string; label: string; note: string }[] = [];
  rows.push({ zone: "UTC", label: "UTC", note: "Coordinated Universal Time" });
  const ist = wallParts("Asia/Kolkata", ms);
  rows.push({ zone: "Asia/Kolkata", label: "IST", note: `${ist.offsetLabel} · Asia/Kolkata` });
  if (primaryTz && primaryTz !== "UTC" && primaryTz !== "Asia/Kolkata") {
    const w = wallParts(primaryTz, ms);
    rows.push({ zone: primaryTz, label: w.shortName, note: `${w.offsetLabel} · ${primaryTz} (primary timezone)` });
  }
  if (extraZone && extraZone !== "UTC" && extraZone !== "Asia/Kolkata" && extraZone !== primaryTz) {
    const w = wallParts(extraZone, ms);
    rows.push({ zone: extraZone, label: w.shortName === "UTC" ? extraZone : w.shortName, note: `${w.offsetLabel} · ${extraZone}` });
  }

return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map((row, i) => {
        const value = `${formatZoned(row.zone, ms)} ${row.label}`;
        const emphasized = accent && i < 2;
        return (
          <div
            key={row.zone}
            className={`rounded-lg border px-3 py-2 ${
              emphasized
                ? "border-violet-300/70 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10"
                : "border-zinc-200 bg-zinc-50 dark:border-zinc-900/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{row.label}</p>
              <CopyButton text={value} label="Copy" />
            </div>
            <p className="mt-0.5 truncate font-mono text-sm text-zinc-800 dark:text-zinc-100">{value}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{row.note}</p>
          </div>
        );
      })}
    </div>
  );
}

/** Searchable timezone selector (datalist) with quick chips. */
export function TimeZonePicker({
  value,
  onChange,
  label,
  quick = ["Asia/Kolkata", "UTC", "America/New_York", "Europe/London", "Asia/Tokyo"],
}: {
  value: string;
  onChange: (zone: string) => void;
  label: string;
  quick?: string[];
}) {
  const listId = `tz-list-${label.replace(/\W+/g, "-").toLowerCase()}`;
  const valid = isValidZone(value);
  return (
    <div>
      <label htmlFor={`tz-input-${listId}`} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </label>
      <input
        id={`tz-input-${listId}`}
        list={listId}
        className={inputClass}
        value={value}
        spellCheck={false}
        aria-invalid={!valid}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {[...COMMON_ZONES, ...EXTRA_ZONES].map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
      {!valid && <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">Unknown IANA zone — falling back to Asia/Kolkata (IST).</p>}
      <div className="mt-1.5 flex flex-wrap gap-1">
        {quick.map((z) => (
          <button
            key={z}
            type="button"
            aria-pressed={value === z}
            onClick={() => onChange(z)}
            className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-300"
          >
            {z === "Asia/Kolkata" ? "IST" : z}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Simple disclosure used to progressively reveal advanced panels. */
export function Accordion({
  title,
  children,
  defaultOpen = false,
  prefix,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  prefix?: ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40" open={defaultOpen}>
      <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:text-zinc-400 dark:hover:text-zinc-100 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5">
          <ChevronIcon className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90" />
          {title}
        </span>
        {prefix}
      </summary>
      <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">{children}</div>
    </details>
  );
}