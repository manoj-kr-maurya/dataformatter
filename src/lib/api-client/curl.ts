import {
  HttpMethod,
  HTTP_METHODS,
  newRow,
  RequestDraft,
} from "@/lib/api-client/types";

/**
 * Imports a cURL command into an editable draft, mirroring how Postman fills
 * its form from pasted curl. Pure string-in/draft-out so it round-trips
 * through unit tests with no DOM involved.
 */

export function parseCurlCommand(command: string): RequestDraft {
  const tokens = tokenize(command);
  let index = 0;
  if (!tokens.length || !/^curl(\.exe)?$/i.test(tokens[0])) {
    throw new Error("Not a cURL command.");
  }
  index = 1;

  let method: HttpMethod | null = null;
  let url = "";
  let moveToQuery = false;
  let user: string | null = null;
  const headerPairs: [string, string][] = [];
  const dataParts: string[] = [];
  const formPairs: [string, string][] = [];
  let dataUrlencode = false;

  const nextValue = (): string => {
    const value = tokens[index + 1];
    index += 1;
    return value ?? "";
  };

  while (index < tokens.length) {
    const token = tokens[index];
    if (token === "--") {
      index += 1;
      while (index < tokens.length && !url) {
        url = tokens[index];
        index += 1;
      }
      break;
    }

    if (!token.startsWith("-")) {
      // Defense-in-depth for unknown value-taking flags: a bare file path is
      // never a URL candidate, so `--weird-flag /etc/hosts` stays inert.
      const pathLike = /^(\.{1,2}\/|\/)/.test(token);
      if (!url && !pathLike) {
        url = token;
      }
      index += 1;
      continue;
    }

    let name = token;
    let attached: string | undefined;
    const eq = token.indexOf("=");
    if (token.startsWith("--") && eq > 2) {
      name = token.slice(0, eq);
      attached = token.slice(eq + 1);
    } else if (SHORT_FLAGS.has(token.slice(0, 2)) && token.length > 2) {
      // Attached short value, e.g. -XPOST or -H"Accept: …"
      attached = token.slice(2);
    }

    const readValue = (): string => attached ?? nextValue();

    if (
      (token.startsWith("--") && LONG_FLAGS.has(name)) ||
      SHORT_FLAGS.has(token.slice(0, 2))
    ) {
      const kind = SHORT_TO_KIND[token.slice(0, 2)] ?? LONG_TO_KIND[name];
      switch (kind ?? "ignore") {
        case "method":
          method = normalizeMethod(readValue());
          break;
        case "header": {
          const pair = splitHeader(readValue());
          if (pair) {
            headerPairs.push(pair);
          }
          break;
        }
        case "data":
          dataParts.push(readValue());
          break;
        case "data-urlencode":
          dataParts.push(readValue());
          dataUrlencode = true;
          break;
        case "form": {
          const pair = splitFormPair(readValue());
          if (pair) {
            formPairs.push(pair);
          }
          break;
        }
        case "user":
          user = readValue();
          break;
        case "url":
          url = readValue();
          break;
        case "get":
          moveToQuery = true;
          break;
        case "user-agent":
        case "referer":
        case "cookie": {
          const kind = SHORT_TO_KIND[token.slice(0, 2)] ?? LONG_TO_KIND[name];
          const value = readValue();
          const headerName =
            kind === "user-agent"
              ? "User-Agent"
              : kind === "referer"
                ? "Referer"
                : "Cookie";
          headerPairs.push([headerName, value]);
          break;
        }
        case "ignore-value":
          // Modeled as a no-op but its argument must still be consumed so it
          // is not mistaken for the URL (e.g. `-o /dev/null`).
          readValue();
          break;
        default:
          break;
      }
      index += 1;
      continue;
    }

    // Unknown flag (possibly clustered shorts like -sS) — drop it wholesale.
    index += 1;
  }

  if (!url) {
    throw new Error("No URL found in the cURL command.");
  }
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const effectiveMethod =
    method ?? (moveToQuery || (dataParts.length === 0 && formPairs.length === 0) ? "GET" : "POST");

  const query = moveToQuery && dataParts.length > 0 ? rowsFromQueryString(dataParts.join("&")) ?? [] : [newRow()];
  let bodyText = "";
  const formRows = [newRow()];
  let bodyMode: RequestDraft["bodyMode"] = "none";
  const hasBodyTarget = !moveToQuery && effectiveMethod !== "GET" && effectiveMethod !== "HEAD";

  if (hasBodyTarget && formPairs.length > 0) {
    bodyMode = "form-data";
    formRows.length = 0;
    for (const [key, value] of formPairs) {
      formRows.push(newRow(key, value));
    }
  } else if (hasBodyTarget && dataParts.length > 0) {
    const joined = dataParts.join("&");
    const contentType = headerPairs.find(([key]) => key.toLowerCase() === "content-type")?.[1] ?? "";
    const asRows = rowsFromQueryString(joined);
    if (contentType.includes("json") || /^[{[]/.test(joined.trim())) {
      bodyMode = "json";
      // Normalize indentation so imported payloads read like Postman's editor.
      try {
        bodyText = JSON.stringify(JSON.parse(joined), null, 2);
      } catch {
        bodyText = joined;
      }
    } else if ((dataUrlencode || !contentType) && asRows) {
      bodyMode = "urlencoded";
      formRows.length = 0;
      for (const row of asRows) {
        formRows.push(row);
      }
    } else {
      bodyMode = "text";
      bodyText = joined;
    }
  }

  let authMode: RequestDraft["authMode"] = "none";
  let basicUsername = "";
  let basicPassword = "";
  if (user != null) {
    const separator = user.indexOf(":");
    authMode = "basic";
    basicUsername = separator === -1 ? user : user.slice(0, separator);
    basicPassword = separator === -1 ? "" : user.slice(separator + 1);
  }

  return {
    method: effectiveMethod,
    url,
    query,
    headers: headerPairs.map(([key, value]) => newRow(key, value)),
    bodyMode,
    bodyText,
    formRows,
    authMode,
    bearerToken: "",
    basicUsername,
    basicPassword,
  };
}

/** Value-taking flags we do not model — their argument must be swallowed. */
const IGNORE_VALUE_FLAGS = new Set([
  "-o",
  "-D",
  "-m",
  "-w",
  "-x",
  "--output",
  "--dump-header",
  "--max-time",
  "--connect-timeout",
  "--write-out",
  "--proxy",
  "--retry",
]);

const SHORT_FLAGS = new Set([
  "-X",
  "-H",
  "-d",
  "-F",
  "-u",
  "-A",
  "-e",
  "-b",
  "-G",
  ...IGNORE_VALUE_FLAGS,
]);

const LONG_FLAGS = new Set([
  "--request",
  "--header",
  "--data",
  "--data-raw",
  "--data-binary",
  "--data-ascii",
  "--data-urlencode",
  "--form",
  "--form-string",
  "--user",
  "--url",
  "--get",
  "--user-agent",
  "--referer",
  "--cookie",
  ...IGNORE_VALUE_FLAGS,
]);

const SHORT_TO_KIND: Record<string, string> = {
  "-X": "method",
  "-H": "header",
  "-d": "data",
  "-F": "form",
  "-u": "user",
  "-A": "user-agent",
  "-e": "referer",
  "-b": "cookie",
  "-G": "get",
  "-o": "ignore-value",
  "-D": "ignore-value",
  "-m": "ignore-value",
  "-w": "ignore-value",
  "-x": "ignore-value",
};

const LONG_TO_KIND: Record<string, string> = {
  "--request": "method",
  "--header": "header",
  "--data": "data",
  "--data-raw": "data",
  "--data-binary": "data",
  "--data-ascii": "data",
  "--data-urlencode": "data-urlencode",
  "--form": "form",
  "--form-string": "form",
  "--user": "user",
  "--url": "url",
  "--get": "get",
  "--user-agent": "user-agent",
  "--referer": "referer",
  "--cookie": "cookie",
  "--output": "ignore-value",
  "--dump-header": "ignore-value",
  "--max-time": "ignore-value",
  "--connect-timeout": "ignore-value",
  "--write-out": "ignore-value",
  "--proxy": "ignore-value",
  "--retry": "ignore-value",
};

/** Split a header string on the FIRST colon so values may contain more. */
function splitHeader(value: string): [string, string] | null {
  const colon = value.indexOf(":");
  if (colon <= 0) {
    return null;
  }
  const key = value.slice(0, colon).trim();
  const headerValue = value.slice(colon + 1).trim();
  if (!key || !headerValue) {
    return null;
  }
  return [key, headerValue];
}

/**
 * Form pairs look like `name=value`; `name=@file` cannot be reproduced by a
 * purely client-side client, so the path is kept visible as the value.
 */
function splitFormPair(value: string): [string, string] | null {
  const equals = value.indexOf("=");
  if (equals <= 0) {
    return null;
  }
  const key = value.slice(0, equals);
  let pairValue = value.slice(equals + 1);
  if (pairValue.startsWith("@") || pairValue.startsWith("<")) {
    pairValue = pairValue.slice(1);
  }
  return [key, pairValue];
}

/**
 * Strict query-string split: only accepts `k=v` for every &-segment (values
 * may contain further `=`). Returns null when the payload is free-form text
 * so callers can fall back to raw modes instead of corrupting data.
 */
function rowsFromQueryString(value: string): RequestDraft["query"] | null {
  if (value.trim().length === 0) {
    return null;
  }
  const rows = [];
  for (const segment of value.split("&")) {
    const equals = segment.indexOf("=");
    if (equals <= 0) {
      return null;
    }
    rows.push(newRow(segment.slice(0, equals), segment.slice(equals + 1)));
  }
  return rows.some((row) => row.name.trim().length > 0) ? rows : null;
}

function normalizeMethod(value: string): HttpMethod | null {
  const upper = value.trim().toUpperCase();
  return HTTP_METHODS.find((method) => method === upper) ?? null;
}

/**
 * POSIX-ish shell tokenizer: single quotes are literal, double quotes honor
 * backslash escapes, $'…' decodes \n/\t/\r, backslash escapes the next byte,
 * and backslash-newline continuations collapse beforehand.
 */
export function tokenize(input: string): string[] {
  const source = input.replace(/\\\r?\n/g, " ");
  const tokens: string[] = [];
  let current = "";
  let started = false;
  let i = 0;

  const flush = () => {
    if (started) {
      tokens.push(current);
      current = "";
      started = false;
    }
  };

  while (i < source.length) {
    const char = source[i];

    if (char === "'" ) {
      const end = source.indexOf("'", i + 1);
      if (end === -1) {
        current += source.slice(i + 1);
        i = source.length;
      } else {
        current += source.slice(i + 1, end);
        i = end + 1;
      }
      started = true;
      continue;
    }

    if (char === "$" && source[i + 1] === "'") {
      i += 2;
      while (i < source.length && source[i] !== "'") {
        if (source[i] === "\\" && i + 1 < source.length) {
          const escape = source[i + 1];
          current += escape === "n" ? "\n" : escape === "t" ? "\t" : escape === "r" ? "\r" : escape;
          i += 2;
        } else {
          current += source[i];
          i += 1;
        }
      }
      i += 1;
      started = true;
      continue;
    }

    if (char === '"') {
      i += 1;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === "\\" && i + 1 < source.length && /[$`"\\]/.test(source[i + 1])) {
          current += source[i + 1];
          i += 2;
        } else {
          current += source[i];
          i += 1;
        }
      }
      i += 1;
      started = true;
      continue;
    }

    if (char === "\\") {
      if (i + 1 < source.length) {
        current += source[i + 1];
        started = true;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (/\s/.test(char)) {
      flush();
      i += 1;
      continue;
    }

    current += char;
    started = true;
    i += 1;
  }

  flush();
  return tokens;
}
