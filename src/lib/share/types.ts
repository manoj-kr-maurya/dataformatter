import type { ToolMode, ViewMode } from "@/types/tools";

export const SHARE_SCHEMA_VERSION = 1 as const;

export const SHARE_HASH_PREFIX = "#/share/";

/** Failures of the optimistic decode are always presented with this message. */
export const SHARE_OPEN_FAILURE_MESSAGE = "Unable to open this shared DataFormatter link.";

/** Default cap on the encoded payload so links stay practical to share. */
export const DEFAULT_SHARE_LIMIT_CHARS = 8_000;

/** What content a Single-view share was showing when created. */
export type ShareDisplay = "input" | "output";

export interface SharePayload {
  /** Schema version — bump when the shape changes. */
  v: number;
  /** "single" | "split" — the view mode. */
  mode: ViewMode;
  /** Selected operation: "AUTO_DETECT" or a manual tool id. */
  tool: ToolMode;
  /** Auto Detect toggle state. */
  autoDetect: boolean;
  /** Word-wrap editor config. */
  wordWrap: boolean;
  /** The raw input text. */
  input: string;
  /**
   * The transformed output. Omitted for deterministic tools — the output can
   * be recomputed from the input on restore, which keeps link sizes small.
   * Required only for non-deterministic tools (random generators) whose
   * output must be reproduced verbatim.
   */
  output?: string;
  /** Single-view content that was on screen at share time. */
  display: ShareDisplay;
}

/** A compressed pipeline (bytes in -> bytes out). Kept tiny so it can be
 * swapped later (e.g. Brotli) without touching application state. */
export interface ShareCodec {
  /** One-char id embedded in the URL so the decoder knows which codec to use. */
  readonly id: string;
  readonly name: string;
  compress(data: Uint8Array): Promise<Uint8Array>;
  decompress(data: Uint8Array): Promise<Uint8Array>;
}