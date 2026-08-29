/**
 * Generic JSON → schema inference. JSON is reduced to a small intermediate
 * representation (SchemaNode) that every language/format generator consumes.
 * Adding a generator is one entry in a registry — no per-format boilerplate
 * in the engine.
 */

export type JsonScalar = "string" | "number" | "integer" | "boolean" | "null";

export interface JsonSchemaProp {
  name: string;
  node: SchemaNode;
  optional: boolean;
}

export interface SchemaNode {
  kind: "object" | "array" | "scalar";
  scalar?: JsonScalar;
  props?: JsonSchemaProp[];
  items?: SchemaNode;
  /** Human-meaningful string shape ("uuid", "email", "date-time", "date", "url"). */
  format?: string | null;
}

export const ROOT_NAME = "Root";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^https?:\/\/\S+$/i;

function detectFormat(value: string): string | null {
  if (UUID_RE.test(value)) return "uuid";
  if (EMAIL_RE.test(value)) return "email";
  if (DATE_TIME_RE.test(value)) return "date-time";
  if (DATE_RE.test(value)) return "date";
  if (URL_RE.test(value)) return "url";
  return null;
}

function scalarOf(value: unknown): SchemaNode {
  if (value === null) return { kind: "scalar", scalar: "null" };
  if (typeof value === "string") {
    return { kind: "scalar", scalar: "string", format: detectFormat(value) };
  }
  if (typeof value === "boolean") return { kind: "scalar", scalar: "boolean" };
  if (typeof value === "number") {
    return {
      kind: "scalar",
      scalar: Number.isInteger(value) ? "integer" : "number",
    };
  }
  return { kind: "scalar", scalar: "string" };
}

/** Merge scalar kinds across array samples (number union with integer). */
function mergeScalars(a: JsonScalar, b: JsonScalar): JsonScalar {
  if (a === "number" || b === "number") return "number";
  if (a === "integer" || b === "integer") return "integer";
  if (a === "null" && b === "null") return "null";
  if (a !== "null" && b === "null") return a;
  if (a === "null" && b !== "null") return b;
  return "string";
}

function mergeStrings(a: SchemaNode, b: SchemaNode): SchemaNode {
  let out: string | null = null;
  if (a.format && a.format === b.format) out = a.format;
  // A non-format string dominates an unformatted one only when the typed one
  // appears in the majority — for single-file generation, prefer typed.
  if (a.format && !b.format) out = a.format;
  if (!a.format && b.format) out = b.format;
  return { kind: "scalar", scalar: mergeScalars("string", "string"), format: out };
}

function mergeObject(a: SchemaNode, b: SchemaNode): SchemaNode {
  const all = new Set<string>([...(a.props ?? []).map((p) => p.name), ...(b.props ?? []).map((p) => p.name)]);
  const props: JsonSchemaProp[] = [];
  for (const name of all) {
    const pa = (a.props ?? []).find((p) => p.name === name);
    const pb = (b.props ?? []).find((p) => p.name === name);
    if (pa && pb) {
      props.push({ name, node: merge(pa.node, pb.node), optional: pa.optional && pb.optional });
    } else {
      const node = pa ? pa.node : pb ? pb.node : scalar("string");
      props.push({ name, node, optional: true });
    }
  }
  return { kind: "object", props };
}

function merge(a: SchemaNode, b: SchemaNode): SchemaNode {
  if (a.kind === "scalar" && b.kind === "scalar") {
    // Named string formats collapse to plain string when types differ.
    if (a.scalar === "string" && b.scalar === "string") return mergeStrings(a, b);
    if (a.scalar !== undefined && b.scalar !== undefined) {
      return { kind: "scalar", scalar: mergeScalars(a.scalar, b.scalar) };
    }
    return { kind: "scalar", scalar: "string" };
  }
  if (a.kind === "array" && b.kind === "array") {
    return { kind: "array", items: merge(a.items ?? scalar("string"), b.items ?? scalar("string")) };
  }
  if (a.kind === "object" && b.kind === "object") return mergeObject(a, b);
  // Mixed shapes across samples — the array loses structure; objects win only
  // when both are objects (handled above). Otherwise keep the first shape and
  // mark scalar leaves as "string" so output stays valid code.
  return a.kind === "object" ? a : b.kind === "object" ? b : scalar("string");
}

function scalar(value: JsonScalar): SchemaNode {
  return { kind: "scalar", scalar: value };
}

/** Schema inference for one value with full depth, or merged across samples. */
export function infer(value: unknown, depth = 0): SchemaNode {
  if (depth > 24) return scalar("string");
  if (Array.isArray(value)) {
    const item = value.length > 0 ? value.slice(0, 50).reduce<SchemaNode | null>((acc, v) => {
      const n = infer(v, depth + 1);
      return acc ? merge(acc, n) : n;
    }, null) : null;
    return { kind: "array", items: item ?? scalar("string") };
  }
  if (value !== null && typeof value === "object") {
    const props: JsonSchemaProp[] = Object.entries(value).map(([name, v]) => ({
      name,
      node: infer(v, depth + 1),
      optional: false,
    }));
    return { kind: "object", props };
  }
  return scalarOf(value);
}

/** Merge a list of top-level samples (e.g. an array of objects) into one node. */
export function inferAll(samples: unknown[]): SchemaNode {
  if (samples.length === 0) return scalar("string");
  return samples.slice(0, 50).reduce<SchemaNode | null>((acc, v) => {
    const n = infer(v);
    return acc ? merge(acc, n) : n;
  }, null) as SchemaNode;
}

/** The object type inside the root node (for class/struct/interface output). */
export function rootObject(node: SchemaNode): SchemaNode {
  if (node.kind === "object") return node;
  if (node.kind === "array" && node.items?.kind === "object") return node.items;
  return { kind: "object", props: [] };
}