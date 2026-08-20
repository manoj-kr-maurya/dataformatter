import type { DetectedType, TransformationKind, TransformationResult } from "@/types/transformation";

export interface ResultErrorLocation {
  line?: number;
  column?: number;
  position?: number;
}

export function okResult(
  originalInput: string,
  output: string,
  transformation: TransformationKind,
  detectedType: DetectedType,
  message: string,
  inputType: DetectedType = "TEXT",
): TransformationResult {
  return {
    success: true,
    transformation,
    inputType,
    detectedType,
    output,
    originalInput,
    message,
  };
}

export function failResult(
  originalInput: string,
  message: string,
  detectedType: DetectedType = "UNKNOWN",
  inputType: DetectedType = "UNKNOWN",
  location?: ResultErrorLocation,
): TransformationResult {
  return {
    success: false,
    transformation: "NONE",
    inputType,
    detectedType,
    output: originalInput,
    originalInput,
    message,
    errorLine: location?.line,
    errorColumn: location?.column,
    errorPosition: location?.position,
  };
}

/**
 * Build a human-friendly JSON error line such as
 * `Invalid JSON — Line 4, Column 8: expected ...` and carry the precise
 * location through to the UI so it can offer a "Go to error" action.
 */
export function jsonFailResult(
  originalInput: string,
  error: { title: string; message: string; line?: number; column?: number; position?: number },
  detectedType: DetectedType = "JSON",
  inputType: DetectedType = "JSON",
): TransformationResult {
  const location =
    error.line !== undefined && error.column !== undefined
      ? `Line ${error.line}, Column ${error.column}`
      : undefined;
  const message = location
    ? `${error.title} — ${location}: ${error.message}`
    : `${error.title}: ${error.message}`;
  return failResult(
    originalInput,
    message,
    detectedType,
    inputType,
    location
      ? { line: error.line, column: error.column, position: error.position }
      : undefined,
  );
}