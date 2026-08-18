export type DetectedType = "JSON" | "BASE64" | "JWT" | "TEXT" | "UNKNOWN";

export type TransformationKind =
  | "NONE"
  | "JSON_FORMAT"
  | "JSON_MINIFY"
  | "JSON_ENCODE"
  | "JSON_DECODE"
  | "BASE32_ENCODE"
  | "BASE32_DECODE"
  | "BASE58_ENCODE"
  | "BASE58_DECODE"
  | "BASE64_ENCODE"
  | "BASE64_DECODE"
  | "BASE64_TO_JSON"
  | "JSON_TO_BASE64"
  | "IMAGE_TO_BASE64"
  | "BASE64_TO_IMAGE"
  | "PNG_TO_BASE64"
  | "JPG_TO_BASE64"
  | "XML_TO_BASE64"
  | "YAML_TO_BASE64"
  | "BASE64_TO_XML"
  | "BASE64_TO_YAML"
  | "CSV_TO_BASE64"
  | "BASE64_TO_CSV"
  | "TSV_TO_BASE64"
  | "BASE64_TO_TSV"
  | "BINARY_TO_BASE64"
  | "BASE64_TO_BINARY"
  | "HEX_TO_BASE64"
  | "BASE64_TO_HEX"
  | "OCTAL_TO_BASE64"
  | "JSON_TO_JAVA"
  | "JSON_TO_XML"
  | "JSON_TO_YAML"
  | "JSON_TO_CSV"
  | "JSON_TO_TSV"
  | "JSON_TO_TEXT"
  | "JSON_TO_EXCEL"
  | "JSON_TO_HTML"
  | "JWT_DECODE"
  | "URL_ENCODE"
  | "URL_DECODE"
  | "JSON_URL_ENCODE"
  | "JSON_URL_DECODE"
  | "HTML_ENCODE"
  | "HTML_DECODE"
  | "XML_URL_ENCODE"
  | "XML_URL_DECODE"
  | "UTF8_ENCODE"
  | "UTF8_DECODE"
  | "HEX_TO_UTF8";

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