"use client";

import { StarIcon } from "@/components/ui/icons";
import { usePersistedState } from "@/hooks/usePersistedState";

const STORAGE_KEY = "devtools-starred";

export function StarButton() {
  const [starred, setStarred] = usePersistedState(STORAGE_KEY, false);

  return (
    <button
      type="button"
      onClick={() => setStarred(!starred)}
      aria-label={starred ? "Starred this project" : "Star this project"}
      aria-pressed={starred}
      title={starred ? "Starred — thanks!" : "Star this project"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-amber-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-amber-400"
    >
      <StarIcon
        className={`h-4 w-4 ${
          starred ? "fill-amber-400 stroke-amber-500 dark:fill-amber-300 dark:stroke-amber-400" : ""
        }`}
      />
    </button>
  );
}