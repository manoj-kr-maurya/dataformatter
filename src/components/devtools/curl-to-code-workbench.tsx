"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  ClearButton,
  Segmented,
  Stat,
  Hint,
} from "@/components/devtools/shared";
import { CopyIcon } from "@/components/ui/icons";
import { parseCurlOrThrow, generateCurlCode, draftToCurl, CURL_CODE_TARGETS } from "@/lib/curl-codegen/codegen";
import { copyToClipboard } from "@/lib/clipboard/copy";

const SAMPLE = `curl --request POST 'https://api.example.com/orders?dryRun=true' \\
  --header 'Content-Type: application/json' \\
  --header 'Authorization: Bearer abc123' \\
  --data '{"qty": 2, "sku": "A-1"}'`;

export function CurlToCodeWorkbench() {
  const [command, setCommand] = useState(SAMPLE);
  const [target, setTarget] = useState(CURL_CODE_TARGETS[0].id);

  const { draft, error } = useMemo(() => {
    try {
      return { draft: parseCurlOrThrow(command), error: null };
    } catch (cause) {
      return { draft: null, error: `${cause instanceof Error ? cause.message : cause}` };
    }
  }, [command]);

  const generated = useMemo(() => {
    if (!draft || error) return { code: "", curl: "" };
    const targetRef = CURL_CODE_TARGETS.find((t) => t.id === target) ?? CURL_CODE_TARGETS[0];
    try {
      return { code: generateCurlCode(targetRef.id, draft), curl: draftToCurl(draft) };
    } catch (cause) {
      return { code: "", curl: "", error: `${cause instanceof Error ? cause.message : cause}` };
    }
  }, [draft, target, error]);

  const targetRef = CURL_CODE_TARGETS.find((t) => t.id === target) ?? CURL_CODE_TARGETS[0];
  const filename = `request.${targetRef.extension}`;
  const codeText = generated.code || "";
  const curlText = generated.curl || "";

  return (
    <div className="flex flex-col gap-3">
      <Toolbox title="cURL command" actions={<ClearButton onClick={() => setCommand("")} disabled={command.length === 0} />}>
        <textarea
          className="min-h-[150px] w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          aria-label="cURL command"
          spellCheck={false}
        />
        <Hint>Paste any cURL command, straight from a terminal or an API doc. Drafts are parsed locally.</Hint>
      </Toolbox>

      <div className="flex flex-wrap items-center gap-2">
        {draft && !error && (
          <>
            <Stat label="method" value={draft.method} />
            <Stat label="headers" value={draft.headers.length} />
            <Stat label="query" value={draft.query.length} />
            <Stat label="body" value={draft.bodyMode === "none" ? "none" : draft.bodyMode} />
          </>
        )}
        {draft && !error && (
          <div className="ml-auto">
            <Segmented
              ariaLabel="Target language"
              value={target}
              onChange={setTarget}
              options={CURL_CODE_TARGETS.map((t) => ({ value: t.id, label: t.label }))}
            />
          </div>
        )}
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>
      ) : (
        <>
          {draft && (
            <Toolbox
              title={`Generated ${targetRef.label}`}
              actions={
                <>
                  <CopyButton text={codeText} label="Copy" />
                  <DownloadButton filename={filename} text={codeText} label="Download" />
                </>
              }
            >
              <pre className="max-h-[420px] overflow-auto whitespace-pre rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100 dark:bg-zinc-900">
                {codeText || " "}
              </pre>
            </Toolbox>
          )}
          {draft && (
            <Toolbox
              title="Normalized cURL"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  title="Copy normalized cURL"
                  onClick={() => void copyToClipboard(curlText)}
                >
                  <CopyIcon className="h-3.5 w-3.5" />
                  Copy
                </Button>
              }
            >
              <pre className="max-h-[280px] overflow-auto whitespace-pre rounded-lg bg-zinc-100 p-3 font-mono text-xs leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {curlText || " "}
              </pre>
            </Toolbox>
          )}
        </>
      )}
    </div>
  );
}