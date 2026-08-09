"use client";

import { useLayoutEffect } from "react";
import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { usePersistedState } from "@/hooks/usePersistedState";

type Theme = "light" | "dark";

const STORAGE_KEY = "devtools-theme";

/**
 * Theme toggle backed by `usePersistedState` (hydration-safe via
 * `useSyncExternalStore`) with the `dark` class applied in a layout effect:
 * this runs during hydration, before the first paint, so no `beforeInteractive`
 * <script> element — and therefore no React "script tag" console warning — is
 * needed while still avoiding a flash of the wrong theme.
 */
export function ThemeToggle() {
  const [theme, setTheme] = usePersistedState<Theme>(STORAGE_KEY, "dark");

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  );
}