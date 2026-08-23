import { buildFetchRequest } from "@/lib/api-client/request";
import {
  type RequestDraft,
  type ResponseKind,
  type SendResult,
} from "@/lib/api-client/types";

/**
 * Executes a draft with browser fetch. Timing covers the full exchange —
 * request dispatch through complete body read — because header-only timings
 * would report ~0ms for most APIs and mislead users.
 */

const DEFAULT_TIMEOUT_MS = 30_000;

export interface SendOptions {
  timeoutMs?: number;
  /** Hook for the Cancel button — aborts the in-flight fetch. */
  signal?: AbortSignal;
}

export async function sendRequest(
  draft: RequestDraft,
  options: SendOptions = {},
): Promise<SendResult> {
  let built: ReturnType<typeof buildFetchRequest>;
  try {
    built = buildFetchRequest(draft);
  } catch (error) {
    return {
      status: "failed",
      kind: "invalid-url",
      message:
        error instanceof Error ? error.message : "The request could not be built.",
    };
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  const startedAt = performance.now();
  let response: Response;
  try {
    response = await fetch(built.url.toString(), {
      ...built.init,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (timedOut) {
      return {
        status: "failed",
        kind: "timeout",
        message: `No response within ${Math.round(timeoutMs / 1000)}s — the request was cancelled.`,
      };
    }
    if (isAbort(error)) {
      return { status: "failed", kind: "aborted", message: "The request was cancelled." };
    }
    return { status: "failed", kind: "network", message: describeFetchError() };
  }

  const blob = await response.blob();
  const durationMs = performance.now() - startedAt;
  clearTimeout(timeout);

  return {
    status: "ok",
    response: {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Array.from(response.headers.entries()),
      contentType: response.headers.get("content-type") ?? "",
      bodyText: blob.size > 0 ? await blob.text() : "",
      bodyBytes: blob.size,
      kind: classifyResponse(
        response.headers.get("content-type") ?? "",
        blob.type,
      ),
      durationMs,
      blob,
    },
  };
}

function isAbort(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function describeFetchError(): string {
  // fetch rejects with TypeError for network-level failures; CORS blocks are
  // indistinguishable from unreachable servers by design.
  return [
    "The browser could not complete this request.",
    "",
    "Most often this is CORS: purely client-side requests only reach servers",
    "that answer with permissive Access-Control-Allow-Origin headers for this",
    "site. It can also be DNS failure, an offline target or a mixed-content",
    "(https → http) block.",
  ].join("\n");
}

/** Coarse body classification that drives which viewer tab lights up. */
function classifyResponse(...contentTypeHints: string[]): ResponseKind {
  const mime = contentTypeHints
    .map((hint) => hint.split(";")[0]?.trim().toLowerCase() ?? "")
    .find((hint) => hint.length > 0);
  if (!mime) {
    return "text";
  }
  if (mime === "application/json" || mime.endsWith("+json")) {
    return "json";
  }
  if (mime.startsWith("image/")) {
    return "image";
  }
  if (mime === "text/html") {
    return "html";
  }
  if (mime === "application/xml" || mime === "text/xml" || mime.endsWith("+xml")) {
    return "xml";
  }
  return "text";
}
