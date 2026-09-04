/**
 * API breaking-change detection — compares two JSON documents (either raw
 * JSON responses/payloads or JSON-Schema-style documents) and classifies each
 * structural difference as breaking, potentially-breaking, non-breaking or
 * informational. Builds on the shared structural diff engine (diffJson);
 * heuristics are observations, never guarantees.
 */

import type { DebugSession } from "@/lib/debug/types";
import { makeFinding, sortFindings } from "@/lib/debug/findings";
import { emptySession } from "@/lib/debug/session";
import { diffJson, type DiffChange } from "@/lib/json-diff/diff";

export type ApiChangeSeverity = "breaking" | "potentially-breaking" | "non-breaking" | "informational";

export interface ApiChange {
  path: string;
  severity: ApiChangeSeverity;
  /** "added" | "removed" | "changed" — mirrors the underlying diff kind. */
  kind: DiffChange["kind"];
  title: string;
  description: string;
  before?: string;
  after?: string;
}

export interface ApiDiffSummary {
  breaking: number;
  potentiallyBreaking: number;
  nonBreaking: number;
  informational: number;
}

export interface ApiDiffResult {
  ok: boolean;
  error?: string;
  isSchemaComparison: boolean;
  changes: ApiChange[];
  summary: ApiDiffSummary;
  session: DebugSession;
}

const compact = (value: unknown): string => {
  const text = JSON.stringify(value);
  return text !== undefined && text.length > 220 ? `${text.slice(0, 217)}…` : text ?? "null";
};

/** Does the document look like a JSON Schema (has type/properties/required at root)? */
export function looksLikeSchema(value: unknown): boolean {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.type === "string" ||
    typeof record.type === "object" ||
    typeof record.properties === "object" ||
    typeof record.items === "object" ||
    Array.isArray(record.required) ||
    Array.isArray(record.enum)
  );
}

interface ShapeFlip {
  path: string;
  before: "object" | "array";
  after: "object" | "array";
}

/**
 * A coarse parallel walk that reports only container objects → arrays (and
 * vice versa). The shared structural diff engine emits these as field-level
 * removed/added changes; this scan gives them a headline signal.
 */
function findShapeFlips(a: unknown, b: unknown, path: string, out: ShapeFlip[], limit = 200): void {
  if (out.length >= limit) return;
  const isContainer = (value: unknown): value is unknown[] | Record<string, unknown> =>
    value !== null && typeof value === "object";
  if (!isContainer(a) || !isContainer(b)) return;
  const aArray = Array.isArray(a);
  const bArray = Array.isArray(b);
  if (aArray !== bArray) {
    out.push({ path, before: aArray ? "array" : "object", after: bArray ? "array" : "object" });
    return;
  }
  if (aArray && bArray) {
    const span = Math.max(a.length, b.length);
    for (let i = 0; i < span; i++) {
      if (i < a.length && i < b.length && JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
        findShapeFlips(a[i], b[i], `${path}[${i}]`, out);
      }
    }
    return;
  }
  const recordA = a as Record<string, unknown>;
  const recordB = b as Record<string, unknown>;
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (key in recordA && key in recordB && JSON.stringify(recordA[key]) !== JSON.stringify(recordB[key])) {
      const childPath = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
        ? `${path}.${key}`
        : `${path}[${JSON.stringify(key)}]`;
      findShapeFlips(recordA[key], recordB[key], childPath, out);
    }
  }
}

export function resolvePath(doc: unknown, path: string): { found: boolean; value?: unknown } {
  let current: unknown = doc;
  const segmentPattern = /^\.([A-Za-z_$][A-Za-z0-9_$]*)|^\[(\d+)\]|^\[("(?:\\.|[^"])*")\]|^\.(.*)$/g;
  let rest = path.replace(/^\$/, "");
  segmentPattern.lastIndex = 0;
  while (rest.length > 0) {
    segmentPattern.lastIndex = 0;
    const match = segmentPattern.exec(rest);
    if (!match) return { found: false };
    const [, ident, indexStr, quotedKey, fallback] = match;
    rest = rest.slice(match[0].length);
    if (current === null || typeof current !== "object") return { found: false };
    let key: string | undefined;
    if (ident !== undefined) key = ident;
    else if (indexStr !== undefined) key = indexStr;
    else if (quotedKey !== undefined) key = JSON.parse(quotedKey) as string;
    else if (fallback !== undefined) key = fallback;
    if (key === undefined) return { found: false };
    const record = current as Record<string, unknown>;
    if (Array.isArray(current)) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index >= (current as unknown[]).length) return { found: false };
      current = (current as unknown[])[index];
    } else if (!(key in record)) {
      return { found: false };
    } else {
      current = record[key];
    }
  }
  return { found: true, value: current };
}

/** Normalize a schema "type" member (string or array of strings) to a set. */
function typeSet(value: unknown): Set<string> {
  if (typeof value === "string") return new Set([value]);
  if (Array.isArray(value)) return new Set(value.filter((item): item is string => typeof item === "string"));
  return new Set();
}

function compareTypeChange(before: unknown, after: unknown): ApiChangeSeverity {
  const beforeTypes = typeSet(before);
  const afterTypes = typeSet(after);
  if (beforeTypes.size === 0 || afterTypes.size === 0) return "potentially-breaking";
  const removedTypes = new Set([...beforeTypes].filter((t) => !afterTypes.has(t)));
  if (removedTypes.size === 0) {
    return "non-breaking";
  }
  if (removedTypes.size === 1 && removedTypes.has("null")) {
    return "breaking";
  }
  return "breaking";
}

function classify(
  change: DiffChange,
  beforeValue: unknown,
  afterValue: unknown,
  isSchema: boolean,
  pathContext: string,
): ApiChange {
  const lastKey = pathFragment(change.path);
  const isRequiredMember = pathContext.endsWith(".required") || /\.required\[/.test(change.path);
  const isEnumContext = pathContext.endsWith(".enum") || /\.enum\[/.test(change.path);
  const isTypeKeyword = lastKey === "type";

  if (change.kind === "added") {
    if (isRequiredMember) {
      return {
        path: change.path,
        severity: "breaking",
        kind: change.kind,
        title: `New required field "${afterValue}"`,
        description: `"${afterValue}" is now a required field. Existing clients that omit it will fail validation.`,
        after: compact(afterValue),
      };
    }
    if (isEnumContext) {
      return {
        path: change.path,
        severity: "non-breaking",
        kind: change.kind,
        title: `Enum value "${afterValue}" added`,
        description: `A new allowed value was added to the enum. Existing inputs remain valid.`,
        after: compact(afterValue),
      };
    }
    if (isArrayContext(change.path)) {
      return {
        path: change.path,
        severity: "informational",
        kind: change.kind,
        title: "Array element added",
        description: `An element was added at ${change.path}. Array order and length can carry meaning — treat as informational unless ordering is contractual.`,
        after: compact(afterValue),
      };
    }
    return {
      path: change.path,
      severity: "non-breaking",
      kind: change.kind,
      title: `Field "${lastKey}" added`,
      description: isSchema
        ? `A new field was added to the schema. It is assumed optional (no required marker) — a client that ignores unknown fields is safe.`
        : `A new field was added to the response. Clients that ignore unknown fields are safe.`,
      after: compact(afterValue),
    };
  }

  if (change.kind === "removed") {
    if (isRequiredMember) {
      return {
        path: change.path,
        severity: "non-breaking",
        kind: change.kind,
        title: `Required constraint relaxed for "${beforeValue}"`,
        description: `"${beforeValue}" was removed from the required list — previously required fields becoming optional is non-breaking.`,
        before: compact(beforeValue),
      };
    }
    if (isEnumContext) {
      return {
        path: change.path,
        severity: "breaking",
        kind: change.kind,
        title: `Enum value "${beforeValue}" removed`,
        description: `A previously allowed value was removed from the enum. Inputs using "${beforeValue}" will now be rejected.`,
        before: compact(beforeValue),
      };
    }
    if (isArrayContext(change.path)) {
      return {
        path: change.path,
        severity: "potentially-breaking",
        kind: change.kind,
        title: "Array element removed",
        description: `An element was removed at ${change.path}. Shifting array indices can break clients that assume positions.`,
        before: compact(beforeValue),
      };
    }
    return {
      path: change.path,
      severity: "breaking",
      kind: change.kind,
      title: `Field "${lastKey}" removed`,
      description: isSchema
        ? `The field was removed from the schema. Clients that read "${lastKey}" will receive undefined.`
        : `The field was removed from the response. Clients that read "${lastKey}" may break.`,
      before: compact(beforeValue),
    };
  }

  // changed ----------------------------------------------------------------
  const beforeKind = valueShape(beforeValue);
  const afterKind = valueShape(afterValue);

  if (isTypeKeyword) {
    const severity = compareTypeChange(beforeValue, afterValue);
    return {
      path: change.path,
      severity,
      kind: change.kind,
      title: `Type changed: ${compact(beforeValue)} → ${compact(afterValue)}`,
      description:
        severity === "non-breaking"
          ? `The type constraint was relaxed (new allowed type added, "null" made acceptable). Existing usage stays valid.`
          : `The declared type changed. Serialized values will now differ, and clients relying on the previous type may break.`,
      before: compact(beforeValue),
      after: compact(afterValue),
    };
  }

  if (beforeKind === afterKind) {
    if (beforeKind === "object" || beforeKind === "array") {
      return {
        path: change.path,
        severity: "informational",
        kind: change.kind,
        title: "Nested structure changed",
        description: `The ${beforeKind} at this path changed — see the individual field changes below for breakage details.`,
        before: compact(beforeValue),
        after: compact(afterValue),
      };
    }
    return {
      path: change.path,
      severity: "informational",
      kind: change.kind,
      title: "Value changed",
      description: `A scalar value changed from ${compact(beforeValue)} to ${compact(afterValue)}. Scalar value changes are informational unless the value is contractual (e.g. a version or a flag default).`,
      before: compact(beforeValue),
      after: compact(afterValue),
    };
  }

  // shape mismatch ----------------------------------------------------------
  if (beforeValue === null && afterValue !== null) {
    return {
      path: change.path,
      severity: "potentially-breaking",
      kind: change.kind,
      title: "Nullable → non-null",
      description: `The value was null in the previous document and is now ${afterKind}. Clients with null-handling are flagged as a potential break.`,
      before: compact(beforeValue),
      after: compact(afterValue),
    };
  }
  if (beforeValue !== null && afterValue === null) {
    return {
      path: change.path,
      severity: "potentially-breaking",
      kind: change.kind,
      title: "Value → null",
      description: `The value is now null where it was previously ${beforeKind}. Clients that do not handle null may break.`,
      before: compact(beforeValue),
      after: compact(afterValue),
    };
  }
  if ((beforeKind === "object" && afterKind === "array") || (beforeKind === "array" && afterKind === "object")) {
    return {
      path: change.path,
      severity: "breaking",
      kind: change.kind,
      title: `Shape changed: ${beforeKind} → ${afterKind}`,
      description: `The container shape flipped between object and array. This is very likely to break consumers.`,
      before: compact(beforeValue),
      after: compact(afterValue),
    };
  }
  return {
    path: change.path,
    severity: "breaking",
    kind: change.kind,
    title: `Type changed: ${beforeKind} → ${afterKind}`,
    description: `A ${beforeKind} became ${afterKind}. Existing serializers/parsers relying on ${beforeKind} may break.`,
    before: compact(beforeValue),
    after: compact(afterValue),
  };
}

function pathFragment(path: string): string {
  const dot = path.lastIndexOf(".");
  const bracket = path.lastIndexOf("[");
  return path.slice(Math.max(dot, bracket) + 1).replace(/^"([^"]*)"$/, "$1").replace(/\]$/, "");
}

function isArrayContext(path: string): boolean {
  return /\[\d+\]$/.test(path);
}

function valueShape(value: unknown): "null" | "string" | "number" | "boolean" | "object" | "array" {
  if (value === null) return "null";
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") return type;
  return Array.isArray(value) ? "array" : "object";
}

export function compareApis(previous: string, current: string): ApiDiffResult {
  const diff = diffJson(previous, current);
  if (!diff.ok) {
    return {
      ok: false,
      error: diff.error,
      isSchemaComparison: false,
      changes: [],
      summary: { breaking: 0, potentiallyBreaking: 0, nonBreaking: 0, informational: 0 },
      session: emptySession("api-diff"),
    };
  }

  const parsedPrevious = JSON.parse(previous) as unknown;
  const parsedCurrent = JSON.parse(current) as unknown;
  const isSchemaComparison = looksLikeSchema(parsedPrevious) || looksLikeSchema(parsedCurrent);

  const flips: ShapeFlip[] = [];
  findShapeFlips(parsedPrevious, parsedCurrent, "$", flips);
  const flippedPrefixes = flips.map((flip) => (flip.path === "$" ? "$." : `${flip.path}.`));

  const changes: ApiChange[] = diff.changes
    .filter((change) => !flippedPrefixes.some((prefix) => change.path.startsWith(prefix)))
    .map((change) => {
      const before = resolvePath(parsedPrevious, change.path);
      const after = resolvePath(parsedCurrent, change.path);
      return classify(change, before.value, after.value, isSchemaComparison, parentPath(change.path));
    });

  for (const flip of flips) {
    changes.push({
      path: flip.path,
      severity: "breaking",
      kind: "changed",
      title: `Shape changed: ${flip.before} → ${flip.after}`,
      description:
        "The container at this path flipped between object and array. This is very likely to break consumers — field-level additions/removals under it are effects of the flip.",
    });
  }

  changes.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity) || a.path.localeCompare(b.path));

  const summary: ApiDiffSummary = {
    breaking: changes.filter((change) => change.severity === "breaking").length,
    potentiallyBreaking: changes.filter((change) => change.severity === "potentially-breaking").length,
    nonBreaking: changes.filter((change) => change.severity === "non-breaking").length,
    informational: changes.filter((change) => change.severity === "informational").length,
  };

  const session = emptySession("api-diff");
  session.metadata = {
    isSchemaComparison,
    breaking: summary.breaking,
    potentiallyBreaking: summary.potentiallyBreaking,
    nonBreaking: summary.nonBreaking,
    informational: summary.informational,
  };
  session.findings = sortFindings(
    changes.map((change) => {
      const evidenceParts = [
        change.before !== undefined ? `− ${change.before}` : undefined,
        change.after !== undefined ? `+ ${change.after}` : undefined,
      ].filter((part): part is string => part !== undefined);
      return makeFinding({
        severity: severityToDebugSeverity(change.severity),
        category: "api-compat",
        title: change.title,
        description: change.description,
        location: change.path,
        evidence: evidenceParts.length > 0 ? evidenceParts.join("  ") : undefined,
        tags: [change.severity],
        confidence: change.severity === "breaking" ? "high" : "medium",
      });
    }),
  );

  return { ok: true, isSchemaComparison, changes, summary, session };
}

function parentPath(path: string): string {
  const depth = Math.max(path.lastIndexOf("."), path.lastIndexOf("["), 0);
  return path.slice(0, depth);
}

function severityOrder(severity: ApiChangeSeverity): number {
  return ["breaking", "potentially-breaking", "non-breaking", "informational"].indexOf(severity);
}

function severityToDebugSeverity(severity: ApiChangeSeverity): "critical" | "error" | "success" | "info" {
  switch (severity) {
    case "breaking":
      return "critical";
    case "potentially-breaking":
      return "error";
    case "non-breaking":
      return "success";
    case "informational":
      return "info";
  }
}