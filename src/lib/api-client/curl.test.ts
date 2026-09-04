import { describe, expect, it } from "vitest";
import { parseCurlCommand, tokenize } from "@/lib/api-client/curl";

describe("tokenize", () => {
  it("splits on whitespace and collapses backslash-newline continuations", () => {
    expect(tokenize("curl \\\n  https://a.dev \\\n  -X POST")).toEqual([
      "curl",
      "https://a.dev",
      "-X",
      "POST",
    ]);
  });

  it("keeps single-quoted content literally, including spaces and quotes", () => {
    expect(tokenize(`-H 'Content-Type: application/json'`)).toEqual([
      "-H",
      "Content-Type: application/json",
    ]);
    expect(tokenize(`-d '{"a":"b"}'`)).toEqual(["-d", '{"a":"b"}']);
    expect(
      tokenize(`--data-raw 'select * from t where x = '"'"'y'"'"''`),
    ).toEqual(["--data-raw", `select * from t where x = 'y'`]);
  });

  it("decodes $'\\n' escapes inside double quotes and ANSI-C strings", () => {
    expect(tokenize(`-d $'{\n"a":1}'`)).toEqual(["-d", '{\n"a":1}']);
    expect(tokenize(`"line\\nbreak"`)).toEqual(["line\\nbreak"]);
  });
});

describe("parseCurlCommand", () => {
  it("imports method, URL and headers", () => {
    const draft = parseCurlCommand([
      "curl -X POST 'https://api.example.com/orders?dryRun=true' \\",
      "  -H 'Content-Type: application/json' \\",
      "  -H 'Authorization: Bearer abc123'",
    ].join("\n"));
    expect(draft.method).toBe("POST");
    expect(draft.url).toBe("https://api.example.com/orders?dryRun=true");
    const headers = draft.headers.map((row) => [row.name, row.value]);
    expect(headers).toContainEqual(["Content-Type", "application/json"]);
    expect(headers).toContainEqual(["Authorization", "Bearer abc123"]);
    // query string already in the URL — params tab stays empty-but-ready
    expect(draft.query.every((row) => row.name === "")).toBe(true);
  });

  it("detects JSON bodies, pretty-prints them, and defaults to POST when -d is present without -X", () => {
    const draft = parseCurlCommand(
      `curl https://api.example.com/items -H 'Content-Type: application/json' -d '{"qty":2}'`,
    );
    expect(draft.method).toBe("POST");
    expect(draft.bodyMode).toBe("json");
    expect(draft.bodyText).toBe('{\n  "qty": 2\n}');
  });

  it("keeps unparseable JSON bodies verbatim instead of failing", () => {
    const draft = parseCurlCommand(
      `curl -X POST -H 'Content-Type: application/json' -d '{"qty":' https://api.example.com/items`,
    );
    expect(draft.bodyMode).toBe("json");
    expect(draft.bodyText).toBe('{"qty":');
  });

  it("routes k=v payloads to urlencoded rows", () => {
    const draft = parseCurlCommand(
      `curl -d 'a=1&b=two+words' https://api.example.com/form`,
    );
    expect(draft.method).toBe("POST");
    expect(draft.bodyMode).toBe("urlencoded");
    expect(draft.formRows.map((row) => row.name)).toEqual(["a", "b"]);
  });

  it("falls back to raw text for free-form bodies", () => {
    const draft = parseCurlCommand(
      `curl --data-binary 'hello there, no pairs here' https://api.example.com/echo`,
    );
    expect(draft.bodyMode).toBe("text");
    expect(draft.bodyText).toBe("hello there, no pairs here");
  });

  it("-G moves --data into the query string with GET", () => {
    const draft = parseCurlCommand(
      `curl -G -d 'page=2' -d 'size=10' https://api.example.com/search`,
    );
    expect(draft.method).toBe("GET");
    expect(draft.query.map((row) => row.name)).toEqual(["page", "size"]);
    expect(draft.bodyMode).toBe("none");
  });

  it("maps -F to form-data rows and strips the @file marker", () => {
    const draft = parseCurlCommand(
      `curl -F 'name=widget' -F 'doc=@report.pdf' https://api.example.com/upload`,
    );
    expect(draft.method).toBe("POST");
    expect(draft.bodyMode).toBe("form-data");
    expect(draft.formRows[0]).toMatchObject({ name: "name", value: "widget" });
    expect(draft.formRows[1]).toMatchObject({ name: "doc", value: "report.pdf" });
  });

  it("fills basic auth from -u instead of a header row", () => {
    const draft = parseCurlCommand(
      `curl -u ada:s3cret:x https://api.example.com/me`,
    );
    expect(draft.authMode).toBe("basic");
    expect(draft.basicUsername).toBe("ada");
    expect(draft.basicPassword).toBe("s3cret:x");
    expect(draft.headers.some((row) => row.name.toLowerCase() === "authorization")).toBe(false);
  });

  it("adds user-agent/cookie headers as rows (browser will warn about them)", () => {
    const draft = parseCurlCommand(
      `curl -A 'robot' --cookie 'k=v' -e 'https://ref.example' https://api.example.com/`,
    );
    const names = draft.headers.map((row) => row.name);
    expect(names).toEqual(expect.arrayContaining(["User-Agent", "Cookie", "Referer"]));
  });

  it("ignores flags we do not model and still finds the URL", () => {
    const draft = parseCurlCommand(
      `curl -sS -L --compressed -k -o /dev/null https://api.example.com/ping`,
    );
    expect(draft.url).toBe("https://api.example.com/ping");
    expect(draft.method).toBe("GET");
  });

  it("prepends https:// to scheme-less URLs and accepts --request=METHOD", () => {
    const draft = parseCurlCommand(
      `curl --request=DELETE --url api.example.com/things/7`,
    );
    expect(draft.url).toBe("https://api.example.com/things/7");
    expect(draft.method).toBe("DELETE");
  });

  it("throws when no URL is present", () => {
    expect(() => parseCurlCommand("curl -X POST")).toThrow(/No URL found/);
  });
});
