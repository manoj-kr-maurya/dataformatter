import {
  type BodyMode,
  type KeyValueRow,
  type RequestDraft,
} from "@/lib/api-client/types";

/**
 * Pure request assembly: turns a RequestDraft into a URL + fetch init.
 * Everything here is synchronous and side-effect free so it can be unit
 * tested without a network.
 */

const FORBIDDEN_HEADER_NAMES = new Set([
  "accept-charset",
  "accept-encoding",
  "access-control-request-headers",
  "access-control-request-method",
  "connection",
  "content-length",
  "cookie",
  "cookie2",
  "date",
  "dnt",
  "expect",
  "host",
  "keep-alive",
  "origin",
  "referer",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "user-agent",
  "via",
]);

/**
 * Headers the browser will silently drop from fetch calls (the WHATWG
 * forbidden list). Surfaced in the UI because Postman-like tools can send
 * these but a purely client-side client cannot.
 */
export function isForbiddenHeaderName(name: string): boolean {
  return FORBIDDEN_HEADER_NAMES.has(name.trim().toLowerCase());
}

/** Enabled rows with a non-empty name — what actually reaches the wire. */
function activeRows(rows: KeyValueRow[]): [string, string][] {
  return rows
    .filter((row) => row.enabled && row.name.trim().length > 0)
    .map((row) => [row.name, row.value] as [string, string]);
}

/**
 * Resolve the final URL: the draft URL plus every active query row.
 * Throws an Error with a user-presentable message for invalid input.
 */
export function buildUrl(draft: RequestDraft): URL {
  const raw = draft.url.trim();
  if (raw.length === 0) {
    throw new Error("Enter a request URL.");
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      `"${raw}" is not a valid absolute URL. Include the scheme, e.g. https://…`,
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs can be sent.");
  }
  for (const [name, value] of activeRows(draft.query)) {
    url.searchParams.append(name, value);
  }
  return url;
}

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);

/** JSON/text bodies default to these content types unless overridden. */
const DEFAULT_CONTENT_TYPE: Partial<Record<BodyMode, string>> = {
  json: "application/json",
  text: "text/plain;charset=UTF-8",
};

/**
 * Compose the headers actually sent: explicit rows win over auth helpers,
 * which win over body-mode defaults. form-data/urlencoded never get a manual
 * content type — the browser must generate it (multipart boundary etc.).
 */
export function buildHeaders(draft: RequestDraft): [string, string][] {
  const sent = new Map<string, string>();
  if (!BODYLESS_METHODS.has(draft.method)) {
    const fallback = DEFAULT_CONTENT_TYPE[draft.bodyMode];
    if (fallback && !hasHeader(draft.headers, "content-type")) {
      sent.set("content-type", fallback);
    }
  }
  if (draft.authMode === "bearer" && draft.bearerToken.trim().length > 0) {
    sent.set("authorization", `Bearer ${draft.bearerToken.trim()}`);
  } else if (
    draft.authMode === "basic" &&
    (draft.basicUsername.length > 0 || draft.basicPassword.length > 0)
  ) {
    sent.set(
      "authorization",
      `Basic ${btoa(`${draft.basicUsername}:${draft.basicPassword}`)}`,
    );
  }
  for (const [name, value] of activeRows(draft.headers)) {
    sent.set(name.toLowerCase(), value);
  }
  return Array.from(sent, ([name, value]) => [name, value] as [string, string]);
}

function hasHeader(rows: KeyValueRow[], lowerName: string): boolean {
  return rows.some(
    (row) => row.enabled && row.name.trim().toLowerCase() === lowerName,
  );
}

/** Build the fetch body. Returns null when the method/mode carries none. */
export function buildBodyInit(draft: RequestDraft): BodyInit | null {
  if (BODYLESS_METHODS.has(draft.method) || draft.bodyMode === "none") {
    return null;
  }
  switch (draft.bodyMode) {
    case "json":
    case "text":
      return draft.bodyText;
    case "urlencoded":
      return new URLSearchParams(activeRows(draft.formRows));
    case "form-data": {
      const form = new FormData();
      for (const [name, value] of activeRows(draft.formRows)) {
        form.append(name, value);
      }
      return form;
    }
  }
}

export interface BuiltFetchRequest {
  url: URL;
  init: RequestInit;
}

/** Everything fetch needs, ready to go. Throws on invalid drafts. */
export function buildFetchRequest(draft: RequestDraft): BuiltFetchRequest {
  const url = buildUrl(draft);
  const body = buildBodyInit(draft);
  return {
    url,
    init: {
      method: draft.method,
      headers: buildHeaders(draft),
      body,
      redirect: "follow",
    },
  };
}
