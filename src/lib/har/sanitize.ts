/**
 * HAR sanitization for export — masks authorization/cookie header values and
 * token-like runs. Local-only; used by the "Sanitize HAR" action.
 */

import { sanitizeText } from "@/lib/debug/sanitize";

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
]);

export function sanitizeHarText(input: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object") return null;
  const log = (parsed as Record<string, unknown>).log;
  if (log === null || typeof log !== "object") return null;
  const entries = (log as Record<string, unknown>).entries;
  if (!Array.isArray(entries)) return null;

  for (const rawEntry of entries) {
    if (rawEntry === null || typeof rawEntry !== "object") continue;
    const entry = rawEntry as Record<string, unknown>;
    const request = (entry.request ?? {}) as Record<string, unknown>;
    const response = (entry.response ?? {}) as Record<string, unknown>;
    if (request && typeof request === "object") {
      if (Array.isArray(request.headers)) request.headers = maskHarHeaders(request.headers);
      if (Array.isArray(request.cookies)) request.cookies = [];
      const postData = request.postData;
      if (postData && typeof postData === "object" && typeof (postData as Record<string, unknown>).text === "string") {
        (postData as Record<string, unknown>).text = sanitizeText((postData as Record<string, unknown>).text as string, "mask").text;
      }
    }
    if (response && typeof response === "object") {
      if (Array.isArray(response.headers)) response.headers = maskHarHeaders(response.headers);
      const content = response.content;
      if (content && typeof content === "object" && typeof (content as Record<string, unknown>).text === "string") {
        (content as Record<string, unknown>).text = sanitizeText((content as Record<string, unknown>).text as string, "mask").text;
      }
    }
  }

  return JSON.stringify(parsed, null, 2);
}

/** HAR headers stay { name, value } objects — mask sensitive values in place. */
function maskHarHeaders(headers: unknown[]): unknown[] {
  return headers
    .filter((header): header is Record<string, unknown> => header !== null && typeof header === "object")
    .map((header) => {
      const name = String(header.name ?? "");
      if (!SENSITIVE_HEADERS.has(name.toLowerCase())) return header;
      const value = String(header.value ?? "");
      return { ...header, value: maskValue(value) };
    });
}

function maskValue(value: string): string {
  const cleaned = value.trim();
  if (cleaned === "") return "";
  if (cleaned.length <= 8) return "••••";
  return `${cleaned.slice(0, 4)}••••••${cleaned.slice(-4)}`;
}