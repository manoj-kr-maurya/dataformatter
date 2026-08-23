export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export const HTTP_METHODS: readonly HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

/** One editable row of the query-param or header tables. */
export interface KeyValueRow {
  id: string;
  /** Disabled rows are kept in the editor but excluded from the request. */
  enabled: boolean;
  name: string;
  value: string;
}

export type BodyMode = "none" | "json" | "text" | "urlencoded" | "form-data";

export type AuthMode = "none" | "bearer" | "basic";

/**
 * The full editable state of one request. This shape is what history entries,
 * saved requests and share links all persist, so it must stay JSON-safe.
 */
export interface RequestDraft {
  method: HttpMethod;
  url: string;
  query: KeyValueRow[];
  headers: KeyValueRow[];
  bodyMode: BodyMode;
  /** Payload for the json/text body modes. */
  bodyText: string;
  /** Key/value pairs for the urlencoded and form-data body modes. */
  formRows: KeyValueRow[];
  authMode: AuthMode;
  bearerToken: string;
  basicUsername: string;
  basicPassword: string;
}

export type ResponseKind = "json" | "image" | "html" | "xml" | "text";

/**
 * Everything worth showing about a completed exchange. Bodies are decoded as
 * UTF-8 text; `blob` is retained alongside for image previews/downloads.
 */
export interface ApiResponseSnapshot {
  status: number;
  statusText: string;
  ok: boolean;
  headers: [string, string][];
  contentType: string;
  bodyText: string;
  bodyBytes: number;
  kind: ResponseKind;
  durationMs: number;
  blob: Blob;
}

export type SendFailureKind =
  | "invalid-url"
  | "timeout"
  | "network"
  | "aborted";

export type SendResult =
  | { status: "ok"; response: ApiResponseSnapshot }
  | { status: "failed"; kind: SendFailureKind; message: string };

let rowSeq = 0;

export function newRow(name = "", value = "", enabled = true): KeyValueRow {
  rowSeq += 1;
  return { id: `r${rowSeq}`, enabled, name, value };
}

export const DEFAULT_EXAMPLE_URL = "https://jsonplaceholder.typicode.com/todos/1";

export function emptyDraft(): RequestDraft {
  return {
    method: "GET",
    url: "",
    query: [newRow()],
    headers: [],
    bodyMode: "none",
    bodyText: "",
    formRows: [newRow()],
    authMode: "none",
    bearerToken: "",
    basicUsername: "",
    basicPassword: "",
  };
}

export function exampleDraft(): RequestDraft {
  return { ...emptyDraft(), url: DEFAULT_EXAMPLE_URL };
}
