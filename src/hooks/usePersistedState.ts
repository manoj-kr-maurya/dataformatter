import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent): void {
  if (event.key === null) {
    emit();
    return;
  }
  // A different tab changed or cleared this key — re-read it.
  emit();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export type SetPersistedState<T> = (value: T | ((prev: T) => T)) => void;

/**
 * `useState`-like access to localStorage, backed by `useSyncExternalStore`.
 *
 * - The initial value is resolved synchronously and SSR-consistently (no
 *   setState-in-effect, no hydration flips).
 * - Writes go straight to localStorage and notify local listeners; other tabs
 *   stay in sync through the `storage` event.
 * - Snapshots are plain string primitives, so no caching is needed and the
 *   store can never serve a stale value after localStorage is reset.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, SetPersistedState<T>] {
  const fallback = JSON.stringify(defaultValue);

  const getSnapshot = useCallback(
    () => readRaw(key) ?? fallback,
    [key, fallback],
  );

  // SSR + hydration must render the same default the server rendered. Using a
  // fixed server snapshot (never reading localStorage) keeps the first client
  // render identical to the server HTML; the stored value hydrates right after.
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const value = (() => {
    try {
      return JSON.parse(snapshot) as T;
    } catch {
      return defaultValue;
    }
  })();

  const setValue = useCallback<SetPersistedState<T>>(
    (action) => {
      const next = typeof action === "function" ? (action as (prev: T) => T)(value) : action;
      const raw = JSON.stringify(next);
      try {
        window.localStorage.setItem(key, raw);
      } catch {
        // Storage unavailable — the in-memory value still takes effect.
      }
      emit();
    },
    [key, value],
  );

  return [value, setValue];
}