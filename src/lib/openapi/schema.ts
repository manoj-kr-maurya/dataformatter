import type { JsonScalar, SchemaNode } from "@/lib/json-schema/infer";
import { dereferenceSchema } from "@/lib/openapi/refs";
import type { OpenApiDocumentModel, OpenApiSchema } from "@/lib/openapi/types";

/**
 * OpenAPI → SchemaNode bridge plus sample/mock value generation.
 *
 * The workbench deliberately does not re-implement language code generation:
 * OpenAPI schemas are converted to the existing JsonSchema SchemaNode IR and
 * fed to the shared `generateCode` engine, the same one powering the
 * JSON → Code tool. Samples are deterministic placeholder values — never
 * claimed to be real API output.
 */

const FORMAT_HINT: Record<string, { scalar?: JsonScalar; value?: unknown }> = {
  uuid: { value: "3f5a2b1c-4853-4a1e-8f9c-1d2e3f4a5b6c" },
  email: { value: "user@example.com" },
  "date-time": { value: "2026-01-01T00:00:00Z" },
  date: { value: "2026-01-01" },
  uri: { value: "https://example.com" },
  url: { value: "https://example.com" },
  uriReference: { value: "/resource/123" },
  hostname: { value: "example.com" },
  ipv4: { value: "192.0.2.1" },
  ipv6: { value: "2001:db8::1" },
  password: { value: "secret" },
  binary: { value: "binary" },
  byte: { value: "U3RyaW5n" },
  "int32": { scalar: "integer", value: 0 },
  "int64": { scalar: "integer", value: 0 },
  float: { scalar: "number", value: 0 },
  double: { scalar: "number", value: 0 },
};

const SCALAR_BY_TYPE: Record<string, JsonScalar> = {
  string: "string",
  number: "number",
  integer: "integer",
  boolean: "boolean",
  null: "null",
};

function typeOf(schema: OpenApiSchema): JsonScalar | undefined {
  if (schema.type && SCALAR_BY_TYPE[schema.type]) {
    if (schema.type === "string") {
      const hint = FORMAT_HINT[schema.format ?? ""];
      return hint?.scalar ?? "string";
    }
    if (schema.type === "number") {
      const hint = FORMAT_HINT[schema.format ?? ""];
      return hint?.scalar ?? "number";
    }
    return SCALAR_BY_TYPE[schema.type];
  }
  if (schema.properties) return undefined;
  if (schema.items) return undefined;
  return "string";
}

/** Pick a single branch for a composite (oneOf/anyOf), preferring structures. */
function firstBranch(schema: OpenApiSchema): OpenApiSchema | undefined {
  const branches = schema.oneOf ?? schema.anyOf ?? [];
  if (branches.length === 0) return undefined;
  return branches.find((b) => b.properties || b.items || b.$ref) ?? branches[0];
}

/** Convert an OpenAPI schema into the shared SchemaNode IR. */
export function schemaToNode(
  schema: OpenApiSchema | undefined,
  model: OpenApiDocumentModel,
): SchemaNode {
  const deref = dereferenceSchema(schema, model);
  if (deref.properties) {
    const required = new Set(deref.required ?? []);
    const props = Object.entries(deref.properties).map(([name, prop]) => ({
      name,
      node: schemaToNode(prop, model),
      optional: !required.has(name) || deref.readOnly === true,
    }));
    return { kind: "object", props };
  }
  const resolvedType = deref.type ?? (deref.oneOf || deref.anyOf ? schemaToNode(firstBranch(deref), model) : undefined);
  if (!resolvedType && deref.items) {
    return { kind: "array", items: schemaToNode(deref.items, model) };
  }
  if (deref.items) {
    return { kind: "array", items: schemaToNode(deref.items, model) };
  }
  const format =
    deref.type === "string" && FORMAT_HINT[deref.format ?? ""]
      ? deref.format
      : deref.enum?.[0] && typeof deref.enum[0] === "string"
        ? null
        : null;
  const scalar = format ? "string" : typeOf(deref) ?? "string";
  return { kind: "scalar", scalar, format: format && scalar === "string" ? format : null };
}

export interface SchemaSampleResult {
  value: unknown;
  /** True when the value came straight from an example/default on the doc. */
  provided: boolean;
}

const NAME_HINTS: Record<string, unknown> = {
  name: "Example User",
  title: "Example Title",
  displayName: "Example User",
  id: 123,
  userId: 123,
  count: 3,
  quantity: 3,
  limit: 10,
  active: true,
  enabled: true,
  status: "active",
  slug: "example-slug",
};

const MAX_DEPTH = 6;

function hintFor(name: string, scalar: JsonScalar): unknown | undefined {
  const hint = NAME_HINTS[name];
  if (hint === undefined) return undefined;
  if (scalar === "number" || scalar === "integer") {
    return typeof hint === "number" ? hint : undefined;
  }
  if (scalar === "boolean") return typeof hint === "boolean" ? hint : undefined;
  if (scalar === "string") return typeof hint === "string" ? hint : undefined;
  return undefined;
}

/** Deterministic placeholder for one scalar, honouring format + enum + hints. */
function scalarSample(
  schema: OpenApiSchema,
  name: string | undefined,
): { value: unknown; provided: boolean } {
  if (schema.example !== undefined) {
    return { value: schema.example, provided: true };
  }
  if (schema.default !== undefined) {
    return { value: schema.default, provided: true };
  }
  if (schema.enum && schema.enum.length > 0) {
    return { value: schema.enum[0], provided: true };
  }
  const scalar = typeOf(schema) ?? "string";
  const hint = name ? hintFor(name, scalar) : undefined;
  if (hint !== undefined) {
    return { value: hint, provided: false };
  }
  if (scalar === "boolean") return { value: false, provided: false };
  if (scalar === "number") return { value: 0, provided: false };
  if (scalar === "integer") return { value: 0, provided: false };
  if (scalar === "null") return { value: null, provided: false };
  const hintVal = FORMAT_HINT[schema.format ?? ""]?.value;
  return { value: hintVal ?? "string", provided: false };
}

/**
 * Generate a sample value for any schema. Ref and allOf resolution is safe
 * against circular documents; depth is capped to keep huge graphs usable.
 */
export function sampleFromSchema(
  schema: OpenApiSchema | undefined,
  model: OpenApiDocumentModel,
  opts: { requiredOnly?: boolean; propertyName?: string } = {},
): SchemaSampleResult {
  const deref = dereferenceSchema(schema, model);

  const build = (
    s: OpenApiSchema,
    name: string | undefined,
    depth: number,
  ): { value: unknown; provided: boolean } => {
    if (depth > MAX_DEPTH) return { value: null, provided: false };
    if (s.example !== undefined) return { value: s.example, provided: true };
    if (s.default !== undefined) return { value: s.default, provided: true };

    if (s.properties) {
      const value: Record<string, unknown> = {};
      let anyProvided = false;
      for (const [propName, prop] of Object.entries(s.properties)) {
        const requiredSet = new Set(s.required ?? []);
        const skipOptional = opts.requiredOnly && !requiredSet.has(propName);
        if (skipOptional) continue;
        const child = build(prop, propName, depth + 1);
        value[propName] = child.value;
        if (child.provided) anyProvided = true;
      }
      return { value, provided: anyProvided };
    }
    if (s.items) {
      const child = build(s.items, undefined, depth + 1);
      return { value: [child.value], provided: child.provided };
    }
    const branch = firstBranch(s);
    if (branch) {
      return build(branch, name, depth);
    }
    const sample = scalarSample(s, name);
    return { value: sample.value, provided: sample.provided };
  };

  return build(deref, opts.propertyName, 0);
}

export interface SchemaPropRow {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  enum?: string;
  deprecated?: boolean;
  format?: string;
  defaultValue?: string;
}

function typeLabel(schema: OpenApiSchema): string {
  if (schema.items) {
    const inner = schema.items.properties
      ? "object"
      : schema.items.items
        ? "array"
        : schema.items.enum
          ? "enum"
          : schema.items.type ?? "string";
    return schema.type === "array" ? `${inner}[]` : `array<${inner}>`;
  }
  if (schema.properties) return "object";
  if (schema.oneOf || schema.anyOf) return "oneOf";
  if (schema.enum) return `enum(${schema.enum.length})`;
  return schema.type ?? "any";
}

function describe(
  schema: OpenApiSchema,
  prefix: string,
  model: OpenApiDocumentModel,
  rows: SchemaPropRow[],
  depth: number,
): void {
  if (depth > 8) return;
  const deref = dereferenceSchema(schema, model);
  if (deref.properties) {
    const requiredSet = new Set(deref.required ?? []);
    for (const [name, prop] of Object.entries(deref.properties)) {
      const path = prefix ? `${prefix}.${name}` : name;
      const leaf = dereferenceSchema(prop, model);
      if (leaf.properties || leaf.items) {
        rows.push({
          name: path,
          type: typeLabel(leaf),
          required: requiredSet.has(name),
          description: leaf.description,
          deprecated: leaf.deprecated,
        });
        describe(leaf, path, model, rows, depth + 1);
      } else {
        const unified = typeLabel(leaf);
        rows.push({
          name: path,
          type: unified,
          required: requiredSet.has(name),
          description: leaf.description,
          enum: leaf.enum ? leaf.enum.map((v) => JSON.stringify(v)).join(" | ") : undefined,
          deprecated: leaf.deprecated,
          format: leaf.format,
          defaultValue:
            leaf.default !== undefined ? JSON.stringify(leaf.default) : undefined,
        });
      }
    }
    return;
  }
  if (deref.items) {
    const leaf = dereferenceSchema(deref.items, model);
    if (!leaf.properties && !leaf.items) {
      rows.push({
        name: prefix || "(items)",
        type: `array of ${typeLabel(leaf)}`,
        required: true,
        description: leaf.description,
      });
      return;
    }
    describe(leaf, `${prefix || "items"}[]`, model, rows, depth + 1);
  }
}

/** Flatten a schema into display rows for the schema viewer. */
export function describeSchema(
  schema: OpenApiSchema | undefined,
  model: OpenApiDocumentModel,
): SchemaPropRow[] {
  const rows: SchemaPropRow[] = [];
  describe(dereferenceSchema(schema, model), "", model, rows, 0);
  return rows;
}