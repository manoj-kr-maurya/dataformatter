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
  Hint,
  Field,
  inputClass,
} from "@/components/devtools/shared";
import { parseJson } from "@/lib/json-diff/diff";
import { infer, rootObject, type SchemaNode } from "@/lib/json-schema/infer";
import { generateCode, CODE_GENERATORS } from "@/lib/json-schema/codegen";

const SAMPLE = `{
  "id": 42,
  "name": "DataFormatter",
  "roles": ["admin", "editor"],
  "profile": { "joined": "2026-01-15", "active": true }
}`;

export function JsonToCodeWorkbench() {
  const [text, setText] = useState(SAMPLE);
  const [typeName, setTypeName] = useState("User");
  const [target, setTarget] = useState(CODE_GENERATORS[0].id);

  const generator = CODE_GENERATORS.find((gen) => gen.id === target) ?? CODE_GENERATORS[0];

  const { code, node, error } = useMemo(() => {
    const parsed = parseJson(text);
    if (!("value" in parsed)) {
      return { code: "", node: null, error: `${parsed.error}` };
    }
    let node: SchemaNode;
    try {
      node = infer(parsed.value);
    } catch (cause) {
      return { code: "", node: null, error: `Inference failed: ${String(cause)}` };
    }
    const root = rootObject(node);
    if (root.kind !== "object") {
      return { code: "", node: null, error: "JSON→code expects an object at the root (or a single sample)." };
    }
    try {
      return {
        code: generateCode(generator.id, root, typeName || "User"),
        node: root,
        error: null,
      };
    } catch (cause) {
      return { code: "", node: null, error: `Generation failed: ${String(cause)}` };
    }
  }, [text, typeName, generator.id]);

  const filename = `${(typeName || "Model").replace(/[^A-Za-z0-9_-]/g, "_")}.${generator.extension}`;

  return (
    <div className="flex flex-col gap-3">
      <Toolbox title="JSON input" actions={<ClearButton onClick={() => setText("")} disabled={text.length === 0} />}>
        <div className="min-h-[220px]">
          <CodeEditor value={text} onChange={setText} language="json" ariaLabel="JSON input for code generation" />
        </div>
        <Hint>Paste any JSON document. The tool infers a type and emits idiomatic code for your chosen language.</Hint>
      </Toolbox>

      <div className="flex flex-wrap items-center gap-2">
        <Field label="Target type name">
          <input
            className={inputClass}
            value={typeName}
            onChange={(event) => setTypeName(event.target.value)}
            placeholder="User"
            aria-label="Target type name"
          />
        </Field>
        <div className="ml-auto">
          <Segmented ariaLabel="Code language" value={target} onChange={setTarget} options={CODE_GENERATORS.map((gen) => ({ value: gen.id, label: gen.label }))} />
        </div>
      </div>

      {node && (
        <div className="flex flex-wrap items-center gap-2">
          <Stat label="props" value={node.props?.length ?? 0} />
          <Stat label="array items" value={node.items ? "yes" : "no"} />
          <Stat label="root" value={node.scalar ?? node.kind} />
        </div>
      )}

      <Toolbox
        title={`Generated ${generator.label}`}
        actions={
          <>
            <CopyButton text={code} label="Copy" />
            <DownloadButton filename={filename} text={code} label="Download" mimeType="text/plain;charset=utf-8" />
          </>
        }
      >
        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>
        ) : (
          <pre className="max-h-[420px] overflow-auto whitespace-pre rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100 dark:bg-zinc-900">
            {code || " "}
          </pre>
        )}
      </Toolbox>
    </div>
  );
}