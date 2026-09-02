import type { OpenApiDocumentModel, OpenApiSchema } from "@/lib/openapi/types";

/**
 * Safe `$ref` resolution against the normalized model. External refs
 * ("https://…", "other-file.yaml#/…") are not resolvable by definition of the
 * single-document workbench, so they are reported as null rather than crashing.
 * Circular references are handled with a visited-chain: a ref reached twice on
 * the same path resolves to an "unknown" sentinel so recursion terminates.
 */

export const UNKNOWN_SCHEMA: OpenApiSchema = Object.freeze({ type: "string" });

export function splitRef(ref: string): { pointer: string[] } {
  const hash = ref.indexOf("#");
  const file = hash === -1 ? ref : ref.slice(0, hash);
  const pointer = (hash === -1 ? "" : ref.slice(hash + 1))
    .split("/")
    .filter((part) => part.length > 0)
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
  return { pointer: file ? [] : pointer };
}

/**
 * Resolve a `$ref` string against the model's components. Returns the schema
 * or null when the pointer does not address a resolvable schema (external ref
 * or missing target).
 */
export function resolveSchemaRef(
  ref: string,
  model: OpenApiDocumentModel,
  chain: string[] = [],
): OpenApiSchema | null {
  if (!ref.startsWith("#/")) {
    return null;
  }
  const { pointer } = splitRef(ref);
  if (pointer[0] === "components" && pointer[1] === "schemas" && pointer[2]) {
    return resolveComponent(pointer[2], model, chain);
  }
  if (pointer[0] === "components" && pointer[1] === "securitySchemes" && pointer[2]) {
    return null;
  }
  return null;
}

function resolveComponent(
  name: string,
  model: OpenApiDocumentModel,
  chain: string[],
): OpenApiSchema | null {
  if (chain.includes(name)) {
    return UNKNOWN_SCHEMA;
  }
  const schema = model.components.schemas[name];
  if (!schema) {
    return null;
  }
  return schema;
}

/**
 * Dereference recursively: follows `$ref`, `allOf` (merged objects become a
 * single surface) and `$defs` so downstream consumers see one schema. Cycles
 * resolve to {@link UNKNOWN_SCHEMA}. Deeply nested graphs are capped.
 */
export function dereferenceSchema(
  schema: OpenApiSchema | undefined,
  model: OpenApiDocumentModel,
  depth = 0,
  chain: string[] = [],
): OpenApiSchema {
  if (!schema || depth > 48) {
    return UNKNOWN_SCHEMA;
  }
  if (schema.$ref) {
    if (!schema.$ref.startsWith("#/")) {
      return UNKNOWN_SCHEMA;
    }
    const { pointer } = splitRef(schema.$ref);
    const name = pointer[2];
    if (!name || chain.includes(name)) {
      return UNKNOWN_SCHEMA;
    }
    const target = model.components.schemas[name];
    if (!target) {
      return UNKNOWN_SCHEMA;
    }
    return dereferenceSchema(target, model, depth + 1, [...chain, name]);
  }
  if (schema.allOf && schema.allOf.length > 0) {
    const merged: OpenApiSchema = { ...schema, allOf: undefined };
    for (const part of schema.allOf) {
      const deref = dereferenceSchema(part, model, depth + 1, chain);
      if (deref === UNKNOWN_SCHEMA) {
        continue;
      }
      if (deref.properties) {
        merged.properties = { ...(merged.properties ?? {}), ...deref.properties };
      }
      if (deref.required) {
        merged.required = [...new Set([...(merged.required ?? []), ...deref.required])];
      }
      if (!merged.type && deref.type) {
        merged.type = deref.type;
      }
    }
    return merged;
  }
  if (schema.items) {
    return { ...schema, items: dereferenceSchema(schema.items, model, depth + 1, chain) };
  }
  if (schema.properties) {
    const properties: Record<string, OpenApiSchema> = {};
    for (const [name, child] of Object.entries(schema.properties)) {
      properties[name] = dereferenceSchema(child, model, depth + 1, chain);
    }
    return { ...schema, properties };
  }
  return schema;
}

/** Human name for a component target of a `$ref` ("#/components/schemas/User"). */
export function refName(ref: string | undefined): string | null {
  if (!ref || !ref.startsWith("#/")) {
    return null;
  }
  const { pointer } = splitRef(ref);
  return pointer[2] ?? null;
}