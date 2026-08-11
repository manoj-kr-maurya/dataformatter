import { detectInput } from "@/lib/detection/detectInput";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { formatJwtOutput } from "@/lib/jwt/format";

/**
 * Auto-detection pipeline used by the IDE mode:
 * JSON → pretty-print · Base64 → decode (+ pretty-print decoded JSON) ·
 * JWT → decode header + payload · otherwise keep the input untouched.
 */
export function autoTransform(input: string): TransformationResult {
  if (!input.trim()) {
    return okResult(input, input, "NONE", "UNKNOWN", "Waiting for input.", "UNKNOWN");
  }

  const detected = detectInput(input);

  switch (detected.status) {
    case "jwt":
      return okResult(
        input,
        formatJwtOutput(detected.value),
        "JWT_DECODE",
        "JWT",
        "JWT decoded — header and payload shown",
        "JWT",
      );

    case "json":
      return okResult(
        input,
        JSON.stringify(detected.value, null, 2),
        "JSON_FORMAT",
        "JSON",
        "JSON detected and pretty-printed",
        "JSON",
      );

    case "base64":
      if (detected.decodedIsJson && detected.jsonValue !== undefined) {
        return okResult(
          input,
          JSON.stringify(detected.jsonValue, null, 2),
          "BASE64_TO_JSON",
          "JSON",
          "Base64 decoded and JSON pretty-printed",
          "BASE64",
        );
      }
      return okResult(
        input,
        detected.decoded,
        "BASE64_DECODE",
        "TEXT",
        "Base64 decoded to plain text",
        "BASE64",
      );

    case "unknown":
      return failResult(
        input,
        "Unable to automatically detect a format. Paste valid JSON or Base64.",
        "UNKNOWN",
        "UNKNOWN",
      );

    case "empty":
      return okResult(input, input, "NONE", "UNKNOWN", "Waiting for input.", "UNKNOWN");
  }
}