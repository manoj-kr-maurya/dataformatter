export type DetectedType = "JSON" | "BASE64" | "TEXT" | "UNKNOWN";

export type TransformationKind =
  | "NONE"
  | "JSON_FORMAT"
  | "JSON_MINIFY"
  | "BASE64_ENCODE"
  | "BASE64_DECODE"
  | "BASE64_TO_JSON"
  | "JSON_TO_BASE64";

/**
 * Generic, UI-independent result produced by every transformation —
 * both the auto-detection pipeline and the manual tools.
 */
export interface TransformationResult {
  success: boolean;
  /** What kind of transformation was applied (NONE = no change). */
  transformation: TransformationKind;
  /** What the user actually pasted/typed. */
  inputType: DetectedType;
  /** What the produced output looks like. */
  detectedType: DetectedType;
  /** Resulting text. For errors this equals the original input unchanged. */
  output: string;
  /** The exact input the transformation was applied to. */
  originalInput: string;
  /** Human readable status message, colour + prepended icon by the UI. */
  message: string;
}

export interface TransformState {
  result: TransformationResult | null;
  isProcessing: boolean;
}