import { SHARE_SCHEMA_VERSION } from "@/lib/share/types";
import type { SharePayload } from "@/lib/share/types";
import { isNonDeterministicTool } from "@/lib/tools";
import { encodeUtf8 } from "@/lib/share/codec";

/** Serialize the payload to its compact JSON string form. */
export function serializeSharePayload(payload: SharePayload): string {
  return JSON.stringify(payload);
}

/**
 * Whether a share payload must carry the output verbatim. Returns false for
 * deterministic tools (output can be regenerated from the input), true for
 * random generators whose output cannot be recomputed.
 */
export function isStoredOutputRequired(tool: string): boolean {
  return isNonDeterministicTool(tool);
}

/** Size in bytes of the UTF-8 serialized payload (pre-compression). */
export function serializedShareBytes(payload: SharePayload): number {
  return encodeUtf8(serializeSharePayload(payload)).byteLength;
}

/**
 * Validate a decoded share payload. Returns a human-readable reason on
 * failure, or null when the payload is structurally sound.
 */
export function validateSharePayload(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return "Payload is not an object";
  }
  const payload = value as Record<string, unknown>;

  if (payload.v !== SHARE_SCHEMA_VERSION) {
    return `Unsupported payload version "${String(payload.v)}"`;
  }

  const requires = ["mode", "tool", "autoDetect", "wordWrap", "input", "display"];
  for (const key of requires) {
    if (typeof payload[key] === "undefined") {
      return `Missing field "${key}"`;
    }
  }

  if (payload.mode !== "single" && payload.mode !== "split") {
    return `Invalid mode "${String(payload.mode)}"`;
  }
  if (payload.display !== "input" && payload.display !== "output") {
    return `Invalid display "${String(payload.display)}"`;
  }
  if (typeof payload.tool !== "string" || payload.tool.length === 0) {
    return "Invalid tool";
  }
  if (typeof payload.autoDetect !== "boolean") {
    return "Invalid autoDetect";
  }
  if (typeof payload.wordWrap !== "boolean") {
    return "Invalid wordWrap";
  }
  if (typeof payload.input !== "string") {
    return "Invalid input";
  }
  if (typeof payload.output !== "undefined" && typeof payload.output !== "string") {
    return "Invalid output";
  }
  if (isNonDeterministicTool(payload.tool) && typeof payload.output !== "string") {
    return "Missing output for non-deterministic tool";
  }

  return null;
}