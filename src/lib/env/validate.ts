/**
 * .env validator and comparator — detects malformed lines, duplicate keys,
 * empty values, and diffs two files (e.g. .env vs .env.example).
 * Everything runs locally; contents are never transmitted.
 */

export interface EnvEntry {
  key: string;
  value: string;
  line: number;
  hasValue: boolean;
}

export type EnvIssueKind =
  | "invalid-name"
  | "empty-value"
  | "duplicate-key"
  | "leading-space"
  | "trailing-space"
  | "spaces-around-equals"
  | "unquoted-line";

export interface EnvIssue {
  kind: EnvIssueKind;
  key: string;
  line: number;
  message: string;
}

const VALID_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function parseEnv(text: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq).trim();
    if (key.startsWith("export ")) key = key.slice("export ".length).trim();
    const value = trimmed.slice(eq + 1).trim();
    entries.push({ key, value, line: i + 1, hasValue: value.length > 0 });
  }
  return entries;
}

export function validateEnv(text: string): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const seen = new Map<string, number>();
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    let raw = lines[i];
    const line = i + 1;
    if (raw.trim().length === 0 || /^\s*[#;]/.test(raw)) continue;
    if (/^\s*export\s+/i.test(raw)) raw = raw.replace(/^\s*export\s+/i, "");

    if (!raw.includes("=")) {
      issues.push({
        kind: "unquoted-line",
        key: raw.trim().slice(0, 40),
        line,
        message: raw.trim().length > 0 ? `Line ${line} has no "=" — it is ignored by most dotenv parsers.` : "",
      });
      continue;
    }
    if (/^\s/.test(raw)) {
      issues.push({
        kind: "leading-space",
        key: raw.trim().split("=")[0].slice(0, 40),
        line,
        message: `Line ${line} starts with whitespace — the key may be misread.`,
      });
    }
    const eq = raw.indexOf("=");
    const key = raw.slice(0, eq).trim();
    const value = raw.slice(eq + 1);

    if (/\s(?==)|(?<==)\s/.test(raw)) {
      issues.push({
        kind: "spaces-around-equals",
        key,
        line,
        message: `Line ${line}: whitespace around "=" — the value includes the space verbatim.`,
      });
    }
    if (/[ \t]+$/.test(value)) {
      issues.push({
        kind: "trailing-space",
        key,
        line,
        message: `Line ${line}: trailing whitespace in the value.`,
      });
    }
    if (key.length === 0) {
      issues.push({
        kind: "invalid-name",
        key: "",
        line,
        message: `Line ${line}: missing key before "=".`,
      });
    } else if (!VALID_NAME_RE.test(key)) {
      issues.push({
        kind: "invalid-name",
        key,
        line,
        message: `Line ${line}: "${key}" is not a valid environment variable name.`,
      });
    }
    if (value.trim().length === 0) {
      issues.push({
        kind: "empty-value",
        key,
        line,
        message: `Line ${line}: "${key}" is empty — use it explicitly only if intended.`,
      });
    }
    if (seen.has(key)) {
      issues.push({
        kind: "duplicate-key",
        key,
        line,
        message: `Line ${line}: "${key}" duplicates line ${seen.get(key)} — the last definition wins in most runtimes.`,
      });
    } else {
      seen.set(key, line);
    }
  }
  return issues;
}

export interface EnvDiff {
  /** Keys in .env.example but absent from .env. */
  missing: { key: string; exampleValue?: string }[];
  /** Keys in .env but absent from .env.example. */
  extra: string[];
  /** Keys present in both but with different values. */
  changed: { key: string; a: string; b: string }[];
}

export function diffEnv(aText: string, bText: string): EnvDiff {
  const a = new Map(parseEnv(aText).map((e) => [e.key, e]));
  const b = new Map(parseEnv(bText).map((e) => [e.key, e]));
  const missing: EnvDiff["missing"] = [];
  const extra: string[] = [];
  const changed: EnvDiff["changed"] = [];

  for (const [key, entry] of b) {
    if (!a.has(key)) missing.push({ key, exampleValue: entry.value });
  }
  for (const [key] of a) {
    if (!b.has(key)) extra.push(key);
  }
  for (const [key, entry] of a) {
    const other = b.get(key);
    if (other && entry.value !== other.value) {
      changed.push({ key, a: entry.value, b: other.value });
    }
  }
  extra.sort();
  changed.sort((x, y) => x.key.localeCompare(y.key));
  missing.sort((x, y) => x.key.localeCompare(y.key));
  return { missing, extra, changed };
}