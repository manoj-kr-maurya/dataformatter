import type { ToolMode, ToolType, TransformationResult } from "@/types/tools";
import { autoTransform } from "@/lib/processing/autoTransform";
import { base64Decoder } from "@/lib/transformers/base64Decoder";
import { base64Encoder } from "@/lib/transformers/base64Encoder";
import { base64ToJson } from "@/lib/transformers/base64ToJson";
import { jsonFormatter } from "@/lib/transformers/jsonFormatter";
import { jsonMinifier } from "@/lib/transformers/jsonMinifier";
import { jsonToBase64 } from "@/lib/transformers/jsonToBase64";
import { jwtDecoder } from "@/lib/transformers/jwtDecoder";

export const AUTO_DETECT = "AUTO_DETECT" as const;

export type Transformer = (input: string) => TransformationResult;

export const MANUAL_TOOLS: Record<ToolType, Transformer> = {
  JSON_FORMAT: jsonFormatter,
  JSON_MINIFY: jsonMinifier,
  BASE64_ENCODE: base64Encoder,
  BASE64_DECODE: base64Decoder,
  BASE64_TO_JSON: base64ToJson,
  JSON_TO_BASE64: jsonToBase64,
  JWT_DECODE: jwtDecoder,
};

export const TOOL_META: Record<ToolType, { label: string; description: string }> = {
  JSON_FORMAT: { label: "JSON Format", description: "Prettify JSON with 2-space indentation." },
  JSON_MINIFY: { label: "JSON Minify", description: "Compress JSON into a single line." },
  BASE64_ENCODE: { label: "Base64 Encode", description: "Encode text as UTF-8 Base64." },
  BASE64_DECODE: { label: "Base64 Decode", description: "Decode Base64 back to text." },
  BASE64_TO_JSON: { label: "Base64 → JSON", description: "Decode Base64 and require valid JSON." },
  JSON_TO_BASE64: { label: "JSON → Base64", description: "Validate JSON and encode it as Base64." },
  JWT_DECODE: { label: "JWT Decode", description: "Decode a JWT header and payload (no signature verification)." },
};

export const MANUAL_TOOL_ORDER: ToolType[] = [
  "JSON_FORMAT",
  "JSON_MINIFY",
  "BASE64_ENCODE",
  "BASE64_DECODE",
  "BASE64_TO_JSON",
  "JSON_TO_BASE64",
  "JWT_DECODE",
];

/**
 * Single entry point for every transformation, manual or automatic.
 * Both views use this — the transformation engine lives in exactly one place.
 */
export function transform(
  mode: ToolMode,
  autoEnabled: boolean,
  input: string,
): TransformationResult {
  if (mode === AUTO_DETECT) {
    return autoEnabled ? autoTransform(input) : autoTransformOffResult(input);
  }
  return MANUAL_TOOLS[mode](input);
}

function autoTransformOffResult(input: string): TransformationResult {
  return {
    success: false,
    transformation: "NONE",
    inputType: "UNKNOWN",
    detectedType: "UNKNOWN",
    output: input,
    originalInput: input,
    message: "Auto Detect is off — pick a manual tool or re-enable Auto Detect.",
  };
}