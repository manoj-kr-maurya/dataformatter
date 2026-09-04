import { detectInput } from "@/lib/detection/detectInput";
import { decodeJsonBase64Recursive, jsonHasDecodableBase64 } from "@/lib/processing/decodeJsonBase64";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { formatJwtOutput } from "@/lib/jwt/format";
import { splitJsonDocuments, repairJsonFragment, decodeIntactBase64InFragment } from "@/lib/processing/salvageJson";

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
        "Detected: JWT — decoded header and payload (signature not verified)",
        "JWT",
      );

    case "json":
      if (jsonHasDecodableBase64(detected.value)) {
        const decoded = decodeJsonBase64Recursive(detected.value);
        return okResult(
          input,
          JSON.stringify(decoded.value, null, 2),
          "JSON_DECODE_BASE64",
          "JSON",
          "Detected: JSON — recursively decoded Base64 field values",
          "JSON",
        );
      }
      return okResult(
        input,
        JSON.stringify(detected.value, null, 2),
        "JSON_FORMAT",
        "JSON",
        "Detected: JSON — pretty-printed",
        "JSON",
      );

    case "base64":
      if (detected.decodedIsJson && detected.jsonValue !== undefined) {
        if (jsonHasDecodableBase64(detected.jsonValue)) {
          const decoded = decodeJsonBase64Recursive(detected.jsonValue);
          return okResult(
            input,
            JSON.stringify(decoded.value, null, 2),
            "JSON_DECODE_BASE64",
            "JSON",
            "Detected: Base64 — decoded to JSON, then recursively decoded Base64 field values",
            "JSON",
          );
        }
        return okResult(
          input,
          JSON.stringify(detected.jsonValue, null, 2),
          "BASE64_TO_JSON",
          "JSON",
          "Detected: Base64 — decoded to JSON",
          "BASE64",
        );
      }
      return okResult(
        input,
        detected.decoded,
        "BASE64_DECODE",
        "TEXT",
        "Detected: Base64 — decoded to plain text",
        "BASE64",
      );

    case "unknown":
      return salvageUnknown(input);

    case "empty":
      return okResult(input, input, "NONE", "UNKNOWN", "Waiting for input.", "UNKNOWN");
  }
}

/**
 * Fallback for unrecognized input. When the input is "mostly JSON":
 *  - multiple complete JSON documents → join as JSONL (no data lost)
 *  - a leading valid JSON document followed by non-JSON content → recover the
 *    document and clearly label that trailing content was ignored
 * Otherwise fall through to the generic "cannot detect" message and return the
 * input unchanged.
 */
function salvageUnknown(input: string): TransformationResult {
  const documents = splitJsonDocuments(input);

  if (documents.length > 1) {
    const jsonl = documents
      .map((doc) => JSON.stringify(decodeJsonBase64Recursive(doc.value).value))
      .join("\n");
    return okResult(
      input,
      jsonl,
      "JSON_TO_JSONL",
      "JSON",
      `Detected: ${documents.length} JSON documents — joined as JSON Lines (one per line).`,
      "JSON",
    );
  }

  if (documents.length === 1) {
    const salvaged = documents[0];
    const trailing = input
      .slice(input.indexOf(salvaged.text) + salvaged.text.length)
      .trim();
    const decoded = decodeJsonBase64Recursive(salvaged.value);
    const output = JSON.stringify(decoded.value, null, 2);
    const ignored = trailing.length
      ? ` Trailing content "${trimForMessage(trailing, 40)}" was ignored.`
      : "";
    const decodeNote = decoded.changed
      ? " and recursively decoded Base64 field values"
      : "";
    return okResult(
      input,
      output,
      "JSON_SALVAGE",
      "JSON",
      `Partially valid JSON — extracted the complete document${decodeNote}.${ignored}`,
      "JSON",
    );
  }

  // Step 3: no complete document — try to auto-repair an unterminated JSON value
  // by appending its missing closing brackets, then decode any base64 inside.
  const repaired = repairJsonFragment(input);
  if (repaired.repaired && repaired.value !== undefined) {
    const decoded = decodeJsonBase64Recursive(repaired.value);
    const output = JSON.stringify(decoded.value, null, 2);
    const decodeNote = decoded.changed
      ? "; recursively decoded Base64 field values"
      : "";
    return okResult(
      input,
      output,
      "JSON_SALVAGE",
      "JSON",
      `Incomplete JSON — auto-closed and parsed${decodeNote}.`,
      "JSON",
    );
  }

  // Step 2: repair failed — decode any intact Base64/JWT values still present.
  const fragment = decodeIntactBase64InFragment(input);
  if (fragment.decoded) {
    return okResult(
      input,
      fragment.output,
      "JSON_SALVAGE",
      "JSON",
      "Incomplete JSON — decoded intact Base64/JWT values (structure may be partial).",
      "JSON",
    );
  }

  return failResult(
    input,
    "Unable to confidently detect a format. Choose a manual tool or check the input.",
    "UNKNOWN",
    "UNKNOWN",
  );
}

function trimForMessage(text: string, max: number): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? collapsed.slice(0, max) + "…" : collapsed;
}