import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { transform } from "@/lib/tools";
import type { ToolMode } from "@/types/tools";
import type { TransformationResult } from "@/types/transformation";

export interface AutoProcessingOptions {
  /** The raw text the user most recently entered. */
  input: string;
  /** AUTO_DETECT or a manual tool. */
  mode: ToolMode;
  /** Whether the Auto Detect toggle is on. */
  autoEnabled: boolean;
  /** Debounce wait after the user stops typing. */
  delay?: number;
  /** Extra micro-debounce before the transform actually runs. */
  settle?: number;
}

export interface AutoProcessingState {
  result: TransformationResult | null;
  isProcessing: boolean;
}

/**
 * Shared transformation engine for both views.
 *
 * - Debounces input changes (spec: ~300–500 ms)
 * - Only recomputes when the effective input actually changes
 * - Is inert when Auto Detect is off and no manual tool is selected —
 *   callers see `result: null` / `isProcessing: false` in that case.
 */
export function useAutoProcessing({
  input,
  mode,
  autoEnabled,
  delay = 350,
  settle = 80,
}: AutoProcessingOptions): AutoProcessingState {
  const [result, setResult] = useState<TransformationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const debouncedInput = useDebounce(input, delay);
  const cacheRef = useRef<{ key: string; result: TransformationResult } | null>(null);
  const timerRef = useRef<number | null>(null);

  const active = mode !== "AUTO_DETECT" || autoEnabled;
  const visible = active && debouncedInput.trim() !== "";

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!active) {
      return;
    }

    const source = debouncedInput;
    if (!source.trim()) {
      cacheRef.current = null;
      return;
    }

    const key = `${mode}|${autoEnabled}|${source}`;
    if (cacheRef.current?.key === key) {
      return; // already applied — the state is up to date
    }

    setIsProcessing(true);
    timerRef.current = window.setTimeout(() => {
      const computed = transform(mode, autoEnabled, source);
      cacheRef.current = { key, result: computed };
      setResult(computed);
      setIsProcessing(false);
    }, settle);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, debouncedInput, mode, autoEnabled, settle]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    result: visible ? result : null,
    isProcessing: visible ? isProcessing : false,
  };
}