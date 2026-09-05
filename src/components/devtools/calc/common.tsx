"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CopyButton, Field, inputClass, Stat } from "@/components/devtools/shared";

/** Friendly error box (never raw JS errors). */
export type CalcLogEntry = { input: string; output: string };

export function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </p>
  );
}

export function ResultGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <dl className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${className}`}>{children}</dl>;
}

const VALUE_TONES: Record<string, string> = {
  default: "text-zinc-800 dark:text-zinc-200",
  ok: "text-emerald-700 dark:text-emerald-300",
  warn: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
};

export function ResultRow({
  label,
  value,
  copy,
  mono = true,
  tone = "default",
  suppressHydrationWarning = false,
}: {
  label: string;
  value: ReactNode;
  copy?: string;
  mono?: boolean;
  tone?: "default" | "ok" | "warn" | "error";
  suppressHydrationWarning?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-md border border-zinc-100 px-3 py-2 dark:border-zinc-800">
      <dt className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </dt>
      <dd
        suppressHydrationWarning={suppressHydrationWarning}
        className={`flex min-w-0 items-center gap-2 truncate text-right text-xs ${mono ? "font-mono " : ""}${VALUE_TONES[tone]}`}
      >
        <span className="truncate">{value}</span>
        {copy != null && <CopyButton text={copy} label="" />}
      </dd>
    </div>
  );
}

export function BigValue({
  value,
  copy,
  tone = "default",
}: {
  value: ReactNode;
  copy?: string;
  tone?: "default" | "ok" | "warn" | "error";
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <p className={`truncate font-mono text-3xl font-bold ${VALUE_TONES[tone]}`}>{value}</p>
      {copy != null && <CopyButton text={copy} label="Copy" />}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  unit,
  inputMode = "text",
  width = "w-28",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  unit?: string;
  inputMode?: "text" | "decimal" | "numeric";
  width?: string;
}) {
  return (
    <Field label={label}>
      <div className="flex items-end gap-2">
        <input
          className={`${inputClass} ${width}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          spellCheck={false}
          aria-label={label}
        />
        {unit && <span className="pb-1.5 text-xs text-zinc-500 dark:text-zinc-400">{unit}</span>}
      </div>
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  width = "w-32",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  width?: string;
}) {
  return (
    <Field label={label}>
      <select className={`${inputClass} ${width}`} value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function StatusChip({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "ok" | "warn" | "error" }) {
  return <Stat label={label} value={value} tone={tone} />;
}

/** Debounced, deduped auto-log of a completed calculation for the History tab.
 *  A pending log is flushed on unmount so quick tool switches still record a
 *  snapshot of the last completed calculation. */
export function useCalcLog(
  onLog: ((entry: { input: string; output: string }) => void) | undefined,
  input: string,
  output: string | null,
) {
  const last = useRef("");
  const pending = useRef<number | null>(null);
  const onLogRef = useRef(onLog);
  const argsRef = useRef({ input, output });
  useEffect(() => { onLogRef.current = onLog; });
  useEffect(() => { argsRef.current = { input, output }; });

  useEffect(() => {
    if (output == null) return;
    const signature = `${input}\0${output}`;
    if (signature === last.current) return;
    if (pending.current != null) window.clearTimeout(pending.current);
    pending.current = window.setTimeout(() => {
      pending.current = null;
      last.current = signature;
      onLogRef.current?.({ input, output });
    }, 600);
  }, [input, output]);

  useEffect(
    () => () => {
      if (pending.current == null) return;
      window.clearTimeout(pending.current);
      const { input: lastInput, output: lastOutput } = argsRef.current;
      if (lastOutput == null) return;
      const signature = `${lastInput}\0${lastOutput}`;
      if (signature === last.current) return;
      last.current = signature;
      onLogRef.current?.({ input: lastInput, output: lastOutput });
    },
    [],
  );
}