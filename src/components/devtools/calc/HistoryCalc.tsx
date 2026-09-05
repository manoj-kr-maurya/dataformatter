"use client";

import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/ui/icons";

export interface HistoryEntry {
  id: string;
  time: string;
  group: string;
  tool: string;
  groupKey: string;
  toolKey: string;
  input: string;
  output: string;
}

export function CalcHistory({
  entries,
  onClear,
  onDelete,
  onRestore,
}: {
  entries: HistoryEntry[];
  onClear: () => void;
  onDelete: (id: string) => void;
  onRestore: (entry: HistoryEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="px-1 py-4 text-sm text-zinc-500 dark:text-zinc-400">
        No calculations yet. Use any calculator tool and its result will appear here — stored only in your browser.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {entries.length} saved locally · never uploaded
        </p>
        <Button variant="danger" size="sm" onClick={onClear}>
          <TrashIcon className="h-3.5 w-3.5" />
          Clear all
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/40"
          >
            <button
              type="button"
              onClick={() => onRestore(entry)}
              className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
              title={`Reopen ${entry.tool}`}
            >
              <span className="block text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {entry.tool} · {entry.time}
              </span>
              <span className="block truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">{entry.input}</span>
              <span className="block truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">→ {entry.output}</span>
            </button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(entry.id)} aria-label="Delete history entry">
              <TrashIcon className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}