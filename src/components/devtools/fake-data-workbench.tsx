"use client";

import { useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  Segmented,
  Field,
  inputClass,
  Stat,
  Hint,
} from "@/components/devtools/shared";
import { Button } from "@/components/ui/button";
import { generateRows, defaultFields, FIELD_TYPES, type FieldSpec, type FieldType } from "@/lib/fake-data/generate";

type Format = "table" | "json" | "csv";

/** Split one CSV line into cells, honoring double-quoted fields. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

/** Best-guess a generator field type from a column's sample values — order
 *  matters (specific identities win over generic ones like "number"). */
function inferType(values: unknown[]): FieldType {
  const seen = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
  if (seen.length === 0) return "words";
  const strings = seen.slice(0, 20).map((v) => String(v).trim());
  const every = (re: RegExp) => strings.length > 0 && strings.every((s) => re.test(s));
  const uniq = new Set(strings);
  if (uniq.size <= 2 && [...uniq].every((s) => /^(true|false)$/i.test(s))) return "boolean";
  if (every(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return "uuid";
  if (every(/^#[0-9a-f]{6}$/i)) return "hexColor";
  if (every(/^\S+@\S+\.\S+$/)) return "email";
  if (every(/^https?:\/\/\S+$/i)) return "url";
  if (every(/^(?:\d{1,3}\.){3}\d{1,3}$/)) return "ipv4";
  if (every(/^[0-9a-f]{1,4}(?::[0-9a-f]{1,4}){7}$/i)) return "ipv6";
  if (every(/^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/i)) return "mac";
  if (every(/^\d{4}-\d{2}-\d{2}$/)) return "dateIso";
  if (every(/^\d{2}:\d{2}:\d{2}$/)) return "timeIso";
  if (every(/^\+?[\d ()\-.]{7,}$/) && !every(/^-?\d+(\.\d+)?$/)) return "phone";
  if (every(/^-?\d+(\.\d+)?$/)) return "number";
  return "words";
}

export function FakeDataWorkbench() {
  const [fields, setFields] = useState<FieldSpec[]>(defaultFields());
  const [count, setCount] = useState(8);
  const [seed, setSeed] = useState("demo");
  const [format, setFormat] = useState<Format>("json");
  const [showSample, setShowSample] = useState(false);
  const [sampleText, setSampleText] = useState("");
  const [sampleError, setSampleError] = useState("");

  const rows = useMemo(() => {
    try {
      return generateRows(fields, count, seed);
    } catch {
      return [];
    }
  }, [fields, count, seed]);

  const report = useMemo(() => {
    if (format === "json") return JSON.stringify(rows, null, 2);
    if (format === "csv") {
      const header = fields.map((field) => csvCell(field.name)).join(",");
      const body = rows.map((row) => fields.map((field) => csvCell(String(row[field.name] ?? ""))).join(","));
      return [header, ...body].join("\n");
    }
    const header = fields.map((field) => field.name).join("\t");
    const body = rows.map((row) => fields.map((field) => String(row[field.name] ?? "")).join("\t"));
    return [header, ...body].join("\n");
  }, [rows, fields, format]);

  function updateField(index: number, patch: Partial<FieldSpec>): void {
    setFields((current) => current.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  }

  /** Turn pasted JSON or CSV into a field list, guessing each column's type. */
  function detectFields(raw: string): void {
    const trimmed = raw.trim();
    if (!trimmed) {
      setSampleError("Paste a JSON array of objects or CSV with a header row first.");
      return;
    }

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      let value: unknown;
      try {
        value = JSON.parse(trimmed);
      } catch {
        setSampleError("That doesn't parse as JSON — check quotes, commas and brackets.");
        return;
      }
      const rows = Array.isArray(value) ? value : [value];
      if (rows.length === 0) {
        setSampleError("The JSON sample is empty — include at least one object.");
        return;
      }
      if (!rows.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))) {
        setSampleError("JSON sample must be an array of objects (or a single object).");
        return;
      }
      const keys = Array.from(new Set(rows.flatMap((item) => Object.keys(item as Record<string, unknown>))));
      const specs: FieldSpec[] = keys.map((key) => ({
        name: key,
        type: inferType(rows.map((item) => (item as Record<string, unknown>)[key])),
      }));
      setFields(specs);
      setSampleError("");
      setShowSample(false);
      return;
    }

    const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      setSampleError("Paste at least a header row.");
      return;
    }
    const table = lines.map(parseCsvLine);
    const header = table[0];
    if (header.some((cell) => !cell.trim())) {
      setSampleError("Every header column needs a name — or this isn't comma-separated.");
      return;
    }
    const specs: FieldSpec[] = header.map((name, column) => ({
      name: name.trim(),
      type: inferType(table.slice(1).map((row) => row[column] ?? "")),
    }));
    setFields(specs);
    setSampleError("");
    setShowSample(false);
  }

  function csvCell(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }

  const filename = `fake-data.${format === "json" ? "json" : format === "csv" ? "csv" : "tsv"}`;
  const mime = format === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          ariaLabel="Output format"
          value={format}
          onChange={setFormat}
          options={[
            { value: "json", label: "JSON" },
            { value: "table", label: "Table" },
            { value: "csv", label: "CSV" },
          ]}
        />
        <div className="ml-auto flex items-center gap-2">
          <CopyButton text={report} label="Copy" />
          <DownloadButton filename={filename} text={report} label="Download" mimeType={mime} />
        </div>
      </div>

      <Toolbox
        title="Fields"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-expanded={showSample}
              className="text-[11px] font-medium text-violet-600 hover:underline dark:text-violet-400"
              onClick={() => setShowSample((visible) => !visible)}
            >
              {showSample ? "Hide sample" : "Paste sample…"}
            </button>
            <span className="font-mono text-[10px] text-zinc-400">{fields.length} columns</span>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          {fields.length === 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No columns defined. Add a field below to start generating.
            </p>
          )}
          {fields.map((field, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className={`${inputClass} w-40`}
                value={field.name}
                onChange={(event) => updateField(index, { name: event.target.value })}
                aria-label={`Field ${index + 1} name`}
                spellCheck={false}
              />
              <select
                className={`${inputClass} min-w-0 flex-1`}
                value={field.type}
                onChange={(event) => updateField(index, { type: event.target.value as FieldType })}
                aria-label={`Field ${index + 1} type`}
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                aria-label={`Remove field ${field.name}`}
                onClick={() => setFields((current) => current.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFields((current) => [...current, { name: `field${current.length + 1}`, type: "words" }])}
            >
              + Add field
            </Button>
            <button
              type="button"
              className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
              onClick={() => setFields(defaultFields())}
            >
              Reset to defaults
            </button>
          </div>
          {showSample && (
            <div className="flex flex-col gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
              <textarea
                className="min-h-[120px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                value={sampleText}
                onChange={(event) => {
                  setSampleText(event.target.value);
                  setSampleError("");
                }}
                placeholder={'[{"name":"Ada","email":"ada@example.com","paid":true},{"name":"Grace","email":"grace@example.com","paid":false}]\n\nor CSV with a header row:\nname,email,paid\nAda,ada@example.com,true'}
                aria-label="Sample data"
                spellCheck={false}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => detectFields(sampleText)} disabled={!sampleText.trim()}>
                  Detect fields
                </Button>
                {sampleError && <p className="text-xs text-red-600 dark:text-red-400">{sampleError}</p>}
              </div>
              <Hint>
                Column names come from your sample and each column&apos;s type is guessed from its values — adjust any
                field afterwards.
              </Hint>
            </div>
          )}
        </div>
      </Toolbox>

      <div className="flex flex-wrap items-end gap-4">
        <Field label="Rows">
          <input
            className={`${inputClass} w-20`}
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(event) => setCount(Math.min(200, Math.max(1, Number(event.target.value) || 1)))}
            aria-label="Row count"
          />
        </Field>
        <Field label="Seed">
          <input
            className={`${inputClass} w-32`}
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            placeholder="demo"
            aria-label="Seed"
            spellCheck={false}
          />
        </Field>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Same seed + same fields = identical output, every time.
        </p>
        <div className="ml-auto">
          <Stat label="rows" value={rows.length} tone="ok" />
        </div>
      </div>

      <Toolbox title="Preview" actions={<span className="font-mono text-[10px] text-zinc-400">{count} rows · seed “{seed}”</span>}>
        {rows.length === 0 ? (
          <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">Add at least one field to generate rows.</p>
        ) : format === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
{fields.map((field) => (
                  <th key={field.name} className="py-1.5 pr-3 font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                    {field.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-zinc-100 dark:border-zinc-800/60">
                  {fields.map((field) => (
                    <td key={field.name} className="py-1.5 pr-3 font-mono text-zinc-700 dark:text-zinc-300">
                      {String(row[field.name] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <pre className="max-h-[320px] overflow-auto whitespace-pre rounded-lg bg-zinc-100 p-3 font-mono text-xs leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {report}
          </pre>
        )}
      </Toolbox>
    </div>
  );
}