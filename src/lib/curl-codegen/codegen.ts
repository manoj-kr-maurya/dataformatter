import {
  type RequestDraft,
  HTTP_METHODS,
} from "@/lib/api-client/types";
import { parseCurlCommand, tokenize } from "@/lib/api-client/curl";
import { buildUrl, buildHeaders } from "@/lib/api-client/request";

/**
 * cURL ↔ code generators. Input is parsed with the API client's production
 * cURL parser into a RequestDraft, then rendered per language — no regex-only
 * parsing, and full parity with what the API client can actually import.
 */

export interface CurlCodeTarget {
  id: string;
  label: string;
  extension: string;
  generate: (draft: RequestDraft) => string;
}

export function parseCurlToDraft(command: string): RequestDraft {
  return parseCurlCommand(command);
}

/** Final request URL including every active query parameter. */
function absoluteUrl(draft: RequestDraft): string {
  try {
    return buildUrl(draft).toString();
  } catch {
    return draft.url;
  }
}

/** Header list with auth resolved, mirroring what fetch would send. */
function resolvedHeaders(draft: RequestDraft): [string, string][] {
  return buildHeaders(draft);
}

function bodyFor(draft: RequestDraft): string | null {
  if (draft.bodyMode === "json" || draft.bodyMode === "text") {
    return draft.bodyText;
  }
  if (draft.bodyMode === "urlencoded") {
    const params = new URLSearchParams();
    for (const row of draft.formRows) {
      if (row.enabled && row.name.trim()) params.append(row.name, row.value);
    }
    return params.toString();
  }
  return null;
}

const quoteJs = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${").replace(/\n/g, "\\n");

const quotePy = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

const quoteDouble = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

// ------------------------------------------------------------- JavaScript

const fetchGenerator: CurlCodeTarget = {
  id: "fetch",
  label: "JavaScript fetch",
  extension: "js",
  generate: (draft) => {
    const lines: string[] = [];
    const body = bodyFor(draft);
    if (draft.method !== "GET") {
      lines.push(`const options = {`);
      lines.push(`  method: '${draft.method}',`);
      lines.push(`  headers: {`);
      for (const [name, value] of resolvedHeaders(draft)) {
        lines.push(`    '${name}': '${quoteJs(value)}',`);
      }
      lines.push(`  },`);
      if (body != null) {
        lines.push(`  body: ${draft.bodyMode === "json" ? `JSON.stringify(${JSON.stringify(draft.bodyText)})` : `'${quoteJs(body)}'`},`);
      }
      lines.push(`};`);
      lines.push(``);
      lines.push(`const response = await fetch('${quoteJs(absoluteUrl(draft))}', options);`);
    } else {
      lines.push(`const response = await fetch('${quoteJs(absoluteUrl(draft))}', {`);
      lines.push(`  headers: {`);
      for (const [name, value] of resolvedHeaders(draft)) {
        lines.push(`    '${name}': '${quoteJs(value)}',`);
      }
      lines.push(`  }`);
      lines.push(`});`);
    }
    lines.push(`const data = await response.json();`);
    lines.push(`console.log(data);`);
    return lines.join("\n");
  },
};

const axiosGenerator: CurlCodeTarget = {
  id: "axios",
  label: "Axios",
  extension: "js",
  generate: (draft) => {
    const body = bodyFor(draft);
    const lines: string[] = [];
    lines.push(`const data = await axios.request({`);
    lines.push(`  method: '${draft.method}',`);
    lines.push(`  url: '${quoteJs(absoluteUrl(draft))}',`);
    if (resolvedHeaders(draft).length > 0) {
      lines.push(`  headers: {`);
      for (const [name, value] of resolvedHeaders(draft)) {
        lines.push(`    '${name}': '${quoteJs(value)}',`);
      }
      lines.push(`  },`);
    }
    if (body != null) {
      lines.push(`  data: ${draft.bodyMode === "json" ? `${JSON.stringify(draft.bodyText)}` : `'${quoteJs(body)}'`},`);
    }
    lines.push(`});`);
    lines.push(`console.log(data);`);
    return lines.join("\n");
  },
};

// ---------------------------------------------------------------- Python

const pythonRequestsGenerator: CurlCodeTarget = {
  id: "python",
  label: "Python requests",
  extension: "py",
  generate: (draft) => {
    const lines: string[] = ["import requests", ""];
    const headers = resolvedHeaders(draft);
    if (headers.length > 0) {
      lines.push("headers = {");
      for (const [name, value] of headers) {
        lines.push(`    "${name}": "${quotePy(value)}",`);
      }
      lines.push("}", "");
    }
    const body = bodyFor(draft);
    const payload = draft.bodyMode === "json" && body ? JSON.stringify(draft.bodyText) : body ? `"${quotePy(body)}"` : null;
    lines.push(`response = requests.request(`);
    lines.push(`    "${draft.method}",`);
    lines.push(`    "${quotePy(absoluteUrl(draft))}",`);
    if (headers.length > 0) lines.push(`    headers=headers,`);
    if (payload != null) {
      lines.push(`    data=${payload},`);
      if (draft.bodyMode === "json") lines.push(`    json=json.loads(${JSON.stringify(draft.bodyText)}),`);
    }
    lines.push(`)`, "");
    lines.push(`print(response.status_code)`);
    lines.push(`print(response.text)`);
    return lines.join("\n");
  },
};

// ------------------------------------------------------------------ Java

const javaGenerator: CurlCodeTarget = {
  id: "java",
  label: "Java (HttpClient)",
  extension: "java",
  generate: (draft) => {
    const lines: string[] = [];
    const body = bodyFor(draft);
    lines.push(`HttpClient client = HttpClient.newHttpClient();`, "");
    lines.push(`HttpRequest request = HttpRequest.newBuilder()`);
    lines.push(`    .uri(URI.create("${quoteDouble(absoluteUrl(draft))}"))`);
    lines.push(`    .method("${draft.method}", ${body != null ? `HttpRequest.BodyPublishers.ofString("${quoteDouble(body)}")` : "HttpRequest.BodyPublishers.noBody()"})`);
    for (const [name, value] of resolvedHeaders(draft)) {
      lines.push(`    .header("${quoteDouble(name)}", "${quoteDouble(value)}")`);
    }
    lines.push(`    .build();`, "");
    lines.push(`HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`);
    lines.push(`System.out.println(response.statusCode());`);
    lines.push(`System.out.println(response.body());`);
    return lines.join("\n");
  },
};

// --------------------------------------------------------------------- Go

const goGenerator: CurlCodeTarget = {
  id: "go",
  label: "Go",
  extension: "go",
  generate: (draft) => {
    const lines: string[] = [];
    const body = bodyFor(draft);
    lines.push(`package main`, "", `import (`, `    "fmt"`, `    "io"`, `    "net/http"`, `    "strings"`, `)`, "");
    lines.push(`func main() {`);
    if (body != null) {
      lines.push(`    payload := strings.NewReader("${quoteDouble(body)}")`);
      lines.push(`    req, err := http.NewRequest("${draft.method}", "${quoteDouble(absoluteUrl(draft))}", payload)`);
    } else {
      lines.push(`    req, err := http.NewRequest("${draft.method}", "${quoteDouble(absoluteUrl(draft))}", nil)`);
    }
    lines.push(`    if err != nil {`, `        panic(err)`, `    }`);
    for (const [name, value] of resolvedHeaders(draft)) {
      lines.push(`    req.Header.Set("${quoteDouble(name)}", "${quoteDouble(value)}")`);
    }
    lines.push(`    resp, err := http.DefaultClient.Do(req)`);
    lines.push(`    if err != nil {`, `        panic(err)`, `    }`);
    lines.push(`    defer resp.Body.Close()`);
    lines.push(`    body, _ := io.ReadAll(resp.Body)`);
    lines.push(`    fmt.Println(resp.StatusCode)`);
    lines.push(`    fmt.Println(string(body))`);
    lines.push(`}`);
    return lines.join("\n");
  },
};

// --------------------------------------------------------------------- C#

const csharpGenerator: CurlCodeTarget = {
  id: "csharp",
  label: "C# (HttpClient)",
  extension: "cs",
  generate: (draft) => {
    const lines: string[] = [];
    const body = bodyFor(draft);
    lines.push(`using System;`);
    lines.push(`using System.Net.Http;`);
    lines.push(`using System.Net.Http.Headers;`, "");
    lines.push(`using var client = new HttpClient();`);
    lines.push(`var request = new HttpRequestMessage(HttpMethod.${pascalMethod(draft.method)}, "${quoteDouble(absoluteUrl(draft))}");`);
    for (const [name, value] of resolvedHeaders(draft)) {
      if (name.toLowerCase() === "content-type") {
        lines.push(`request.Content = new StringContent("${quoteDouble(body ?? "")}");`);
        lines.push(`request.Content.Headers.ContentType = new MediaTypeHeaderValue("${value}");`);
      } else if (name.toLowerCase() === "authorization") {
        lines.push(`request.Headers.TryAddWithoutValidation("Authorization", "${quoteDouble(value)}");`);
      } else {
        lines.push(`request.Headers.TryAddWithoutValidation("${quoteDouble(name)}", "${quoteDouble(value)}");`);
      }
    }
    lines.push(`var response = await client.SendAsync(request);`);
    lines.push(`Console.WriteLine((int)response.StatusCode);`);
    lines.push(`Console.WriteLine(await response.Content.ReadAsStringAsync());`);
    return lines.join("\n");
  },
};

function pascalMethod(method: string): string {
  const found = HTTP_METHODS.find((m) => m === method);
  return found ? found.charAt(0) + found.slice(1).toLowerCase() : "Get";
}

// -------------------------------------------------------------------- PHP

const phpGenerator: CurlCodeTarget = {
  id: "php",
  label: "PHP (cURL)",
  extension: "php",
  generate: (draft) => {
    const lines: string[] = [];
    const body = bodyFor(draft);
    lines.push(`<?php`, "");
    lines.push(`$curl = curl_init();`);
    lines.push(`curl_setopt_array($curl, [`);
    lines.push(`    CURLOPT_URL => '${quoteDouble(absoluteUrl(draft))}',`);
    lines.push(`    CURLOPT_RETURNTRANSFER => true,`);
    lines.push(`    CURLOPT_CUSTOMREQUEST => '${draft.method}',`);
    if (body != null) {
      lines.push(`    CURLOPT_POSTFIELDS => '${quoteDouble(body)}',`);
    }
    const headers = resolvedHeaders(draft).map(([name, value]) => `'${quoteDouble(name)}: ${quoteDouble(value)}'`).join(", ");
    if (headers.length > 0) {
      lines.push(`    CURLOPT_HTTPHEADER => [${headers}],`);
    }
    lines.push(`]);`, "");
    lines.push(`$response = curl_exec($curl);`);
    lines.push(`$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);`);
    lines.push(`curl_close($curl);`, "");
    lines.push(`echo $status, "\\n", $response;`);
    return lines.join("\n");
  },
};

export const CURL_CODE_TARGETS: readonly CurlCodeTarget[] = [
  fetchGenerator,
  axiosGenerator,
  pythonRequestsGenerator,
  javaGenerator,
  goGenerator,
  csharpGenerator,
  phpGenerator,
];

export function generateCurlCode(id: string, draft: RequestDraft): string {
  const target = CURL_CODE_TARGETS.find((t) => t.id === id);
  if (!target) throw new Error(`Unknown cURL code target "${id}"`);
  return target.generate(draft);
}

/** Code/command → cURL: render an editable RequestDraft back to a curl string. */
export function draftToCurl(draft: RequestDraft): string {
  const parts: string[] = ["curl"];
  parts.push(`--request ${draft.method}`);
  parts.push(`--url ${shellQuote(absoluteUrl(draft))}`);
  for (const [name, value] of resolvedHeaders(draft)) {
    parts.push(`--header ${shellQuote(`${name}: ${value}`)}`);
  }
  const body = bodyFor(draft);
  if (body != null && body.length > 0) {
    parts.push(`--data ${shellQuote(body)}`);
  }
  if (draft.authMode === "basic" && (draft.basicUsername || draft.basicPassword)) {
    parts.push(`--user ${shellQuote(`${draft.basicUsername}:${draft.basicPassword}`)}`);
  }
  return parts.join(" \\\n  ");
}

function shellQuote(value: string): string {
  if (!/[\s'"]/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** Validate that a paste looks like cURL and extract its draft, or throw. */
export function parseCurlOrThrow(command: string): RequestDraft {
  if (typeof command !== "string") throw new Error("Paste a cURL command.");
  const tokens = tokenize(command);
  if (tokens.length === 0 || !/^curl(\.exe)?$/i.test(tokens[0])) {
    throw new Error("That doesn't look like a cURL command (expected it to start with `curl`).");
  }
  return parseCurlCommand(command);
}