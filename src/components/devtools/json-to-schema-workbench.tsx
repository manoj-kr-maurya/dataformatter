"use client";

import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  Segmented,
  Stat,
  Field,
  inputClass,
  Hint,
} from "@/components/devtools/shared";
import { parseJson } from "@/lib/json-diff/diff";
import { infer, rootObject, type SchemaNode } from "@/lib/json-schema/infer";
import { generateSchema, SCHEMA_GENERATORS } from "@/lib/json-schema/schema-gen";

const SAMPLE = `{
  "id": 42,
  "email": "ada@example.com",
  "roles": ["admin"],
  "createdAt": "2026-01-15T09:00:00Z"
}`;

export function JsonToSchemaWorkbench() {
  const [text, setText] = useState(SAMPLE);
  const [typeName, setTypeName] = useState("User");
  const [target, setTarget] = useState(SCHEMA_GENERATORS[0].id);

  const generator = SCHEMA_GENERATORS.find((gen) => gen.id === target) ?? SCHEMA_GENERATORS[0];

  const { schema, node, error } = useMemo(() => {
    const parsed = parseJson(text);
    if (!("value" in parsed)) {
      return { schema: "", node: null, error: `${parsed.error}` };
    }
    let node: SchemaNode;
    try {
      node = infer(parsed.value);
    } catch (cause) {
      return { schema: "", node: null, error: `Inference failed: ${String(cause)}` };
    }
    const root = rootObject(node);
    if (root.kind !== "object") {
      return { schema: "", node: null, error: "JSON→Schema expects an object at the root." };
    }
    try {
      return {
        schema: generateSchema(generator.id, root, typeName || "User"),
        node: root,
        error: null,
      };
    } catch (cause) {
      return { schema: "", node: null, error: `Generation failed: ${String(cause)}` };
    }
  }, [text, typeName, generator.id]);

  const filename = `${(typeName || "Model").replace(/[^A-Za-z0-9_-]/g, "_")}-schema.${generator.extension}`;
  const extToMime: Record<string, string> = {
    ts: "text/plain;charset=utf-8",
    py: "text/plain;charset=utf-8",
    yaml: "application/x-yaml;charset=utf-8",
    json: "application/json;charset=utf-8",
  };

  return (
    <div className="flex flex-col gap-3">
      <Toolbox title="JSON input" actions={<ClearButton onClick={() => setText("")} disabled={text.length === 0} />}>
        <div className="min-h-[220px]">
          <CodeEditor value={text} onChange={setText} language="json" ariaLabel="JSON input for schema generation" />
        </div>
        <Hint>Paste a JSON document (or several concatenated samples) to derive a validation schema.</Hint>
      </Toolbox>

      <div className="flex flex-wrap items-center gap-2">
        <Field label="Model name">
          <input
            className={inputClass}
            value={typeName}
            onChange={(event) => setTypeName(event.target.value)}
            placeholder="User"
            aria-label="Model name"
          />
        </Field>
        <div className="min-w-0 flex-1" />
        <Segmented
          ariaLabel="Schema format"
          value={target}
          onChange={setTarget}
          options={SCHEMA_GENERATORS.map((gen) => ({ value: gen.id, label: gen.label }))}
        />
      </div>

      {node && (
        <div className="flex flex-wrap items-center gap-2">
          <Stat label="props" value={node.props?.length ?? 0} />
          <Stat label="root" value={node.scalar ?? node.kind} />
          <Stat label="format hints" value={collectFormats(node)} />
        </div>
      )}

      <Toolbox
        title={`Generated ${generator.label}`}
        actions={
          <>
            <CopyButton text={schema} label="Copy" />
            <DownloadButton
              filename={filename}
              text={schema}
              label="Download"
              mimeType={extToMime[generator.extension] ?? "text/plain;charset=utf-8"}
            />
          </>
        }
      >
        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>
        ) : (
          <pre className="max-h-[420px] overflow-auto whitespace-pre rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100 dark:bg-zinc-900">
            {schema || " "}
          </pre>
        )}
      </Toolbox>
    </div>
  );
}

function collectFormats(node: SchemaNode): number {
  let count = 0;
  if (node.format) count++;
  for (const prop of node.props ?? []) count += collectFormats(prop.node);
  if (node.items) count += collectFormats(node.items);
  return count;
}