import type { CSSProperties, ReactNode } from "react";

interface PanelProps {
  title: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Panel({ title, headerExtra, children, className = "", style }: PanelProps) {
  return (
    <section
      style={style}
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 ${className}`}
    >
      <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {title}
        </h2>
        {headerExtra}
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}