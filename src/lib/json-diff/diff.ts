/**
 * Structural JSON diff — pure, browser-side, no dependencies.
 * Produces a flat change list (path + before/after) that UIs render either
 * inline (unified text) or side-by-side (path table), plus summary counts.
 */

export interface DiffChange {
  path: string;
  kind: "added" | "removed" | "changed";
  before?: string;
  after?: string;
}

export interface JsonDiffResult {
  ok: boolean;
  error?: string;
  /** Coordinate of the first parse failure (lines are 1-based). */
  errorLine?: number;
  changes: DiffChange[];
  added: number;
  removed: number;
  changed: number;
}

const canonical = (value: unknown): string => JSON.stringify(value);

/** Compact JSON text for before/after cells (single line, truncated). */
function compact(value: unknown): string {
  const text = canonical(value);
  return text.length > 200 ? `${text.slice(0, 197)}…` : text;
}

export function parseJson(text: string): { value: unknown; line?: number } | { error: string; line?: number } {
  try {
    return { value: JSON.parse(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    const match = message.match(/position (\d+)/);
    let line: number | undefined;
    if (match) {
      line = text.slice(0, Number(match[1])).split("\n").length;
    }
    return { error: message, line };
  }
}

export function diffJson(aText: string, bText: string): JsonDiffResult {
  const a = parseJson(aText);
  if ("error" in a) {
    return { ok: false, error: `JSON A: ${a.error}`, errorLine: a.line, changes: [], added: 0, removed: 0, changed: 0 };
  }
  const b = parseJson(bText);
  if ("error" in b) {
    return { ok: false, error: `JSON B: ${b.error}`, errorLine: b.line, changes: [], added: 0, removed: 0, changed: 0 };
  }

  const changes: DiffChange[] = [];
  walk(a.value, b.value, "$", changes);
  const added = changes.filter((c) => c.kind === "added").length;
  const removed = changes.filter((c) => c.kind === "removed").length;
  const changed = changes.filter((c) => c.kind === "changed").length;
  return { ok: true, changes, added, removed, changed };
}

function walk(a: unknown, b: unknown, path: string, out: DiffChange[]): void {
  if (a === b) return;

  if (Array.isArray(a) && Array.isArray(b)) {
    const span = Math.max(a.length, b.length);
    for (let i = 0; i < span; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= a.length) {
        out.push({ path: childPath, kind: "added", after: compact(b[i]) });
      } else if (i >= b.length) {
        out.push({ path: childPath, kind: "removed", before: compact(a[i]) });
      } else if (canonical(a[i]) !== canonical(b[i])) {
        walk(a[i], b[i], childPath, out);
      }
    }
    return;
  }

  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    const aKeys = new Set(Object.keys(a));
    const bKeys = new Set(Object.keys(b));
    for (const key of aKeys) {
      if (!bKeys.has(key)) {
        out.push({ path: childPath(path, key), kind: "removed", before: compact((a as Record<string, unknown>)[key]) });
      }
    }
    for (const key of bKeys) {
      if (!aKeys.has(key)) {
        out.push({ path: childPath(path, key), kind: "added", after: compact((b as Record<string, unknown>)[key]) });
      }
    }
    for (const key of aKeys) {
      if (bKeys.has(key) && canonical((a as Record<string, unknown>)[key]) !== canonical((b as Record<string, unknown>)[key])) {
        walk((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], childPath(path, key), out);
      }
    }
    return;
  }

  // Scalars (or mismatched container shapes) — report the leaf change but keep
  // deeper diagnostics for arrays/objects by reporting the whole subtree once.
  out.push({ path, kind: "changed", before: compact(a), after: compact(b) });
}

function childPath(path: string, key: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return `${path}.${key}`;
  }
  return `${path}[${JSON.stringify(key)}]`;
}

/** Unified "inline" rendering: one `path → before → after` block per change. */
export function renderInline(result: JsonDiffResult): string {
  if (!result.ok) {
    return result.error ?? "";
  }
  if (result.changes.length === 0) {
    return "No differences. The two JSON documents are identical.";
  }
  return result.changes
    .map((c) => {
      const label =
        c.kind === "added" ? "+ added" : c.kind === "removed" ? "− removed" : "≈ changed";
      const before = c.before !== undefined ? `  ${c.before}\n` : "";
      const after = c.after !== undefined ? `  ${c.after}` : "";
      return `${label}  ${c.path}\n${before}${after}`;
    })
    .join("\n\n");
}