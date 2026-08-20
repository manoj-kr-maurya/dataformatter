export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type TableResult =
  | { ok: true; columns: string[]; rows: string[][] }
  | { ok: false; error: string };

/** Flatten a top-level array of objects into columns + string rows. */
export function jsonTable(value: unknown): TableResult {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      error: "JSON to table requires the top-level value to be an array of objects.",
    };
  }
  if (value.length === 0) {
    return { ok: false, error: "JSON to table requires at least one row of data." };
  }
  if (!value.every(isPlainObject)) {
    return {
      ok: false,
      error: "JSON to table requires every array element to be an object.",
    };
  }

  const columns: string[] = [];
  for (const row of value) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) {
        columns.push(key);
      }
    }
  }

  const rows = value.map((row) =>
    columns.map((column) => {
      const cell = (row as Record<string, unknown>)[column];
      return cellText(cell);
    }),
  );

  return { ok: true, columns, rows };
}

function cellText(cell: unknown): string {
  if (cell === null || cell === undefined) {
    return "";
  }
  if (typeof cell === "string") {
    return cell;
  }
  if (typeof cell === "number" || typeof cell === "boolean") {
    return String(cell);
  }
  return JSON.stringify(cell);
}

export function csvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

export function tsvCell(value: string): string {
  if (!/["\t\n\r]/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

export function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}