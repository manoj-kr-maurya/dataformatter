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
} from "@/components/devtools/shared";
import { Button } from "@/components/ui/button";
import { generateRows, defaultFields, FIELD_TYPES, type FieldSpec, type FieldType } from "@/lib/fake-data/generate";

type Format = "table" | "json" | "csv";

export function FakeDataWorkbench() {
  const [fields, setFields] = useState<FieldSpec[]>(defaultFields());
  const [count, setCount] = useState(8);
  const [seed, setSeed] = useState("demo");
  const [format, setFormat] = useState<Format>("table");

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
            { value: "table", label: "Table" },
            { value: "json", label: "JSON" },
            { value: "csv", label: "CSV" },
          ]}
        />
        <div className="ml-auto flex items-center gap-2">
          <CopyButton text={report} label="Copy" />
          <DownloadButton filename={filename} text={report} label="Download" mimeType={mime} />
        </div>
      </div>

      <Toolbox title="Fields" actions={<span className="font-mono text-[10px] text-zinc-400">{fields.length} columns</span>}>
        <div className="flex flex-col gap-2">
          {fields.length === 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No columns defined. Add a field below to start generating.
            </p>
          )}
          {fields.map((field, index) => (
            <div key={`${index}-${field.name}`} className="flex items-center gap-2">
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