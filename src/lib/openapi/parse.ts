import { parse as parseYaml, YAMLParseError } from "yaml";
import type {
  OpenApiContent,
  OpenApiDocumentModel,
  OpenApiEndpoint,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiResponseHeader,
  OpenApiSchema,
  OpenApiSecurityRequirement,
  OpenApiSecurityScheme,
  OpenApiServer,
  OpenApiVersionKind,
} from "@/lib/openapi/types";
import { OPENAPI_HTTP_METHODS } from "@/lib/openapi/types";

/**
 * OpenAPI document parsing. Accepts JSON or YAML (robust YAML 1.2 with
 * support for block scalars, anchors and aliases), detects the dialect and
 * normalizes 3.0/3.1 documents into the shared model. Swagger 2.0 and
 * unrelated YAML/JSON are rejected explicitly rather than misinterpreted.
 */

export type OpenApiParseError = {
  message: string;
  line?: number;
  column?: number;
  offset?: number;
};

export type OpenApiParseResult =
  | { ok: true; model: OpenApiDocumentModel; format: "json" | "yaml" }
  | { ok: false; error: OpenApiParseError };

export function looksLikeJson(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

export function detectOpenApiVersion(input: string): OpenApiVersionKind {
  const trimmed = input.trim();
  if (!trimmed) {
    return { kind: "unknown" };
  }
  const raw = (() => {
    if (looksLikeJson(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        return null;
      }
    }
    try {
      const parsed = parseYaml(trimmed);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return null;
    }
    return null;
  })();
  if (!raw) {
    return { kind: "unknown" };
  }
  if (typeof raw.swagger === "string") {
    return { kind: "swagger2", version: raw.swagger };
  }
  if (typeof raw.openapi === "string") {
    const match = /^(\d+)\.(\d+)/.exec(raw.openapi);
    if (!match) {
      return { kind: "unknown" };
    }
    if (match[1] === "3" && match[2] === "0") {
      return { kind: "3.0", version: raw.openapi };
    }
    if (match[1] === "3" && match[2] === "1") {
      return { kind: "3.1", version: raw.openapi };
    }
    return { kind: "unknown" };
  }
  return { kind: "unknown" };
}

/**
 * Parse an OpenAPI 3.x document from raw text. Returns the normalized model.
 * Any other content shape (Swagger 2.0, plain JSON/YAML, garbage) produces a
 * user-presentable error instead of a best-guess model.
 */
export function parseOpenApi(input: string): OpenApiParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: { message: "Paste or upload an OpenAPI document first." },
    };
  }

  let raw: unknown;
  let format: "json" | "yaml";
  if (looksLikeJson(trimmed)) {
    try {
      raw = JSON.parse(trimmed);
      format = "json";
    } catch (error) {
      const e = error as { message?: string };
      return {
        ok: false,
        error: {
          message: `JSON syntax error: ${e.message ?? "unexpected character"}`,
        },
      };
    }
  } else {
    try {
      raw = parseYaml(trimmed, { prettyErrors: true });
      format = "yaml";
    } catch (error) {
      if (error instanceof YAMLParseError) {
        return {
          ok: false,
          error: {
            message: `YAML syntax error: ${error.message}`,
            line: error.linePos?.[0]?.line,
            column: error.linePos?.[0]?.col,
          },
        };
      }
      return { ok: false, error: { message: "Could not read that input." } };
    }
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      error: { message: "That does not look like an OpenAPI document." },
    };
  }

  const doc = raw as Record<string, unknown>;

  if (typeof doc.swagger === "string") {
    return {
      ok: false,
      error: { message: "Swagger 2.0 is not currently supported." },
    };
  }
  if (typeof doc.openapi !== "string") {
    return {
      ok: false,
      error: {
        message:
          'No "openapi" field found. This is not an OpenAPI 3.x document.',
      },
    };
  }
  if (!/^3\.(0|1)\./.test(doc.openapi)) {
    return {
      ok: false,
      error: {
        message: `OpenAPI ${doc.openapi} is not supported. The workbench accepts OpenAPI 3.0.x and 3.1.x.`,
      },
    };
  }

  try {
    const model = normalize(doc as Record<string, unknown> & { openapi: string }, format);
    return { ok: true, model, format };
  } catch (error) {
    const e = error as { message?: string };
    return {
      ok: false,
      error: { message: `Could not interpret the document: ${e.message ?? "unknown error"}` },
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function normalize(
  doc: Record<string, unknown> & { openapi: string },
  format: "json" | "yaml",
): OpenApiDocumentModel {
  const info = asRecord(doc.info);

  const servers: OpenApiServer[] = Array.isArray(doc.servers)
    ? (doc.servers as unknown[]).flatMap((s) => {
        const server = asRecord(s);
        const url = asString(server.url);
        return url ? [{ url, description: asString(server.description) }] : [];
      })
    : [];

  const tags = Array.isArray(doc.tags)
    ? (doc.tags as unknown[]).flatMap((t) => {
        const tag = asRecord(t);
        const name = asString(tag.name);
        return name ? [{ name, description: asString(tag.description) }] : [];
      })
    : [];

  const components = asRecord(doc.components);
  const schemas: Record<string, OpenApiSchema> = {};
  const componentSchemas = asRecord(components.schemas);
  for (const [name, value] of Object.entries(componentSchemas)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      schemas[name] = value as OpenApiSchema;
    }
  }
  const securitySchemes: Record<string, OpenApiSecurityScheme> = {};
  const schemeEntries = asRecord(components.securitySchemes);
  for (const [name, value] of Object.entries(schemeEntries)) {
    const scheme = asRecord(value);
    securitySchemes[name] = scheme as unknown as OpenApiSecurityScheme;
  }

  const pathsRecord = asRecord(doc.paths);
  const paths: OpenApiEndpoint[] = [];
  for (const [path, operations] of Object.entries(pathsRecord)) {
    if (!path.startsWith("/")) continue;
    const opsRecord = asRecord(operations);
    const pathParams = parseParameters(opsRecord.parameters);
    const pathServers = Array.isArray(opsRecord.servers)
      ? (opsRecord.servers as unknown[]).flatMap((s) => {
          const server = asRecord(s);
          const url = asString(server.url);
          return url ? [{ url, description: asString(server.description) }] : [];
        })
      : [];
    for (const method of OPENAPI_HTTP_METHODS) {
      const op = asRecord(opsRecord[method]);
      if (Object.keys(op).length === 0) continue;
      const parameters = mergeParameters(pathParams, parseParameters(op.parameters));
      const security = resolveSecurity(op.security as unknown, doc.security);
      paths.push({
        path,
        method,
        operationId: asString(op.operationId),
        summary: asString(op.summary),
        description: asString(op.description),
        deprecated: asBoolean(op.deprecated),
        tags: Array.isArray(op.tags) ? op.tags.filter(asString).map(String) : [],
        parameters,
        requestBody: parseRequestBody(asRecord(op.requestBody)),
        responses: parseResponses(asRecord(op.responses)),
        security,
        _servers: pathServers.length > 0 ? pathServers : undefined,
      });
    }
  }

  return {
    sourceFormat: format,
    version: doc.openapi,
    versionKind: doc.openapi.startsWith("3.0") ? "3.0" : "3.1",
    info: {
      title: asString(info.title) ?? "Untitled API",
      version: asString(info.version) ?? "",
      description: asString(info.description),
      termsOfService: asString(info.termsOfService),
      contact: {
        name: asString(asRecord(info.contact).name),
        url: asString(asRecord(info.contact).url),
        email: asString(asRecord(info.contact).email),
      },
      license: {
        name: asString(asRecord(info.license).name),
        url: asString(asRecord(info.license).url),
      },
    },
    servers: servers.length > 0 ? servers : [{ url: "/" }],
    tags,
    paths,
    components: { schemas, securitySchemes },
    securitySchemes,
    globalSecurity: resolveSecurity(doc.security as unknown, undefined),
  };
}

function parseParameters(value: unknown): OpenApiParameter[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((param) => {
    const p = asRecord(param);
    const name = asString(p.name);
    const location = p.in;
    if (!name || !["path", "query", "header", "cookie"].includes(String(location))) {
      return [];
    }
    const schema = p.schema as OpenApiSchema | undefined;
    return [
      {
        name,
        in: location as OpenApiParameter["in"],
        required: asBoolean(p.required) || location === "path",
        description: asString(p.description),
        deprecated: asBoolean(p.deprecated),
        schema:
          schema && typeof schema === "object" && !Array.isArray(schema)
            ? schema
            : p.content
              ? parseContentFirstSchema(asRecord(p.content))
              : undefined,
        example: p.example,
      },
    ];
  });
}

function parseContentFirstSchema(content: Record<string, unknown>): OpenApiSchema | undefined {
  const entries = Object.entries(content);
  if (entries.length === 0) return undefined;
  const schema = asRecord(entries[0][1]).schema;
  return schema && typeof schema === "object" && !Array.isArray(schema)
    ? (schema as OpenApiSchema)
    : undefined;
}

function mergeParameters(
  base: OpenApiParameter[],
  operation: OpenApiParameter[],
): OpenApiParameter[] {
  const merged = new Map<string, OpenApiParameter>();
  for (const p of base) merged.set(`${p.in}:${p.name}`, p);
  for (const p of operation) merged.set(`${p.in}:${p.name}`, p);
  return Array.from(merged.values());
}

function parseRequestBody(value: Record<string, unknown>): OpenApiRequestBody | undefined {
  if (Object.keys(value).length === 0) return undefined;
  return {
    description: asString(value.description),
    required: asBoolean(value.required),
    content: parseContent(asRecord(value.content)),
  };
}

function parseContent(content: Record<string, unknown>): OpenApiContent[] {
  return Object.entries(content).flatMap(([mediaType, value]) => {
    const entry = asRecord(value);
    const schema = entry.schema;
    const example = entry.example !== undefined ? entry.example : undefined;
    const provided = entry.example !== undefined;
    if (!provided && entry.examples) {
      const examples = asRecord(entry.examples);
      const first = Object.values(examples)[0];
      const firstRecord = asRecord(first);
      if (firstRecord.value !== undefined) {
        return [
          {
            mediaType,
            schema:
              schema && typeof schema === "object" && !Array.isArray(schema)
                ? (schema as OpenApiSchema)
                : undefined,
            example: firstRecord.value,
            hasProvidedExample: true,
          },
        ];
      }
    }
    return [
      {
        mediaType,
        schema:
          schema && typeof schema === "object" && !Array.isArray(schema)
            ? (schema as OpenApiSchema)
            : undefined,
        example,
        hasProvidedExample: provided,
      },
    ];
  });
}

function parseResponses(responses: Record<string, unknown>): OpenApiResponse[] {
  if (Object.keys(responses).length === 0) {
    return [{ status: "default", description: undefined, headers: [], content: [] }];
  }
  return Object.entries(responses).flatMap(([status, value]) => {
    const r = asRecord(value);
    return [
      {
        status,
        description: asString(r.description),
        headers: parseResponseHeaders(asRecord(r.headers)),
        content: parseContent(asRecord(r.content)),
      },
    ];
  });
}

function parseResponseHeaders(headers: Record<string, unknown>): OpenApiResponseHeader[] {
  return Object.entries(headers).flatMap(([name, value]) => {
    const h = asRecord(value);
    return [
      {
        name,
        description: asString(h.description),
        schema:
          h.schema && typeof h.schema === "object" && !Array.isArray(h.schema)
            ? (h.schema as OpenApiSchema)
            : undefined,
        example: h.example,
      },
    ];
  });
}

function resolveSecurity(
  value: unknown,
  fallback: unknown,
): OpenApiSecurityRequirement[] {
  const source = value === undefined ? fallback : value;
  if (!Array.isArray(source)) return [];
  return (source as unknown[]).flatMap((requirement) => {
    const req = asRecord(requirement);
    const names = Object.entries(req);
    if (names.length === 0) return [];
    return [
      Object.fromEntries(
        names.map(([name, scopes]) => [
          name,
          Array.isArray(scopes) ? scopes.map(String) : [],
        ]),
      ),
    ];
  });
}