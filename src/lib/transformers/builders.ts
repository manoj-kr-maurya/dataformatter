import type { DetectedType, TransformationKind, TransformationResult } from "@/types/transformation";

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
): TransformationResult {
  return {
    success: false,
    transformation: "NONE",
    inputType,
    detectedType,
    output: originalInput,
    originalInput,
    message,
  };
}