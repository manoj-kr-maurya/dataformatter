"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon, DownloadIcon, TrashIcon } from "@/components/ui/icons";
import { copyToClipboard } from "@/lib/clipboard/copy";
import { downloadText } from "@/lib/download";

/** Shared input styling used across every developer tool workbench. */
export const inputClass =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-[13px] text-zinc-800 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500";

/** Field label wrapper for form controls in the workbench chrome. */
export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Segmented button group — the workbenches' primary control. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap items-center gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
            value === option.value
              ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Copy-to-clipboard button with transient success state. */
export function CopyButton({
  text,
  label = "Copy",
  className = "",
  disabled = false,
}: {
  text: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      disabled={disabled || text.length === 0}
      title="Copy to clipboard"
      onClick={() => {
        void (async () => {
          if (await copyToClipboard(text)) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }
        })();
      }}
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

/** Trigger a client-side .txt/.json/.csv/.yaml download of the given text. */
export function DownloadButton({
  filename,
  text,
  label = "Download",
  className = "",
  disabled = false,
  mimeType = "text/plain;charset=utf-8",
}: {
  filename: string;
  text: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  mimeType?: string;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      disabled={disabled || text.length === 0}
      title={`Download ${filename}`}
      onClick={() => downloadText(filename, text, mimeType)}
    >
      <DownloadIcon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

/** Empties a related textarea with a single click. */
export function ClearButton({
  onClick,
  disabled = false,
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      disabled={disabled}
      title="Clear input"
      onClick={onClick}
    >
      <TrashIcon className="h-3.5 w-3.5" />
      Clear
    </Button>
  );
}

/** Bordered container with a small uppercase title bar and an actions slot. */
export function Toolbox({
  title,
  actions,
  children,
  className = "",
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 ${className}`}
    >
      <header className="flex h-9 min-h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
        <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {title}
        </h2>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </header>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </section>
  );
}

/** Small status chip for summary rows (level counts, totals, etc.). */
export function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "warn" | "error" | "ok";
}) {
  const tones: Record<string, string> = {
    default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    error: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  };
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs ${tones[tone]}`}
    >
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-80">{label}</span>
    </span>
  );
}

/** Muted note for privacy/behavior callouts under inputs. */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-zinc-400 dark:text-zinc-500">
      {children}
    </p>
  );
}