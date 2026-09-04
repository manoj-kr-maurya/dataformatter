import { dereferenceSchema } from "@/lib/openapi/refs";
import type {
  OpenApiDocumentModel,
  OpenApiEndpoint,
  OpenApiParameter,
  OpenApiSchema,
} from "@/lib/openapi/types";

/**
 * Structural validation of a normalized OpenAPI document. Produces a list of
 * issues (errors + warnings) with a location string usable as "GET /users id"
 * / "POST /users request" etc. Diagnostics never throw; every malformed
 * fragment is skipped and reported.
 */

export interface OpenApiIssue {
  level: "error" | "warning";
  location: string;
  message: string;
}

function methodLabel(method: string): string {
  return method.toUpperCase();
}

function endpointLabel(endpoint: OpenApiEndpoint): string {
  return `${methodLabel(endpoint.method)} ${endpoint.path}`;
}

const KNOWN_TYPES = new Set([
  "string",
  "number",
  "integer",
  "boolean",
  "array",
  "object",
  "null",
]);

export function validateOpenApi(model: OpenApiDocumentModel): OpenApiIssue[] {
  const issues: OpenApiIssue[] = [];
  const seenOperationIds = new Map<string, OpenApiEndpoint>();

  if (!model.info.title || model.info.title === "Untitled API") {
    issues.push({ level: "error", location: "info", message: "Missing or empty info.title." });
  }
  if (!model.info.version) {
    issues.push({ level: "error", location: "info.version", message: "Missing info.version." });
  }
  if (model.paths.length === 0) {
    issues.push({ level: "error", location: "paths", message: "No operations (paths) found." });
  }

  for (const endpoint of model.paths) {
    const label = endpointLabel(endpoint);
    if (endpoint.operationId) {
      const prior = seenOperationIds.get(endpoint.operationId);
      if (prior) {
        issues.push({
          level: "warning",
          location: label,
          message: `operationId "${endpoint.operationId}" is duplicated (also used on ${prior.method.toUpperCase()} ${prior.path}).`,
        });
      } else {
        seenOperationIds.set(endpoint.operationId, endpoint);
      }
    }

    validateParameters(endpoint.parameters, endpoint, issues);
    validateSchemaFields(endpoint, model, issues);

    if (endpoint.requestBody) {
      const requiresBody = ["put", "post", "patch"].includes(endpoint.method);
      if (requiresBody && endpoint.requestBody.content.length === 0) {
        issues.push({
          level: "warning",
          location: `${label} requestBody`,
          message: `${methodLabel(endpoint.method)} requests usually carry a body but none is described.`,
        });
      }
    }

    for (const response of endpoint.responses) {
      if (!response.description) {
        issues.push({
          level: "error",
          location: `${label} responses.${response.status}`,
          message: `Response ${response.status} has no description (OpenAPI requires one).`,
        });
      }
    }
  }

  validateComponentRefs(model, issues);
  return issues;
}

function validateParameters(
  parameters: OpenApiParameter[],
  endpoint: OpenApiEndpoint,
  issues: OpenApiIssue[],
): void {
  const label = endpointLabel(endpoint);
  const seen = new Set<string>();
  const pathTemplate = new Set(
    (endpoint.path.match(/\{([^}]+)\}/g) ?? []).map((p) => p.slice(1, -1)),
  );
  const pathParams = new Set(
    parameters.filter((p) => p.in === "path").map((p) => p.name),
  );

  for (const param of parameters) {
    const key = `${param.in}:${param.name}`;
    if (seen.has(key)) {
      issues.push({
        level: "warning",
        location: `${label} parameters.${param.name}`,
        message: `Parameter "${param.name}" (in ${param.in}) is defined more than once.`,
      });
    }
    seen.add(key);

    if (param.in === "path" && !param.required) {
      issues.push({
        level: "error",
        location: `${label} parameters.${param.name}`,
        message: `Path parameter "${param.name}" must be required.`,
      });
    }
    if (param.in === "path" && !pathTemplate.has(param.name)) {
      issues.push({
        level: "warning",
        location: `${label} parameters.${param.name}`,
        message: `Path parameter "${param.name}" does not appear in the URL template {…}.`,
      });
    }
  }

  for (const token of pathTemplate) {
    if (!pathParams.has(token)) {
      issues.push({
        level: "error",
        location: label,
        message: `Path template references "{${token}}" but no matching path parameter is declared.`,
      });
    }
  }
}

function validateSchemaFields(
  endpoint: OpenApiEndpoint,
  model: OpenApiDocumentModel,
  issues: OpenApiIssue[],
): void {
  const label = endpointLabel(endpoint);
  if (endpoint.requestBody) {
    for (const content of endpoint.requestBody.content) {
      if (content.schema) {
        checkSchema(
          content.schema,
          model,
          `${label} requestBody (${content.mediaType})`,
          issues,
        );
      }
    }
  }
  for (const response of endpoint.responses) {
    for (const content of response.content) {
      if (content.schema) {
        checkSchema(
          content.schema,
          model,
          `${label} ${response.status} response (${content.mediaType})`,
          issues,
        );
      }
    }
  }
}

function checkSchema(
  schema: Record<string, unknown>,
  model: OpenApiDocumentModel,
  location: string,
  issues: OpenApiIssue[],
  depth = 0,
): void {
  if (depth > 32) return;
  const s = schema as OpenApiSchema;
  const deref = dereferenceSchema(s, model);
  if (deref.type !== undefined && !KNOWN_TYPES.has(deref.type)) {
    issues.push({
      level: "error",
      location,
      message: `Unknown schema type "${deref.type}".`,
    });
  }
  if (deref.type === "object" && !deref.properties && !deref.additionalProperties) {
    issues.push({
      level: "warning",
      location,
      message: "Object schema has no properties or additionalProperties, so it only matches an empty object.",
    });
  }
  if (deref.properties) {
    for (const [name, prop] of Object.entries(deref.properties)) {
      checkSchema(prop as Record<string, unknown>, model, `${location}.${name}`, issues, depth + 1);
    }
  }
  if (deref.items) {
    checkSchema(deref.items as Record<string, unknown>, model, `${location}[]`, issues, depth + 1);
  }
}

function validateComponentRefs(
  model: OpenApiDocumentModel,
  issues: OpenApiIssue[],
): void {
  const pages = model.paths.flatMap((endpoint) => [
    ...(endpoint.requestBody?.content.map((c) => c.schema ?? {}) ?? []),
    ...endpoint.responses.flatMap((r) => r.content.map((c) => c.schema ?? {})),
  ]);
  collectRefs(model.components.schemas, pages, issues);
}

function collectRefs(
  schemas: Record<string, OpenApiSchema & { [k: string]: unknown }>,
  pages: (OpenApiSchema & { [k: string]: unknown })[],
  issues: OpenApiIssue[],
): void {
  const stack: OpenApiSchema[] = [...pages, ...Object.values(schemas)];
  const seen = new Set<OpenApiSchema>();
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    if (typeof current.$ref === "string") {
      const ref: string = current.$ref;
      if (!ref.startsWith("#/components/schemas/")) continue;
      const name = ref.replace("#/components/schemas/", "").replace(/~1/g, "/");
      if (!schemas[name]) {
        issues.push({
          level: "error",
          location: "components.schemas",
          message: `Unresolved $ref "#/components/schemas/${name}".`,
        });
      }
      continue;
    }
    const items = current.items;
    if (items) stack.push(items);
    if (current.properties) stack.push(...Object.values(current.properties));
    const { allOf, oneOf, anyOf } = current as {
      allOf?: OpenApiSchema[];
      oneOf?: OpenApiSchema[];
      anyOf?: OpenApiSchema[];
    };
    if (allOf) stack.push(...allOf);
    if (oneOf) stack.push(...oneOf);
    if (anyOf) stack.push(...anyOf);
  }
}