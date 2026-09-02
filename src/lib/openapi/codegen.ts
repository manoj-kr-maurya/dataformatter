import { generateCode } from "@/lib/json-schema/codegen";
import { draftToCurl, generateCurlCode } from "@/lib/curl-codegen/codegen";
import type { RequestDraft } from "@/lib/api-client/types";
import { newRow } from "@/lib/api-client/types";
import { dereferenceSchema } from "@/lib/openapi/refs";
import { schemaToNode, sampleFromSchema } from "@/lib/openapi/schema";
import type { SecurityDisplay } from "@/lib/openapi/security";
import { securityFor } from "@/lib/openapi/security";
import {
  type OpenApiContent,
  type OpenApiDocumentModel,
  type OpenApiEndpoint,
  type OpenApiParameter,
  type OpenApiRequestBody,
  type OpenApiSecurityScheme,
} from "@/lib/openapi/types";

/**
 * Request execution and code generation for a single endpoint. The workbench
 * never stores API keys or authorization secrets. Security fields in generated
 * code are either blank (header-style keys) or omitted (bearer tokens), so
 * generated snippets never leak real credentials.
 */

export interface EndpointToDraftOpts {
  server: string;
  endpoint: OpenApiEndpoint;
  model: OpenApiDocumentModel;
  /** User-supplied or sample request body. */
  bodyText: string;
  /** Header parameters may require name/value pairs. */
  headerParams: Record<string, string>;
  /** User-supplied path parameter values. */
  pathParams?: Record<string, string>;
  /** User-supplied query parameter values. */
  queryParams?: Record<string, string>;
}

function joinPaths(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const seg = path.startsWith("/") ? path : `/${path}`;
  return base + seg;
}

/** Build a URL by resolving a path parameter's sample or user-supplied value. */
function fillPathParams(
  path: string,
  params: OpenApiParameter[],
  overrides: Record<string, string>,
): string {
  return path.replace(/\{([^}]+)\}/g, (template, name) => {
    const param = params.find((p) => p.name === name && p.in === "path");
    const supplied = overrides[name];
    const val =
      supplied !== undefined && supplied.length > 0
        ? supplied
        : param?.example ?? param?.schema?.example ?? name;
    return encodeURIComponent(String(val));
  });
}

function pickQueryParams(
  params: OpenApiParameter[],
  overrides: Record<string, string>,
): { name: string; value: string }[] {
  return params
    .filter((p) => p.in === "query")
    .filter((p) => {
      if (overrides[p.name] !== undefined && overrides[p.name].length > 0) return true;
      return p.example !== undefined || p.schema?.example !== undefined || p.schema?.default !== undefined;
    })
    .map((p) => {
      const supplied = overrides[p.name];
      const value =
        supplied !== undefined && supplied.length > 0
          ? supplied
          : p.example !== undefined
            ? p.example
            : (p.schema?.example ?? p.schema?.default ?? "");
      return { name: p.name, value: String(value) };
    });
}

function pickHeaderParams(
  params: OpenApiParameter[],
  overrides: Record<string, string>,
): [string, string][] {
  return params
    .filter((p) => p.in === "header")
    .filter((p) => {
      const override = overrides[p.name];
      return (override !== undefined && override.length > 0) || p.example !== undefined;
    })
    .map((p) => {
      const override = overrides[p.name];
      const value =
        override !== undefined && override.length > 0
          ? override
          : p.example !== undefined
            ? p.example
            : "";
      return [p.name, String(value)] as [string, string];
    });
}

function pickBodyMode(
  content: OpenApiContent[] | undefined,
): { mode: RequestDraft["bodyMode"]; text: string } {
  if (!content || content.length === 0) {
    return { mode: "none", text: "" };
  }
  const json = content.find((c) => c.mediaType.includes("json"));
  if (json?.example !== undefined) {
    return {
      mode: "json",
      text: typeof json.example === "string" ? json.example : JSON.stringify(json.example, null, 2),
    };
  }
  const form = content.find((c) => c.mediaType.includes("form-urlencoded"));
  if (form?.example !== undefined && typeof form.example === "object") {
    return { mode: "urlencoded", text: "" };
  }
  return { mode: "json", text: "" };
}

export function endpointToRequestDraft(opts: EndpointToDraftOpts): RequestDraft {
  const { server, endpoint, bodyText, headerParams, pathParams, queryParams } = opts;
  const params = endpoint.parameters;
  const url = fillPathParams(joinPaths(server, endpoint.path), params, pathParams ?? {});
  const queryValues = pickQueryParams(params, queryParams ?? {});
  const headers = pickHeaderParams(params, headerParams);
  const hasBody = endpoint.requestBody && ["put", "post", "patch"].includes(endpoint.method);
  const bodyMode = hasBody
    ? pickBodyMode(endpoint.requestBody?.content).mode
    : "none";
  const body = hasBody ? bodyText : "";

  return {
    method: endpoint.method.toUpperCase() as RequestDraft["method"],
    url,
    query: queryValues.map((q) => newRow(q.name, q.value)),
    headers: headers.map(([name, value]) => newRow(name, value)),
    bodyMode,
    bodyText: body,
    formRows: [newRow()],
    authMode: "none",
    bearerToken: "",
    basicUsername: "",
    basicPassword: "",
  };
}

/** cURL string from the document source + endpoint spec. */
export function endpointToCurl(opts: EndpointToDraftOpts): string {
  return draftToCurl(endpointToRequestDraft(opts));
}

/** Fetch/axios/python/java/go/csharp snippets from the endpoint. */
export function endpointToCode(
  opts: EndpointToDraftOpts,
  target: "fetch" | "axios" | "python" | "java" | "go" | "csharp",
): string {
  return generateCurlCode(target, endpointToRequestDraft(opts));
}

/** Build a realistic request body JSON for one content type. */
export function exampleRequestBody(
  requestBody: OpenApiRequestBody | undefined,
  model: OpenApiDocumentModel,
): string {
  if (!requestBody) return "";
  const json = requestBody.content.find((c) => c.mediaType.includes("json"));
  if (!json?.schema) return "";
  const { value } = sampleFromSchema(json.schema, model, { requiredOnly: false });
  return JSON.stringify(value, null, 2);
}

/** SchemaNode for the request body of a selected endpoint. */
export function requestSchemaNode(
  endpoint: OpenApiEndpoint,
  model: OpenApiDocumentModel,
) {
  const body = endpoint.requestBody;
  if (!body) return null;
  const json = body.content.find((c) => c.mediaType.includes("json"));
  if (!json?.schema) return null;
  return schemaToNode(dereferenceSchema(json.schema, model), model);
}

/** First successful JSON response's schema as a SchemaNode, if any. */
export function responseSchemaNode(
  endpoint: OpenApiEndpoint,
  model: OpenApiDocumentModel,
) {
  const success =
    endpoint.responses.find((r) => /^2/.test(r.status)) ??
    endpoint.responses.find((r) => /^[23]/.test(r.status));
  const target = success ?? endpoint.responses[0];
  if (!target) return null;
  const json = target.content.find((c) => c.mediaType.includes("json"));
  if (!json?.schema) return null;
  return schemaToNode(dereferenceSchema(json.schema, model), model);
}

export interface ResponseSample {
  status: string;
  description?: string;
  headers: Record<string, string>;
  body: string;
}

/**
 * Generate mock response bodies for one endpoint by sampling each response
 * schema. Values are labelled clearly as generated placeholders.
 */
export function exampleResponses(
  endpoint: OpenApiEndpoint,
  model: OpenApiDocumentModel,
): ResponseSample[] {
  return endpoint.responses.map((response) => {
    const jsonContent = response.content.find((c) => c.mediaType.includes("json"));
    const docExample = jsonContent?.example;
    let value: unknown;
    if (docExample !== undefined) {
      value =
        typeof docExample === "string" && looksLikeJson(docExample)
          ? safeJsonParse(docExample)
          : docExample;
    } else if (jsonContent?.schema) {
      value = sampleFromSchema(jsonContent.schema, model).value;
    } else {
      value = null;
    }
    return {
      status: response.status,
      description: response.description,
      headers: Object.fromEntries(
        response.headers.map((h) => [h.name, String(h.example ?? "")]),
      ),
      body: JSON.stringify(value, null, 2),
    };
  });
}

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/** Typescript interface output for the request body schema. */
export function typescriptForRequestBody(
  endpoint: OpenApiEndpoint,
  model: OpenApiDocumentModel,
  typeName: string,
): string | null {
  const node = requestSchemaNode(endpoint, model);
  if (!node) return null;
  return generateCode("typescript-interface", node, typeName);
}

export interface EndpointParameterRow {
  name: string;
  location: string;
  required: boolean;
  description?: string;
  example?: string;
}

export function endpointParamRows(
  endpoint: OpenApiEndpoint,
): EndpointParameterRow[] {
  return endpoint.parameters.map((p) => ({
    name: p.name,
    location: p.in,
    required: p.required,
    description: p.description,
    example: String(p.example ?? p.schema?.example ?? ""),
  }));
}

export interface SecurityHeadersResult {
  rows: [string, string][];
  display: SecurityDisplay[];
}

export function securityHeaders(
  endpoint: OpenApiEndpoint,
  model: OpenApiDocumentModel,
): SecurityHeadersResult {
  const display = securityFor(endpoint, model);
  const rows: [string, string][] = display.map((d) => {
    const scheme = model.securitySchemes[d.schemeName] as OpenApiSecurityScheme | undefined;
    if (!scheme || typeof scheme !== "object") return ["Authorization", ""];
    if (scheme.type === "apiKey" && "in" in scheme && (scheme as { in?: string }).in === "header") {
      return [(scheme as { name?: string }).name ?? "X-API-Key", ""];
    }
    return ["Authorization", ""];
  });
  return { rows, display };
}

/** Human summary of the HTTP method + path for tabs and headings. */
export function endpointSummary(endpoint: OpenApiEndpoint): string {
  return `${endpoint.method.toUpperCase()} ${endpoint.path}`;
}

export function defaultServer(model: OpenApiDocumentModel): string {
  return model.servers[0]?.url ?? "/";
}

export const RESPONSE_LANGUAGES = [
  { id: "cURL" as const, label: "cURL" },
  { id: "fetch" as const, label: "Fetch API" },
  { id: "axios" as const, label: "Axios" },
  { id: "python" as const, label: "Python" },
  { id: "java" as const, label: "Java" },
  { id: "go" as const, label: "Go" },
  { id: "csharp" as const, label: "C#" },
] as const;

export const TYPESCRIPT_GENERATORS = [
  { id: "typescript-interface", label: "TypeScript interface" },
  { id: "typescript-object", label: "TypeScript object" },
  { id: "java-class", label: "Java class" },
  { id: "java-record", label: "Java record" },
  { id: "csharp-record", label: "C# record" },
  { id: "csharp-class", label: "C# class" },
  { id: "go-struct", label: "Go struct" },
  { id: "python-dataclass", label: "Python dataclass" },
  { id: "kotlin-data-class", label: "Kotlin data class" },
  { id: "swift-struct", label: "Swift struct" },
] as const;