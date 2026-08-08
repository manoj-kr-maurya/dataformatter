"use client";

interface AutoDetectToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function AutoDetectToggle({ enabled, onChange }: AutoDetectToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
        enabled
          ? "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
      />
      Auto Detect {enabled ? "ON" : "OFF"}
    </button>
  );
}