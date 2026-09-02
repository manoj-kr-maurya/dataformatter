/**
 * Normalized OpenAPI 3.x model. The workbench never binds its UI directly to
 * raw JSON/YAML — `parse.ts` reduces any source document into this shape so
 * the explorer, validator, generator and schema viewers share one interface.
 */

export type OpenApiHttpMethod =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

export const OPENAPI_HTTP_METHODS: readonly OpenApiHttpMethod[] = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
];

/** A schema object from the OpenAPI specification (subset we navigate). */
export interface OpenApiSchema {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  default?: unknown;
  example?: unknown;
  deprecated?: boolean;
  enum?: unknown[];
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  additionalProperties?: boolean | OpenApiSchema;
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  $ref?: string;
  $defs?: Record<string, OpenApiSchema>;
  contentMediaType?: string;
  [extra: string]: unknown;
}

export interface OpenApiParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  description?: string;
  deprecated?: boolean;
  schema?: OpenApiSchema;
  example?: unknown;
}

/** One concrete media type of a request body or response. */
export interface OpenApiContent {
  mediaType: string;
  schema?: OpenApiSchema;
  /** Example lifted from `example` or the first entry of `examples`. */
  example?: unknown;
  /** True when an example was literally written on the document. */
  hasProvidedExample: boolean;
}

export interface OpenApiRequestBody {
  description?: string;
  required: boolean;
  content: OpenApiContent[];
}

export interface OpenApiResponseHeader {
  name: string;
  description?: string;
  schema?: OpenApiSchema;
  example?: unknown;
}

export interface OpenApiResponse {
  /** Status code literal: "200", "201", "default", "4XX", … */
  status: string;
  description?: string;
  headers: OpenApiResponseHeader[];
  content: OpenApiContent[];
}

export interface OpenApiEndpoint {
  path: string;
  method: OpenApiHttpMethod;
  operationId?: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  tags: string[];
  parameters: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: OpenApiResponse[];
  /** Operation-scoped security; falls back to document-level in parse.ts. */
  security: OpenApiSecurityRequirement[];
  /** Path/operation-level server overrides (OpenAPI 3.0). */
  _servers?: OpenApiServer[];
}

export interface OpenApiSecurityRequirement {
  [schemeName: string]: string[];
}

/**
 * A security scheme from components.securitySchemes. Kept loose on purpose:
 * parse.ts extracts these from untrusted documents, so every field is
 * optional and consumers read known fields defensively.
 */
export interface OpenApiSecurityScheme {
  type?: string;
  name?: string;
  in?: "header" | "query" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  description?: string;
  openIdConnectUrl?: string;
  flows?: Record<string, { authorizationUrl?: string; tokenUrl?: string; scopes: Record<string, string> }>;
  [extra: string]: unknown;
}

export interface OpenApiServer {
  url: string;
  description?: string;
}

export interface OpenApiDocumentModel {
  /** Format the source was written in. */
  sourceFormat: "json" | "yaml";
  /** Raw `openapi` version string, e.g. "3.0.3". */
  version: string;
  versionKind: "3.0" | "3.1";
  info: {
    title: string;
    version: string;
    description?: string;
    termsOfService?: string;
    contact?: { name?: string; url?: string; email?: string };
    license?: { name?: string; url?: string };
  };
  servers: OpenApiServer[];
  tags: { name: string; description?: string }[];
  paths: OpenApiEndpoint[];
  components: {
    schemas: Record<string, OpenApiSchema>;
    securitySchemes: Record<string, OpenApiSecurityScheme>;
  };
  securitySchemes: Record<string, OpenApiSecurityScheme>;
  globalSecurity: OpenApiSecurityRequirement[];
}

export type OpenApiVersionKind =
  | { kind: "3.0"; version: string }
  | { kind: "3.1"; version: string }
  | { kind: "swagger2"; version: string }
  | { kind: "unknown" };